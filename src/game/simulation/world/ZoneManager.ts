import zoneTypes from "../../../data/config/zoneTypes.json";
import { manhattanDistance } from "../../shared/math/distance";
import { TileZoneType } from "../types/enums";
import type { Tile } from "./Tile";
import type { WarehouseMap } from "./WarehouseMap";
import type { Zone } from "./Zone";

const STORAGE_ACCESS_DISTANCE = 3;
const NO_TRAVEL_ACCESS_REASON = "No travel access";
const TOO_FAR_FROM_TRAVEL_REASON = "Too far from travel tile";
const NO_DOOR_ACCESS_REASON = "No door access";

const storageZoneTypes = new Set<TileZoneType>([
  TileZoneType.Stage,
  TileZoneType.StandardStorage,
  TileZoneType.BulkStorage,
  TileZoneType.FastTurnStorage,
  TileZoneType.OversizeStorage,
  TileZoneType.SpecialHandlingStorage,
]);

const trueStorageZoneTypes = new Set<TileZoneType>([
  TileZoneType.StandardStorage,
  TileZoneType.BulkStorage,
  TileZoneType.FastTurnStorage,
  TileZoneType.OversizeStorage,
  TileZoneType.SpecialHandlingStorage,
]);

const capacityByZoneType = new Map<TileZoneType, number>(
  zoneTypes.map((zoneType) => [zoneType.id as TileZoneType, zoneType.capacityPerTile]),
);

export function isStorageZoneType(zoneType: TileZoneType): boolean {
  return storageZoneTypes.has(zoneType);
}

export function isTrueStorageZoneType(zoneType: TileZoneType): boolean {
  return trueStorageZoneTypes.has(zoneType);
}

export function isStageZoneType(zoneType: TileZoneType): boolean {
  return zoneType === TileZoneType.Stage;
}

export function zoneTouchesTravel(map: WarehouseMap, zone: Zone): boolean {
  return zone.tileIndexes.some((tileIndex) => {
    const tile = map.tiles[tileIndex];

    if (!tile) {
      return false;
    }

    return [
      map.getTile(tile.x + 1, tile.y),
      map.getTile(tile.x - 1, tile.y),
      map.getTile(tile.x, tile.y + 1),
      map.getTile(tile.x, tile.y - 1),
    ].some((neighbor) => neighbor?.zoneType === TileZoneType.Travel);
  });
}

export class ZoneManager {
  rebuildZones(map: WarehouseMap): Zone[] {
    this.recalculateStorageValidity(map);
    const activeDoorTiles = map.tiles.filter((tile) => tile.isActiveDoor);

    const zones: Zone[] = [];
    const visited = new Set<number>();

    for (const tile of map.tiles) {
      const tileIndex = map.getTileIndex(tile.x, tile.y);

      if (visited.has(tileIndex) || !this.shouldAggregate(tile)) {
        continue;
      }

      const tileIndexes = this.collectContiguousTileIndexes(map, tile, visited);
      const zoneId = `${tile.zoneType}-${(zones.length + 1).toString().padStart(3, "0")}`;
      const capacityPerTile = capacityByZoneType.get(tile.zoneType) ?? 0;
      const zoneTiles = tileIndexes.map((index) => map.tiles[index]);
      const nearestTravelDistance = this.findNearestTravelDistance(zoneTiles);
      const nearestDoorDistance = this.findNearestDoorDistance(zoneTiles);
      let validForStorage = true;
      let invalidReason: string | null = null;

      if (isStageZoneType(tile.zoneType)) {
        validForStorage = this.zoneTouchesActiveDoor(zoneTiles, activeDoorTiles);
        invalidReason = validForStorage ? null : NO_DOOR_ACCESS_REASON;
      } else if (isStorageZoneType(tile.zoneType)) {
        const invalidTile = zoneTiles.find((zoneTile) => zoneTile.invalidReason);
        validForStorage = zoneTiles.every((zoneTile) => zoneTile.validForStorage);
        invalidReason = invalidTile?.invalidReason ?? null;
      }

      for (const zoneTile of zoneTiles) {
        zoneTile.zoneId = zoneId;
        if (isStageZoneType(tile.zoneType)) {
          zoneTile.validForStorage = validForStorage;
          zoneTile.invalidReason = invalidReason;
        }
      }

      zones.push({
        id: zoneId,
        zoneType: tile.zoneType,
        tileIndexes,
        capacityCubicFeet: capacityPerTile * tileIndexes.length,
        usedCubicFeet: 0,
        validForStorage,
        invalidReason,
        nearestTravelDistance,
        nearestDoorDistance,
      });
    }

    return zones;
  }

