export interface FreightBatch {
  id: string;
  trailerId: string;
  freightClassId: string;
  cubicFeet: number;
  state: "in-yard" | "at-door" | "on-dock" | "in-storage" | "picked" | "loaded" | "complete";
  createdTick: number;
  unloadedTick: number | null;
}
