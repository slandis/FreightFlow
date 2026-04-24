import type { DomainEvent } from "../events/DomainEvent";
import type { FreightFlowState } from "../freight/FreightFlowState";
import type { LaborState } from "./LaborPool";
import { LaborAnalyticsRecorder } from "./LaborAnalyticsRecorder";
import { LaborRole } from "../types/enums";
import type { WarehouseMap } from "../world/WarehouseMap";
import {
  getPickDistanceMultiplier,
  getWeightedStorageDistanceForOrder,
} from "./travelDistance";
import { findAvailableOutboundStageZone } from "../dock/dockCapacity";

const INVENTORY_UNAVAILABLE_REASON = "Inventory unavailable";

type EventFactory = <TType extends string>(type: TType) => DomainEvent<TType>;
const laborAnalyticsRecorder = new LaborAnalyticsRecorder();

export class PickSystem {
  process(
    freightFlow: FreightFlowState,
    warehouseMap: WarehouseMap,
    currentTick: number,
    createEvent: EventFactory,
    pickCapacityCubicFeet: number,
    labor: LaborState,
  ): DomainEvent[] {
    const events: DomainEvent[] = [];
    let remainingCapacity = pickCapacityCubicFeet;

    for (const order of freightFlow.outboundOrders) {
      if (order.state === "open" && pickCapacityCubicFeet > 0) {
        const matchingBatches = freightFlow.freightBatches
          .filter(
            (batch) =>
              batch.state === "in-storage" &&
              batch.outboundOrderId === null &&
              batch.contractId === order.contractId &&
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
        order.pickStartedTick = currentTick;
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

      if (remainingCapacity <= 0) {
        break;
      }

      const weightedDistance = getWeightedStorageDistanceForOrder(order, freightFlow, warehouseMap);
      const distanceMultiplier = getPickDistanceMultiplier(weightedDistance);
      const effectiveCapacity = Math.max(1, remainingCapacity * distanceMultiplier);
      const processedCubicFeet = Math.min(effectiveCapacity, order.remainingPickCubicFeet);
      remainingCapacity -= processedCubicFeet;
      order.remainingPickCubicFeet = Math.max(
        0,
        order.remainingPickCubicFeet - processedCubicFeet,
      );

      if (order.remainingPickCubicFeet > 0) {
        continue;
      }

      order.state = "picked";
      const outboundStageZone = findAvailableOutboundStageZone(
        warehouseMap,
        freightFlow,
        order.fulfilledCubicFeet,
      );
      laborAnalyticsRecorder.recordCompletedWork(
        labor,
        LaborRole.Pick,
        order.fulfilledCubicFeet,
        currentTick - (order.pickStartedTick ?? order.createdTick),
      );

      for (const batch of freightFlow.freightBatches) {
        if (!order.freightBatchIds.includes(batch.id)) {
          continue;
        }

        batch.state = "picked";
        batch.pickedTick = currentTick;
        batch.storageZoneId = null;
        batch.stageZoneId = outboundStageZone?.id ?? null;
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
