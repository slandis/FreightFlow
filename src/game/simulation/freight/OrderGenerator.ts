import type { ActiveContract } from "../core/GameState";
import type { DifficultyModeConfig } from "../config/difficulty";
import type { RandomService } from "../core/RandomService";
import { applyDemandVolatility } from "../config/difficulty";
import {
  rollNextOutboundEligibleTick,
  rollOutboundRetryTick,
} from "../contracts/contractScheduling";
import type { DomainEvent } from "../events/DomainEvent";
import { createId } from "../types/ids";
import type { FreightFlowState } from "./FreightFlowState";

const BASE_MIN_ORDER_CUBIC_FEET = 300;
const BASE_MAX_ORDER_CUBIC_FEET = 900;
const ORDER_DUE_TICKS = 720;
const MIN_AVAILABLE_INVENTORY_CUBIC_FEET = 1200;
const MAX_ACTIVE_OUTBOUND_ORDERS = 5;
const OUTBOUND_EVALUATION_INTERVAL_TICKS = 2;

type EventFactory = <TType extends string>(type: TType) => DomainEvent<TType>;

export class OrderGenerator {
  generateOutbound(
    freightFlow: FreightFlowState,
    currentTick: number,
    random: RandomService,
    createEvent: EventFactory,
    difficultyMode: DifficultyModeConfig,
    activeContracts: ActiveContract[] = [],
  ): DomainEvent[] {
    if (currentTick === 0) {
      return [];
    }

    if (currentTick % OUTBOUND_EVALUATION_INTERVAL_TICKS !== 0) {
      return [];
    }

    if (getActiveOutboundOrderCount(freightFlow) >= MAX_ACTIVE_OUTBOUND_ORDERS) {
      return [];
    }

    if (!hasDueOutboundContract(activeContracts, currentTick)) {
      return [];
    }

    const availableInventory = getAvailableInventoryByContractAndFreightClass(freightFlow);
    const totalAvailableInventory = Object.values(availableInventory).reduce(
      (total, cubicFeet) => total + cubicFeet,
      0,
    );

    if (totalAvailableInventory < MIN_AVAILABLE_INVENTORY_CUBIC_FEET) {
      retryDueOutboundContracts(activeContracts, currentTick, random);
      return [];
    }
    const selected = selectNextOutboundContract(
      activeContracts,
      currentTick,
      availableInventory,
      random,
    );

    if (!selected) {
      return [];
    }

    const { contract, contractId, freightClassId, availableCubicFeet } = selected;
    contract.nextOutboundEligibleTick = rollNextOutboundEligibleTick(
      currentTick,
      contract,
      difficultyMode,
      random,
    );
    const minimumCubicFeet = Math.max(
      1,
      Math.round(BASE_MIN_ORDER_CUBIC_FEET * difficultyMode.outboundVolumeMultiplier),
    );
    const maximumCubicFeet = Math.max(
      minimumCubicFeet,
      Math.round(BASE_MAX_ORDER_CUBIC_FEET * difficultyMode.outboundVolumeMultiplier),
    );
    const requestedCubicFeet = Math.min(
      applyDemandVolatility(
        random.nextInt(minimumCubicFeet, maximumCubicFeet),
        difficultyMode.id,
        random.next(),
        minimumCubicFeet,
        maximumCubicFeet,
      ),
      availableCubicFeet,
    );
    const orderId = createId("outbound-order", freightFlow.nextOutboundOrderSequence);

    freightFlow.nextOutboundOrderSequence += 1;
    freightFlow.metrics.totalOutboundOrdersCreated += 1;
    freightFlow.outboundOrders.push({
      id: orderId,
      contractId,
      freightClassId,
      requestedCubicFeet,
      fulfilledCubicFeet: 0,
      state: "open",
      createdTick: currentTick,
      dueTick: currentTick + ORDER_DUE_TICKS,
      freightBatchIds: [],
      outboundTrailerId: null,
      blockedReason: null,
      remainingPickCubicFeet: requestedCubicFeet,
      remainingLoadCubicFeet: requestedCubicFeet,
      revenueRecognizedTick: null,
      recognizedRevenue: 0,
      recognizedPenalty: 0,
    });

    const event = {
      ...createEvent("outbound-order-created"),
      outboundOrderId: orderId,
      freightClassId,
      requestedCubicFeet,
    };

    return [event];
  }
}

