import freightClasses from "../../../data/config/freightClasses.json";
import type { ActiveContract } from "../core/GameState";
import type { DifficultyModeConfig } from "../config/difficulty";
import type { DomainEvent } from "../events/DomainEvent";
import type { FreightFlowState } from "./FreightFlowState";
import type { RandomService } from "../core/RandomService";
import { createId } from "../types/ids";
import { applyDemandVolatility } from "../config/difficulty";

const BASE_INBOUND_SPAWN_INTERVAL_TICKS = 60;
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
    const interval = Math.max(
      1,
      Math.round(BASE_INBOUND_SPAWN_INTERVAL_TICKS * difficultyMode.inboundIntervalMultiplier),
    );

    if (currentTick === 0 || currentTick % interval !== 0) {
      return [];
    }

    const trailerId = createId("trailer", freightFlow.nextTrailerSequence);
    const freightBatchId = createId("freight-batch", freightFlow.nextFreightBatchSequence);
    const contract = selectInboundContract(activeContracts, random);
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

function selectInboundContract(
  activeContracts: ActiveContract[],
  random: RandomService,
): ActiveContract | null {
  if (activeContracts.length === 0) {
    return null;
  }

  const totalWeight = activeContracts.reduce(
    (total, contract) => total + Math.max(1, contract.expectedMonthlyThroughputCubicFeet),
    0,
  );
  let cursor = random.next() * totalWeight;

  for (const contract of activeContracts) {
    cursor -= Math.max(1, contract.expectedMonthlyThroughputCubicFeet);

    if (cursor <= 0) {
      return contract;
    }
  }

  return activeContracts[activeContracts.length - 1] ?? null;
}
