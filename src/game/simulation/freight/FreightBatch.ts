export interface FreightBatch {
  id: string;
  freightClassId: string;
  cubicFeet: number;
  state: "in-yard" | "at-door" | "on-dock" | "in-storage" | "picked" | "loaded" | "complete";
}
