import type { DomainEvent } from "../events/DomainEvent";
import type { FreightFlowState } from "../freight/FreightFlowState";

const SWITCH_MOVEMENT_TICKS = 8;

type EventFactory = <TType extends string>(type: TType) => DomainEvent<TType>;

export class SwitchDriverSystem {
  process(
    freightFlow: FreightFlowState,
    currentTick: number,
    createEvent: EventFactory,
    assignedHeadcount: number,
  ): DomainEvent[] {
    if (assignedHeadcount <= 0) {
      return [];
    }

    return [
      ...this.assignYardTrailersToDoors(
        freightFlow,
        currentTick,
        createEvent,
        assignedHeadcount,
      ),
      ...this.processSwitchMovements(freightFlow, currentTick, createEvent, assignedHeadcount),
    ];
  }

  private assignYardTrailersToDoors(
    freightFlow: FreightFlowState,
    currentTick: number,
    createEvent: EventFactory,
    assignedHeadcount: number,
  ): DomainEvent[] {
    const events: DomainEvent[] = [];
    let availableSwitchSlots =
      assignedHeadcount -
      freightFlow.trailers.filter((trailer) => trailer.state === "switching-to-door").length;
    const waitingTrailers = freightFlow.trailers
      .filter((trailer) => trailer.direction === "inbound" && trailer.state === "yard")
      .sort((first, second) => first.arrivalTick - second.arrivalTick);

    for (const trailer of waitingTrailers) {
      if (availableSwitchSlots <= 0) {
        break;
      }

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
      availableSwitchSlots -= 1;
    }

    return events;
  }

  private processSwitchMovements(
    freightFlow: FreightFlowState,
    currentTick: number,
    createEvent: EventFactory,
    assignedHeadcount: number,
  ): DomainEvent[] {
    const events: DomainEvent[] = [];
    let remainingDriverCapacity = assignedHeadcount;

    const switchingTrailers = freightFlow.trailers
      .filter((trailer) => trailer.state === "switching-to-door")
      .sort((first, second) => (first.doorAssignedTick ?? 0) - (second.doorAssignedTick ?? 0));

    for (const trailer of switchingTrailers) {
      if (remainingDriverCapacity <= 0) {
        break;
      }

      if (trailer.state !== "switching-to-door" || trailer.doorAssignedTick === currentTick) {
        continue;
      }

      remainingDriverCapacity -= 1;
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
