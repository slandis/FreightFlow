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

    const availableInventory = getAvailableInventoryByFreightClass(freightFlow);
    const availableFreightClassIds = Object.entries(availableInventory)
      .filter(([, cubicFeet]) => cubicFeet > 0)
      .map(([freightClassId]) => freightClassId);

    if (availableFreightClassIds.length === 0) {
      return [];
    }

    const freightClassId =
      availableFreightClassIds[random.nextInt(0, availableFreightClassIds.length - 1)];
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
