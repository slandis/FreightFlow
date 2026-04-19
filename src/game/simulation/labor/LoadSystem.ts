import type { DomainEvent } from "../events/DomainEvent";
import type { FreightFlowState } from "../freight/FreightFlowState";
import { createId } from "../types/ids";

const LOAD_CUBIC_FEET_PER_TICK = 120;

type EventFactory = <TType extends string>(type: TType) => DomainEvent<TType>;

export class LoadSystem {
  process(
    freightFlow: FreightFlowState,
    currentTick: number,
    createEvent: EventFactory,
  ): DomainEvent[] {
    const events: DomainEvent[] = [];

    for (const order of freightFlow.outboundOrders) {
      if (order.state === "picked") {
        const door = freightFlow.doors.find(
          (candidateDoor) =>
            candidateDoor.state === "idle" &&
            (candidateDoor.mode === "outbound" || candidateDoor.mode === "flex"),
        );

        if (!door) {
          continue;
        }

        const trailerId = createId("trailer", freightFlow.nextTrailerSequence);
        freightFlow.nextTrailerSequence += 1;
        order.state = "loading";
        order.outboundTrailerId = trailerId;
        order.remainingLoadCubicFeet = order.fulfilledCubicFeet;
        door.state = "loading";
        door.trailerId = trailerId;

        freightFlow.trailers.push({
          id: trailerId,
          direction: "outbound",
          state: "loading",
          doorId: door.id,
          freightBatchIds: [...order.freightBatchIds],
          arrivalTick: currentTick,
          doorAssignedTick: currentTick,
          unloadStartedTick: null,
          completedTick: null,
          remainingSwitchTicks: 0,
          remainingUnloadCubicFeet: 0,
          remainingLoadCubicFeet: order.fulfilledCubicFeet,
        });

        for (const batch of freightFlow.freightBatches) {
          if (order.freightBatchIds.includes(batch.id)) {
            batch.state = "loading";
          }
        }

        const event = {
          ...createEvent("outbound-trailer-loaded"),
          outboundOrderId: order.id,
          trailerId,
          doorId: door.id,
        };

        events.push(event);
        continue;
      }

      if (order.state !== "loading" || !order.outboundTrailerId) {
        continue;
      }

      const trailer = freightFlow.trailers.find(
        (candidateTrailer) => candidateTrailer.id === order.outboundTrailerId,
      );

      if (!trailer) {
        continue;
      }

      order.remainingLoadCubicFeet = Math.max(
        0,
        order.remainingLoadCubicFeet - LOAD_CUBIC_FEET_PER_TICK,
      );
      trailer.remainingLoadCubicFeet = order.remainingLoadCubicFeet;

      if (order.remainingLoadCubicFeet > 0) {
        continue;
      }

      order.state = "complete";
      trailer.state = "complete";
      trailer.completedTick = currentTick;
      freightFlow.metrics.totalOutboundOrdersCompleted += 1;
      freightFlow.metrics.totalOutboundCubicFeetShipped += order.fulfilledCubicFeet;

      const door = freightFlow.doors.find((candidateDoor) => candidateDoor.id === trailer.doorId);

      if (door) {
        door.state = "idle";
        door.trailerId = null;
      }

      for (const batch of freightFlow.freightBatches) {
        if (!order.freightBatchIds.includes(batch.id)) {
          continue;
        }

        batch.state = "complete";
        batch.loadedTick = currentTick;
      }

      const event = {
        ...createEvent("shipment-completed"),
        outboundOrderId: order.id,
        trailerId: trailer.id,
        cubicFeet: order.fulfilledCubicFeet,
      };

      events.push(event);
    }

    return events;
  }
}
