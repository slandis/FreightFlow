import type { DomainEvent } from "../events/DomainEvent";
import type { FreightFlowState } from "../freight/FreightFlowState";

const PICK_CUBIC_FEET_PER_TICK = 120;
const INVENTORY_UNAVAILABLE_REASON = "Inventory unavailable";

type EventFactory = <TType extends string>(type: TType) => DomainEvent<TType>;

export class PickSystem {
  process(
    freightFlow: FreightFlowState,
    currentTick: number,
    createEvent: EventFactory,
  ): DomainEvent[] {
    const events: DomainEvent[] = [];

    for (const order of freightFlow.outboundOrders) {
      if (order.state === "open") {
        const matchingBatches = freightFlow.freightBatches
          .filter(
            (batch) =>
              batch.state === "in-storage" &&
              batch.outboundOrderId === null &&
              batch.freightClassId === order.freightClassId,
          )
          .sort((first, second) => (first.storedTick ?? 0) - (second.storedTick ?? 0));
        const reservedBatches = [];
        let reservedCubicFeet = 0;

        for (const batch of matchingBatches) {
          reservedBatches.push(batch);
          reservedCubicFeet += batch.cubicFeet;

          if (reservedCubicFeet >= order.requestedCubicFeet) {
            break;
          }
        }

        if (reservedCubicFeet < order.requestedCubicFeet) {
          order.state = "blocked";
          order.blockedReason = INVENTORY_UNAVAILABLE_REASON;

          const event = {
            ...createEvent("outbound-order-blocked"),
            outboundOrderId: order.id,
            reason: INVENTORY_UNAVAILABLE_REASON,
          };

          events.push(event);
          continue;
        }

        order.state = "picking";
        order.freightBatchIds = reservedBatches.map((batch) => batch.id);
        order.fulfilledCubicFeet = reservedCubicFeet;
        order.remainingPickCubicFeet = reservedCubicFeet;
        order.remainingLoadCubicFeet = reservedCubicFeet;
        order.blockedReason = null;

        for (const batch of reservedBatches) {
          batch.state = "picking";
          batch.outboundOrderId = order.id;
        }

        continue;
      }

      if (order.state !== "picking") {
        continue;
      }

      order.remainingPickCubicFeet = Math.max(
        0,
        order.remainingPickCubicFeet - PICK_CUBIC_FEET_PER_TICK,
      );

      if (order.remainingPickCubicFeet > 0) {
        continue;
      }

      order.state = "picked";

      for (const batch of freightFlow.freightBatches) {
        if (!order.freightBatchIds.includes(batch.id)) {
          continue;
        }

        batch.state = "picked";
        batch.pickedTick = currentTick;
        batch.storageZoneId = null;
      }

      const event = {
        ...createEvent("outbound-order-picked"),
        outboundOrderId: order.id,
        cubicFeet: order.fulfilledCubicFeet,
      };

      events.push(event);
    }

    return events;
  }
}
