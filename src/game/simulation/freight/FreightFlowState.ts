import type { DoorNode } from "../world/DoorNode";
import type { FreightBatch } from "./FreightBatch";
import type { OutboundOrder } from "./OutboundOrder";
import type { Trailer } from "./Trailer";

export interface InboundQueueState {
  yardTrailers: number;
  switchingTrailers: number;
  unloadTrailers: number;
  dockFreightCubicFeet: number;
  storageQueueCubicFeet: number;
  pickQueueCubicFeet: number;
  loadQueueCubicFeet: number;
  averageYardDwellTicks: number;
  averageDoorDwellTicks: number;
}

export interface InboundMetricsState {
  totalInboundTrailersArrived: number;
  totalUnloadedCubicFeet: number;
  totalOutboundOrdersCreated: number;
  totalOutboundOrdersCompleted: number;
  totalOutboundCubicFeetShipped: number;
}

export interface FreightFlowState {
  trailers: Trailer[];
  freightBatches: FreightBatch[];
  outboundOrders: OutboundOrder[];
  doors: DoorNode[];
  queues: InboundQueueState;
  inventoryByFreightClass: Record<string, number>;
  metrics: InboundMetricsState;
  nextTrailerSequence: number;
  nextFreightBatchSequence: number;
  nextOutboundOrderSequence: number;
  nextDoorSequence: number;
}
