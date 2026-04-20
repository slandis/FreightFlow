import type { RandomService } from "../core/RandomService";
import type { DomainEvent } from "../events/DomainEvent";
import { createId } from "../types/ids";
import type { FreightFlowState } from "./FreightFlowState";

const OUTBOUND_ORDER_INTERVAL_TICKS = 180;
const MIN_ORDER_CUBIC_FEET = 300;
const MAX_ORDER_CUBIC_FEET = 900;
const ORDER_DUE_TICKS = 720;

type EventFactory = <TType extends string>(type: TType) => DomainEvent<TType>;

export class OrderGenerator {
  generateOutbound(
    freightFlow: FreightFlowState,
    currentTick: number,
    random: RandomService,
    createEvent: EventFactory,
  ): DomainEvent[] {
    if (currentTick === 0 || currentTick % OUTBOUND_ORDER_INTERVAL_TICKS !== 0) {
      return [];
    }

    const availableInventory = getAvailableInventoryByFreightClass(freightFlow);
    const availableFreightClassIds = Object.entries(availableInventory)
      .filter(([, cubicFeet]) => cubicFeet > 0)
      .map(([freightClassId]) => freightClassId);

    if (availableFreightClassIds.length === 0) {
      return [];
    }

    const freightClassId =
      availableFreightClassIds[random.nextInt(0, availableFreightClassIds.length - 1)];
    const requestedCubicFeet = Math.min(
      random.nextInt(MIN_ORDER_CUBIC_FEET, MAX_ORDER_CUBIC_FEET),
      availableInventory[freightClassId],
    );
    const orderId = createId("outbound-order", freightFlow.nextOutboundOrderSequence);

    freightFlow.nextOutboundOrderSequence += 1;
    freightFlow.metrics.totalOutboundOrdersCreated += 1;
    freightFlow.outboundOrders.push({
      id: orderId,
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

function getAvailableInventoryByFreightClass(freightFlow: FreightFlowState): Record<string, number> {
  const inventory: Record<string, number> = {};

  for (const batch of freightFlow.freightBatches) {
    if (batch.state !== "in-storage" || batch.outboundOrderId !== null) {
      continue;
    }

    inventory[batch.freightClassId] = (inventory[batch.freightClassId] ?? 0) + batch.cubicFeet;
  }

  return inventory;
}
