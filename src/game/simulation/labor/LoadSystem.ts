import type { DomainEvent } from "../events/DomainEvent";
import type { FreightFlowState } from "../freight/FreightFlowState";
import type { LaborState } from "./LaborPool";
import { LaborAnalyticsRecorder } from "./LaborAnalyticsRecorder";
import { createId } from "../types/ids";
import { LaborRole } from "../types/enums";
import { findAvailableOutboundDoorForStageZone } from "../dock/dockCapacity";
import type { WarehouseMap } from "../world/WarehouseMap";

type EventFactory = <TType extends string>(type: TType) => DomainEvent<TType>;
const laborAnalyticsRecorder = new LaborAnalyticsRecorder();

export class LoadSystem {
  process(
    freightFlow: FreightFlowState,
    warehouseMap: WarehouseMap,
    currentTick: number,
    createEvent: EventFactory,
    loadCapacityCubicFeet: number,
    labor: LaborState,
  ): DomainEvent[] {
    const events: DomainEvent[] = [];
    let remainingCapacity = loadCapacityCubicFeet;

    for (const order of freightFlow.outboundOrders) {
      if (order.state === "picked" && loadCapacityCubicFeet > 0) {
        const stageZoneId =
          freightFlow.freightBatches.find((batch) => order.freightBatchIds.includes(batch.id))
            ?.stageZoneId ?? null;
        const door = stageZoneId
          ? findAvailableOutboundDoorForStageZone(freightFlow, warehouseMap, stageZoneId)
          : null;

        if (!door) {
          continue;
        }

        const trailerId = createId("trailer", freightFlow.nextTrailerSequence);
        freightFlow.nextTrailerSequence += 1;
        order.state = "loading";
        order.outboundTrailerId = trailerId;
        order.remainingLoadCubicFeet = order.fulfilledCubicFeet;
        order.loadStartedTick = currentTick;
        door.state = "loading";
        door.trailerId = trailerId;

        freightFlow.trailers.push({
          id: trailerId,
          contractId: order.contractId,
          direction: "outbound",
          state: "loading",
          doorId: door.id,
          freightBatchIds: [...order.freightBatchIds],
          arrivalTick: currentTick,
          readyForDoorAssignmentTick: null,
          doorAssignedTick: currentTick,
          unloadStartedTick: null,
          completedTick: null,
          remainingSwitchTicks: 0,
          remainingUnloadCubicFeet: 0,
          remainingLoadCubicFeet: order.fulfilledCubicFeet,
          dockTileIndex: null,
          stageZoneId,
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

      if (remainingCapacity <= 0) {
        break;
      }

      const processedCubicFeet = Math.min(remainingCapacity, order.remainingLoadCubicFeet);
      remainingCapacity -= processedCubicFeet;
      order.remainingLoadCubicFeet = Math.max(
        0,
        order.remainingLoadCubicFeet - processedCubicFeet,
      );
      trailer.remainingLoadCubicFeet = order.remainingLoadCubicFeet;

      if (order.remainingLoadCubicFeet > 0) {
        continue;
      }

      order.state = "complete";
      trailer.state = "complete";
      trailer.completedTick = currentTick;
      laborAnalyticsRecorder.recordCompletedWork(
        labor,
        LaborRole.Load,
        order.fulfilledCubicFeet,
        currentTick - (order.loadStartedTick ?? currentTick),
      );
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
        batch.stageZoneId = null;
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
