export interface FreightBatch {
  id: string;
  trailerId: string;
  contractId: string | null;
  freightClassId: string;
  cubicFeet: number;
  state:
    | "in-yard"
    | "at-door"
    | "in-stage"
    | "storing"
    | "in-storage"
    | "picking"
    | "picked"
    | "loading"
    | "loaded"
    | "complete";
  createdTick: number;
  unloadedTick: number | null;
  storageStartedTick?: number | null;
  storageZoneId: string | null;
  stageZoneId?: string | null;
  outboundOrderId: string | null;
  storedTick: number | null;
  remainingStorageCubicFeet: number | null;
  pickedTick: number | null;
  loadedTick: number | null;
  dockTileIndex: number | null;
}
