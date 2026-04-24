import freightClasses from "../../../data/config/freightClasses.json";
import type { ActiveContract } from "../core/GameState";
import type { DifficultyModeConfig } from "../config/difficulty";
import type { DomainEvent } from "../events/DomainEvent";
import type { FreightFlowState } from "./FreightFlowState";
import type { RandomService } from "../core/RandomService";
import { createId } from "../types/ids";
import { applyDemandVolatility } from "../config/difficulty";
import { rollNextInboundEligibleTick } from "../contracts/contractScheduling";

const BASE_MIN_INBOUND_CUBIC_FEET = 800;
const BASE_MAX_INBOUND_CUBIC_FEET = 2500;

type EventFactory = <TType extends string>(type: TType) => DomainEvent<TType>;

export class FreightGenerator {
  generateInbound(
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

    const contract = getEarliestDueInboundContract(activeContracts, currentTick);

    if (!contract) {
      return [];
    }

    const trailerId = createId("trailer", freightFlow.nextTrailerSequence);
    const freightBatchId = createId("freight-batch", freightFlow.nextFreightBatchSequence);
    const freightClass =
      contract?.freightClassId
        ? freightClasses.find((candidateClass) => candidateClass.id === contract.freightClassId) ??
          freightClasses[random.nextInt(0, freightClasses.length - 1)]
        : freightClasses[random.nextInt(0, freightClasses.length - 1)];
    const minimumCubicFeet = Math.max(
      1,
      Math.round(BASE_MIN_INBOUND_CUBIC_FEET * difficultyMode.inboundVolumeMultiplier),
    );
    const maximumCubicFeet = Math.max(
      minimumCubicFeet,
      Math.round(BASE_MAX_INBOUND_CUBIC_FEET * difficultyMode.inboundVolumeMultiplier),
    );
    const baseCubicFeet = random.nextInt(minimumCubicFeet, maximumCubicFeet);
    const cubicFeet = applyDemandVolatility(
      baseCubicFeet,
      difficultyMode.id,
      random.next(),
      minimumCubicFeet,
      maximumCubicFeet,
    );
    const yardDwellTicks = random.nextInt(
      difficultyMode.inboundYardDwellMinTicks,
      difficultyMode.inboundYardDwellMaxTicks,
    );
    contract.nextInboundEligibleTick = rollNextInboundEligibleTick(
      currentTick,
      contract,
      difficultyMode,
      random,
    );

    freightFlow.nextTrailerSequence += 1;
    freightFlow.nextFreightBatchSequence += 1;
    freightFlow.trailers.push({
      id: trailerId,
      contractId: contract?.id ?? null,
      direction: "inbound",
      state: "yard",
      doorId: null,
      freightBatchIds: [freightBatchId],
      arrivalTick: currentTick,
      readyForDoorAssignmentTick: currentTick + yardDwellTicks,
      doorAssignedTick: null,
      unloadStartedTick: null,
      completedTick: null,
      remainingSwitchTicks: 0,
      remainingUnloadCubicFeet: cubicFeet,
      remainingLoadCubicFeet: 0,
      dockTileIndex: null,
    });
    freightFlow.freightBatches.push({
      id: freightBatchId,
      trailerId,
      contractId: contract?.id ?? null,
      freightClassId: freightClass.id,
      cubicFeet,
      state: "in-yard",
      createdTick: currentTick,
      unloadedTick: null,
      storageZoneId: null,
      outboundOrderId: null,
      storedTick: null,
      remainingStorageCubicFeet: null,
      pickedTick: null,
      loadedTick: null,
      dockTileIndex: null,
    });
    freightFlow.metrics.totalInboundTrailersArrived += 1;

    const event = {
      ...createEvent("trailer-arrived"),
      trailerId,
      freightBatchId,
      freightClassId: freightClass.id,
      cubicFeet,
    };

    return [event];
  }
}

function getEarliestDueInboundContract(
  activeContracts: ActiveContract[],
  currentTick: number,
): ActiveContract | null {
  let earliestDueContract: ActiveContract | null = null;

  for (const contract of activeContracts) {
    if (contract.nextInboundEligibleTick > currentTick) {
      continue;
    }

    if (
      !earliestDueContract ||
      contract.nextInboundEligibleTick < earliestDueContract.nextInboundEligibleTick ||
      (contract.nextInboundEligibleTick === earliestDueContract.nextInboundEligibleTick &&
        contract.id.localeCompare(earliestDueContract.id) < 0)
    ) {
      earliestDueContract = contract;
    }
  }

  return earliestDueContract;
}
