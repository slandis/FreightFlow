import { TileZoneType } from "../types/enums";
import type { Tile } from "./Tile";
import type { Zone } from "./Zone";
import { ZoneManager } from "./ZoneManager";

export class WarehouseMap {
  readonly width: number;
  readonly height: number;
  readonly tiles: Tile[];
  zones: Zone[] = [];
  private readonly zoneManager = new ZoneManager();

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
          zoneId: null,
          isDockEdge,
          isActiveDoor: false,
          validForStorage: false,
          invalidReason: null,
          nearestTravelDistance: null,
        });
      }
    }

    this.rebuildZones();
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

  paintTile(x: number, y: number, zoneType: TileZoneType): boolean {
    const tile = this.getTile(x, y);

    if (!tile || tile.isDockEdge) {
      return false;
    }

    if (tile.zoneType === zoneType) {
      return false;
    }

    tile.zoneType = zoneType;
    this.rebuildZones();

    return true;
  }

  rebuildZones(): void {
    this.zones = this.zoneManager.rebuildZones(this);
  }
}
