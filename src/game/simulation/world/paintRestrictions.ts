import type { GameState } from "../core/GameState";
import { TileZoneType } from "../types/enums";
import type { Tile } from "./Tile";

export function getPaintRestrictionError(
  state: GameState,
  tile: Tile,
  targetZoneType: TileZoneType,
): string | null {
  if (tile.isDockEdge || tile.zoneType === targetZoneType) {
    return null;
  }

  const zone = tile.zoneId
    ? state.warehouseMap.zones.find((candidateZone) => candidateZone.id === tile.zoneId)
    : null;

  if (zone && zone.usedCubicFeet > 0) {
    return `Cannot modify occupied ${tile.zoneType} area while freight is present`;
  }

  if (
    targetZoneType !== TileZoneType.Unassigned &&
    (tile.zoneType === TileZoneType.Travel || tile.zoneType === TileZoneType.Stage)
  ) {
    return `${
      tile.zoneType === TileZoneType.Travel ? "Travel tiles" : "Stage areas"
    } must be erased before assigning a new zone`;
  }

  return null;
}
