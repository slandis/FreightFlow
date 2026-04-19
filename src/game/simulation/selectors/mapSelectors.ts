import type { GameState } from "../core/GameState";

export function selectWarehouseMap(state: GameState) {
  return state.warehouseMap;
}

export function selectTileCount(state: GameState): number {
  return state.warehouseMap.tiles.length;
}
