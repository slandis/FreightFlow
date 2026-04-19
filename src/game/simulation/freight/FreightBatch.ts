export interface FreightBatch {
  id: string;
  trailerId: string;
  freightClassId: string;
  cubicFeet: number;
  state:
    | "in-yard"
    | "at-door"
    | "on-dock"
    | "in-storage"
    | "picking"
    | "picked"
    | "loading"
    | "loaded"
    | "complete";
  createdTick: number;
  unloadedTick: number | null;
  storageZoneId: string | null;
  outboundOrderId: string | null;
  storedTick: number | null;
  pickedTick: number | null;
  loadedTick: number | null;
}
