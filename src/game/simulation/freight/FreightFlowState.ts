import type { DoorNode } from "../world/DoorNode";
import type { FreightBatch } from "./FreightBatch";
import type { Trailer } from "./Trailer";

export interface InboundQueueState {
  yardTrailers: number;
  switchingTrailers: number;
  unloadTrailers: number;
  dockFreightCubicFeet: number;
  averageYardDwellTicks: number;
  averageDoorDwellTicks: number;
}

export interface InboundMetricsState {
  totalInboundTrailersArrived: number;
  totalUnloadedCubicFeet: number;
}

export interface FreightFlowState {
  trailers: Trailer[];
  freightBatches: FreightBatch[];
  doors: DoorNode[];
  queues: InboundQueueState;
  metrics: InboundMetricsState;
  nextTrailerSequence: number;
  nextFreightBatchSequence: number;
}
