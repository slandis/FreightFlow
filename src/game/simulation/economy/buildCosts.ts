import buildCosts from "../../../data/config/buildCosts.json";
import { TileZoneType } from "../types/enums";
import type { WarehouseMap } from "../world/WarehouseMap";
import type { GameState } from "../core/GameState";
import type { DoorNode } from "../world/DoorNode";

const storageCostByZoneType = new Map<TileZoneType, number>(
  Object.entries(buildCosts.storagePerTile).map(([zoneType, cost]) => [zoneType as TileZoneType, cost]),
);

export interface PaintCostEstimate {
  changedTileCount: number;
  changedTiles: Array<{ x: number; y: number }>;
  cost: number;
}

export function getZonePaintCost(zoneType: TileZoneType): number {
  if (zoneType === TileZoneType.Unassigned) {
    return buildCosts.erasePerTile;
  }

  if (zoneType === TileZoneType.Travel) {
    return buildCosts.travelPerTile;
  }

  return storageCostByZoneType.get(zoneType) ?? 0;
}

export function getEraseCost(): number {
  return buildCosts.erasePerTile;
}

export function getDoorPlacementCost(_mode: DoorNode["mode"]): number {
  return buildCosts.doorPlacement;
}

export function estimatePaintSelectionCost(
  map: WarehouseMap,
  tiles: Array<{ x: number; y: number }>,
  zoneType: TileZoneType,
): PaintCostEstimate {
  const changedTiles: Array<{ x: number; y: number }> = [];
  const seenTileIndexes = new Set<number>();

  for (const coordinates of tiles) {
    const tile = map.getTile(coordinates.x, coordinates.y);

    if (!tile || tile.isDockEdge || tile.zoneType === zoneType) {
      continue;
    }

    const tileIndex = map.getTileIndex(tile.x, tile.y);

    if (seenTileIndexes.has(tileIndex)) {
      continue;
    }

    seenTileIndexes.add(tileIndex);
    changedTiles.push({ x: tile.x, y: tile.y });
  }

  return {
    changedTileCount: changedTiles.length,
    changedTiles,
    cost: changedTiles.length * getZonePaintCost(zoneType),
  };
}

export function trySpendCapitalCost(state: GameState, amount: number): boolean {
  if (amount <= 0) {
    return true;
  }

  if (state.cash < amount) {
    return false;
  }

  recordCapitalCost(state, amount);

  return true;
}

export function recordCapitalCost(state: GameState, amount: number): void {
  if (amount <= 0) {
    return;
  }

  state.cash -= amount;
  state.economy.lifetimeCapitalCost += amount;
  state.economy.currentMonthCapitalCost += amount;
  state.economy.lastCapitalSpendTick = state.currentTick;
}

export function formatCurrencyAmount(amount: number): string {
  return `$${amount.toLocaleString()}`;
}
