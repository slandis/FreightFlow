import type { FreightFlowState } from "../freight/FreightFlowState";
import type { WarehouseMap } from "./WarehouseMap";

export function createInitialFreightFlowState(map: WarehouseMap): FreightFlowState {
  return {
    trailers: [],
    freightBatches: [],
    outboundOrders: [],
    doors: [],
    queues: {
      yardTrailers: 0,
      switchingTrailers: 0,
      unloadTrailers: 0,
      dockFreightCubicFeet: 0,
      storageQueueCubicFeet: 0,
      pickQueueCubicFeet: 0,
      loadQueueCubicFeet: 0,
      averageYardDwellTicks: 0,
      averageDoorDwellTicks: 0,
    },
    inventoryByFreightClass: {},
    metrics: {
      totalInboundTrailersArrived: 0,
      totalUnloadedCubicFeet: 0,
      totalOutboundOrdersCreated: 0,
      totalOutboundOrdersCompleted: 0,
      totalOutboundCubicFeetShipped: 0,
    },
    nextTrailerSequence: 1,
    nextFreightBatchSequence: 1,
    nextOutboundOrderSequence: 1,
    nextDoorSequence: 1,
  };
}
