import type { DomainEvent } from "../events/DomainEvent";
import type { FreightFlowState } from "../freight/FreightFlowState";

type EventFactory = <TType extends string>(type: TType) => DomainEvent<TType>;

export class UnloadSystem {
  process(
    freightFlow: FreightFlowState,
    currentTick: number,
    createEvent: EventFactory,
    unloadCapacityCubicFeet: number,
  ): DomainEvent[] {
    const events: DomainEvent[] = [];
    let remainingCapacity = unloadCapacityCubicFeet;

    for (const trailer of freightFlow.trailers) {
      if (trailer.state === "at-door" && unloadCapacityCubicFeet > 0) {
        trailer.state = "unloading";
        trailer.unloadStartedTick = currentTick;

        const door = freightFlow.doors.find((candidateDoor) => candidateDoor.id === trailer.doorId);

        if (door) {
          door.state = "unloading";
        }
      }

      if (trailer.state !== "unloading" || trailer.unloadStartedTick === currentTick) {
        continue;
      }

      if (remainingCapacity <= 0) {
        break;
      }

      const processedCubicFeet = Math.min(remainingCapacity, trailer.remainingUnloadCubicFeet);
      remainingCapacity -= processedCubicFeet;
      trailer.remainingUnloadCubicFeet = Math.max(
        0,
        trailer.remainingUnloadCubicFeet - processedCubicFeet,
      );

      if (trailer.remainingUnloadCubicFeet > 0) {
        continue;
      }

      trailer.state = "complete";
      trailer.completedTick = currentTick;

      const door = freightFlow.doors.find((candidateDoor) => candidateDoor.id === trailer.doorId);

      if (door) {
        door.state = "idle";
        door.trailerId = null;
      }

      for (const batch of freightFlow.freightBatches) {
        if (!trailer.freightBatchIds.includes(batch.id)) {
          continue;
        }

        batch.state = "on-dock";
        batch.unloadedTick = currentTick;
        freightFlow.metrics.totalUnloadedCubicFeet += batch.cubicFeet;

        const event = {
          ...createEvent("freight-unloaded"),
          trailerId: trailer.id,
          freightBatchId: batch.id,
          cubicFeet: batch.cubicFeet,
        };

        events.push(event);
      }
    }

    return events;
  }
}
