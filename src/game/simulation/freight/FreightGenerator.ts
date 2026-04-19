import freightClasses from "../../../data/config/freightClasses.json";
import type { DomainEvent } from "../events/DomainEvent";
import type { FreightFlowState } from "./FreightFlowState";
import type { RandomService } from "../core/RandomService";
import { createId } from "../types/ids";

const INBOUND_SPAWN_INTERVAL_TICKS = 120;
const MIN_INBOUND_CUBIC_FEET = 800;
const MAX_INBOUND_CUBIC_FEET = 1800;

type EventFactory = <TType extends string>(type: TType) => DomainEvent<TType>;

export class FreightGenerator {
  generateInbound(
    freightFlow: FreightFlowState,
    currentTick: number,
    random: RandomService,
    createEvent: EventFactory,
  ): DomainEvent[] {
    if (currentTick === 0 || currentTick % INBOUND_SPAWN_INTERVAL_TICKS !== 0) {
      return [];
    }

    const trailerId = createId("trailer", freightFlow.nextTrailerSequence);
    const freightBatchId = createId("freight-batch", freightFlow.nextFreightBatchSequence);
    const freightClass = freightClasses[random.nextInt(0, freightClasses.length - 1)];
    const cubicFeet = random.nextInt(MIN_INBOUND_CUBIC_FEET, MAX_INBOUND_CUBIC_FEET);

    freightFlow.nextTrailerSequence += 1;
    freightFlow.nextFreightBatchSequence += 1;
    freightFlow.trailers.push({
      id: trailerId,
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
    });
    freightFlow.freightBatches.push({
      id: freightBatchId,
      trailerId,
      freightClassId: freightClass.id,
      cubicFeet,
      state: "in-yard",
      createdTick: currentTick,
      unloadedTick: null,
      storageZoneId: null,
      outboundOrderId: null,
      storedTick: null,
      pickedTick: null,
      loadedTick: null,
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
