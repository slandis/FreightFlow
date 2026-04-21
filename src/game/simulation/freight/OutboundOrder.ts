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
  remainingLoadCubicFeet: number;
  revenueRecognizedTick: number | null;
  recognizedRevenue: number;
  recognizedPenalty: number;
}
