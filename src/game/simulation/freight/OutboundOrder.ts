export interface OutboundOrder {
  id: string;
  contractId: string | null;
  freightClassId: string;
  requestedCubicFeet: number;
  fulfilledCubicFeet: number;
  state: "open" | "picking" | "picked" | "loading" | "complete" | "blocked";
  createdTick: number;
  dueTick: number;
  freightBatchIds: string[];
  outboundTrailerId: string | null;
  blockedReason: string | null;
  remainingPickCubicFeet: number;
  pickStartedTick?: number | null;
  remainingLoadCubicFeet: number;
  loadStartedTick?: number | null;
  revenueRecognizedTick: number | null;
  recognizedRevenue: number;
  recognizedPenalty: number;
}
