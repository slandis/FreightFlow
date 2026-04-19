import type { DomainEvent } from "../events/DomainEvent";
import type { FreightFlowState } from "../freight/FreightFlowState";

const SWITCH_MOVEMENT_TICKS = 8;

type EventFactory = <TType extends string>(type: TType) => DomainEvent<TType>;

export class SwitchDriverSystem {
  process(
    freightFlow: FreightFlowState,
    currentTick: number,
    createEvent: EventFactory,
  ): DomainEvent[] {
    return [
      ...this.assignYardTrailersToDoors(freightFlow, currentTick, createEvent),
      ...this.processSwitchMovements(freightFlow, currentTick, createEvent),
    ];
  }

  private assignYardTrailersToDoors(
    freightFlow: FreightFlowState,
    currentTick: number,
    createEvent: EventFactory,
  ): DomainEvent[] {
    const events: DomainEvent[] = [];
    const waitingTrailers = freightFlow.trailers
      .filter((trailer) => trailer.direction === "inbound" && trailer.state === "yard")
      .sort((first, second) => first.arrivalTick - second.arrivalTick);

    for (const trailer of waitingTrailers) {
      const door = freightFlow.doors.find(
        (candidateDoor) =>
          candidateDoor.state === "idle" &&
          (candidateDoor.mode === "inbound" || candidateDoor.mode === "flex"),
      );

      if (!door) {
        break;
      }

      trailer.state = "switching-to-door";
      trailer.doorId = door.id;
      trailer.doorAssignedTick = currentTick;
      trailer.remainingSwitchTicks = SWITCH_MOVEMENT_TICKS;
      door.state = "reserved";
      door.trailerId = trailer.id;

      const event = {
        ...createEvent("trailer-assigned-door"),
        trailerId: trailer.id,
        doorId: door.id,
      };

      events.push(event);
    }

    return events;
  }

  private processSwitchMovements(
    freightFlow: FreightFlowState,
    currentTick: number,
    createEvent: EventFactory,
  ): DomainEvent[] {
    const events: DomainEvent[] = [];

    for (const trailer of freightFlow.trailers) {
      if (trailer.state !== "switching-to-door" || trailer.doorAssignedTick === currentTick) {
        continue;
      }

      trailer.remainingSwitchTicks = Math.max(0, trailer.remainingSwitchTicks - 1);

      if (trailer.remainingSwitchTicks > 0) {
        continue;
      }

      const door = freightFlow.doors.find((candidateDoor) => candidateDoor.id === trailer.doorId);
      trailer.state = "at-door";

      if (door) {
        door.state = "occupied";
      }

      for (const batch of freightFlow.freightBatches) {
        if (trailer.freightBatchIds.includes(batch.id)) {
          batch.state = "at-door";
        }
      }

      const event = {
        ...createEvent("trailer-arrived-door"),
        trailerId: trailer.id,
        doorId: trailer.doorId,
      };

      events.push(event);
    }

    return events;
  }
}
