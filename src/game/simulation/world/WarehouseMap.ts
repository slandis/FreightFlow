import { TileZoneType } from "../types/enums";
import type { Tile } from "./Tile";

export class WarehouseMap {
  readonly width: number;
  readonly height: number;
  readonly tiles: Tile[];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.tiles = [];

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const isDockEdge = x === 0 || y === 0 || x === width - 1 || y === height - 1;

        this.tiles.push({
          x,
          y,
          zoneType: isDockEdge ? TileZoneType.Dock : TileZoneType.Unassigned,
          isDockEdge,
          isActiveDoor: false,
        });
      }
    }
  }

  getTileIndex(x: number, y: number): number {
    return y * this.width + x;
  }

  getTile(x: number, y: number): Tile | undefined {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return undefined;
    }

    return this.tiles[this.getTileIndex(x, y)];
  }
}
