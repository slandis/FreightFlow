import type { TileZoneType } from "../types/enums";

export interface Tile {
  x: number;
  y: number;
  zoneType: TileZoneType;
  zoneId: string | null;
  isDockEdge: boolean;
  isActiveDoor: boolean;
  validForStorage: boolean;
  invalidReason: string | null;
  nearestTravelDistance: number | null;
}
