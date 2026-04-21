import type { WarehouseMap } from "../../simulation/world/WarehouseMap";
import type { Tile } from "../../simulation/world/Tile";

export function getRectangularPaintSelection(
  map: WarehouseMap,
  startTile: Tile,
  endTile: Tile,
): Tile[] {
  const minX = Math.min(startTile.x, endTile.x);
  const maxX = Math.max(startTile.x, endTile.x);
  const minY = Math.min(startTile.y, endTile.y);
  const maxY = Math.max(startTile.y, endTile.y);
  const tiles: Tile[] = [];

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const tile = map.getTile(x, y);

      if (tile) {
        tiles.push(tile);
      }
    }
  }

  return tiles;
}