function selectNextOutboundContract(
  activeContracts: ActiveContract[],
  currentTick: number,
  availableInventory: Record<string, number>,
  random: RandomService,
): {
  contract: ActiveContract;
  contractId: string;
  freightClassId: string;
  availableCubicFeet: number;
} | null {
  let selectedContract:
    | {
        contract: ActiveContract;
        contractId: string;
        freightClassId: string;
        availableCubicFeet: number;
        dueTick: number;
      }
    | null = null;

  for (const contract of activeContracts) {
    if (contract.nextOutboundEligibleTick > currentTick) {
      continue;
    }

    const matchingInventory = getAvailableInventoryEntryForContract(contract, availableInventory);
    const inventoryKey = matchingInventory?.[0] ?? null;
    const contractAvailableCubicFeet = matchingInventory?.[1] ?? 0;

    if (contractAvailableCubicFeet <= 0 || !inventoryKey) {
      contract.nextOutboundEligibleTick = rollOutboundRetryTick(currentTick, random);
      continue;
    }

    const [candidateContractId, candidateFreightClassId] = inventoryKey.split("::");

    if (
      !selectedContract ||
      contract.nextOutboundEligibleTick < selectedContract.dueTick ||
      (contract.nextOutboundEligibleTick === selectedContract.dueTick &&
        candidateContractId.localeCompare(selectedContract.contractId) < 0)
    ) {
      selectedContract = {
        contract,
        contractId: candidateContractId,
        freightClassId: candidateFreightClassId,
        availableCubicFeet: contractAvailableCubicFeet,
        dueTick: contract.nextOutboundEligibleTick,
      };
    }
  }

  if (!selectedContract) {
    return null;
  }

  return {
    contract: selectedContract.contract,
    contractId: selectedContract.contractId,
    freightClassId: selectedContract.freightClassId,
    availableCubicFeet: selectedContract.availableCubicFeet,
  };
}

function getActiveOutboundOrderCount(freightFlow: FreightFlowState): number {
  return freightFlow.outboundOrders.filter((order) => order.state !== "complete").length;
}

function getAvailableInventoryByContractAndFreightClass(
  freightFlow: FreightFlowState,
): Record<string, number> {
  const inventory: Record<string, number> = {};

  for (const batch of freightFlow.freightBatches) {
    if (batch.state !== "in-storage" || batch.outboundOrderId !== null) {
      continue;
    }

    const key = `${batch.contractId ?? "none"}::${batch.freightClassId}`;
    inventory[key] = (inventory[key] ?? 0) + batch.cubicFeet;
  }

  return inventory;
}

function getAvailableInventoryEntryForContract(
  contract: ActiveContract,
  availableInventory: Record<string, number>,
): [string, number] | null {
  if (contract.freightClassId) {
    const key = `${contract.id}::${contract.freightClassId}`;
    const cubicFeet = availableInventory[key] ?? 0;
    return cubicFeet > 0 ? [key, cubicFeet] : null;
  }

  let bestMatch: [string, number] | null = null;

  for (const [key, cubicFeet] of Object.entries(availableInventory)) {
    if (cubicFeet <= 0 || !key.startsWith(`${contract.id}::`)) {
      continue;
    }

    if (!bestMatch || key.localeCompare(bestMatch[0]) < 0) {
      bestMatch = [key, cubicFeet];
    }
  }

  return bestMatch;
}

function hasDueOutboundContract(
  activeContracts: ActiveContract[],
  currentTick: number,
): boolean {
  for (const contract of activeContracts) {
    if (contract.nextOutboundEligibleTick <= currentTick) {
      return true;
    }
  }

  return false;
}

function retryDueOutboundContracts(
  activeContracts: ActiveContract[],
  currentTick: number,
  random: RandomService,
): void {
  for (const contract of activeContracts) {
    if (contract.nextOutboundEligibleTick <= currentTick) {
      contract.nextOutboundEligibleTick = rollOutboundRetryTick(currentTick, random);
    }
  }
}