  private recalculateStorageValidity(map: WarehouseMap): void {
    const travelTiles = map.tiles.filter((tile) => tile.zoneType === TileZoneType.Travel);
    const activeDoorTiles = map.tiles.filter((tile) => tile.isActiveDoor);

    for (const tile of map.tiles) {
      tile.zoneId = null;
      tile.validForStorage = false;
      tile.invalidReason = null;
      tile.nearestTravelDistance = null;
      tile.nearestDoorDistance = null;

      if (!isStorageZoneType(tile.zoneType)) {
        continue;
      }

      if (isStageZoneType(tile.zoneType)) {
        if (activeDoorTiles.length > 0) {
          tile.nearestDoorDistance = Math.min(
            ...activeDoorTiles.map((doorTile) =>
              manhattanDistance(tile.x, tile.y, doorTile.x, doorTile.y),
            ),
          );
        }
        continue;
      }

      if (travelTiles.length === 0) {
        tile.invalidReason = NO_TRAVEL_ACCESS_REASON;
        continue;
      }

      const nearestTravelDistance = Math.min(
        ...travelTiles.map((travelTile) =>
          manhattanDistance(tile.x, tile.y, travelTile.x, travelTile.y),
        ),
      );

      tile.nearestTravelDistance = nearestTravelDistance;
      tile.validForStorage = nearestTravelDistance <= STORAGE_ACCESS_DISTANCE;
      tile.invalidReason = tile.validForStorage ? null : TOO_FAR_FROM_TRAVEL_REASON;
    }
  }

  private shouldAggregate(tile: Tile): boolean {
    return !tile.isDockEdge && tile.zoneType !== TileZoneType.Unassigned;
  }

  private collectContiguousTileIndexes(
    map: WarehouseMap,
    startTile: Tile,
    visited: Set<number>,
  ): number[] {
    const tileIndexes: number[] = [];
    const queue: Tile[] = [startTile];

    while (queue.length > 0) {
      const tile = queue.shift();

      if (!tile) {
        continue;
      }

      const tileIndex = map.getTileIndex(tile.x, tile.y);

      if (visited.has(tileIndex) || tile.zoneType !== startTile.zoneType || tile.isDockEdge) {
        continue;
      }

      visited.add(tileIndex);
      tileIndexes.push(tileIndex);

      for (const neighbor of this.getCardinalNeighbors(map, tile)) {
        const neighborIndex = map.getTileIndex(neighbor.x, neighbor.y);

        if (!visited.has(neighborIndex)) {
          queue.push(neighbor);
        }
      }
    }

    return tileIndexes;
  }

  private getCardinalNeighbors(map: WarehouseMap, tile: Tile): Tile[] {
    return [
      map.getTile(tile.x + 1, tile.y),
      map.getTile(tile.x - 1, tile.y),
      map.getTile(tile.x, tile.y + 1),
      map.getTile(tile.x, tile.y - 1),
    ].filter((neighbor): neighbor is Tile => Boolean(neighbor));
  }

  private findNearestTravelDistance(tiles: Tile[]): number | null {
    const distances = tiles
      .map((tile) => tile.nearestTravelDistance)
      .filter((distance): distance is number => distance !== null);

    if (distances.length === 0) {
      return null;
    }

    return Math.min(...distances);
  }

  private findNearestDoorDistance(tiles: Tile[]): number | null {
    const distances = tiles
      .map((tile) => tile.nearestDoorDistance)
      .filter((distance): distance is number => distance !== null);

    if (distances.length === 0) {
      return null;
    }

    return Math.min(...distances);
  }

  private zoneTouchesActiveDoor(zoneTiles: Tile[], activeDoorTiles: Tile[]): boolean {
    if (activeDoorTiles.length === 0) {
      return false;
    }

    return zoneTiles.some((zoneTile) =>
      activeDoorTiles.some(
        (doorTile) => manhattanDistance(zoneTile.x, zoneTile.y, doorTile.x, doorTile.y) === 1,
      ),
    );
  }
}
