import type { TileZoneType } from "../types/enums";

export interface Tile {
  x: number;
  y: number;
  zoneType: TileZoneType;
  isDockEdge: boolean;
  isActiveDoor: boolean;
}
