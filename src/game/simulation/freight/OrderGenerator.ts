import type { DifficultyModeConfig } from "../config/difficulty";
import type { RandomService } from "../core/RandomService";
import { applyDemandVolatility } from "../config/difficulty";
import type { DomainEvent } from "../events/DomainEvent";
import { createId } from "../types/ids";
import type { FreightFlowState } from "./FreightFlowState";

const BASE_OUTBOUND_ORDER_INTERVAL_TICKS = 60;
const BASE_MIN_ORDER_CUBIC_FEET = 300;
const BASE_MAX_ORDER_CUBIC_FEET = 900;
const ORDER_DUE_TICKS = 720;
const MIN_AVAILABLE_INVENTORY_CUBIC_FEET = 1800;
const MAX_ACTIVE_OUTBOUND_ORDERS = 3;

type EventFactory = <TType extends string>(type: TType) => DomainEvent<TType>;

export class OrderGenerator {
  generateOutbound(
    freightFlow: FreightFlowState,
    currentTick: number,
    random: RandomService,
    createEvent: EventFactory,
    difficultyMode: DifficultyModeConfig,
  ): DomainEvent[] {
    const interval = Math.max(
      1,
      Math.round(BASE_OUTBOUND_ORDER_INTERVAL_TICKS * difficultyMode.outboundIntervalMultiplier),
    );

    if (currentTick === 0 || currentTick % interval !== 0) {
      return [];
    }

    if (getActiveOutboundOrderCount(freightFlow) >= MAX_ACTIVE_OUTBOUND_ORDERS) {
      return [];
    }

    const availableInventory = getAvailableInventoryByContractAndFreightClass(freightFlow);
    const totalAvailableInventory = Object.values(availableInventory).reduce(
      (total, cubicFeet) => total + cubicFeet,
      0,
    );

    if (totalAvailableInventory < MIN_AVAILABLE_INVENTORY_CUBIC_FEET) {
      return [];
    }

    const inventoryKeys = Object.entries(availableInventory).filter(
      ([, cubicFeet]) => cubicFeet > 0,
    );

    if (inventoryKeys.length === 0) {
      return [];
    }

    const [inventoryKey] = inventoryKeys[random.nextInt(0, inventoryKeys.length - 1)];
    const [contractId, freightClassId] = inventoryKey.split("::");
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
      availableInventory[inventoryKey],
    );
    const orderId = createId("outbound-order", freightFlow.nextOutboundOrderSequence);

    freightFlow.nextOutboundOrderSequence += 1;
    freightFlow.metrics.totalOutboundOrdersCreated += 1;
    freightFlow.outboundOrders.push({
      id: orderId,
      contractId: contractId === "none" ? null : contractId,
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
