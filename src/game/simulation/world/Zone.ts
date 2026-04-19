import type { TileZoneType } from "../types/enums";

export interface Zone {
  id: string;
  zoneType: TileZoneType;
  tileIndexes: number[];
  capacityCubicFeet: number;
  usedCubicFeet: number;
  validForStorage: boolean;
  invalidReason: string | null;
  nearestTravelDistance: number | null;
}
