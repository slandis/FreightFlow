import { ISO_TILE_HEIGHT, ISO_TILE_WIDTH } from "../../shared/constants/map";

export interface TileCoordinates {
  x: number;
  y: number;
}

export interface ScreenCoordinates {
  x: number;
  y: number;
}

export interface IsometricOrigin {
  x: number;
  y: number;
}

export interface MapDimensions {
  width: number;
  height: number;
}

export type MapOrientation = 0 | 1 | 2 | 3;

export function rotateTileCoordinates(
  tile: TileCoordinates,
  map: MapDimensions,
  orientation: MapOrientation,
): TileCoordinates {
  switch (orientation) {
    case 1:
      return { x: map.height - 1 - tile.y, y: tile.x };
    case 2:
      return { x: map.width - 1 - tile.x, y: map.height - 1 - tile.y };
    case 3:
      return { x: tile.y, y: map.width - 1 - tile.x };
    default:
      return tile;
  }
}

export function unrotateTileCoordinates(
  tile: TileCoordinates,
  map: MapDimensions,
  orientation: MapOrientation,
): TileCoordinates {
  switch (orientation) {
    case 1:
      return { x: tile.y, y: map.height - 1 - tile.x };
    case 2:
      return { x: map.width - 1 - tile.x, y: map.height - 1 - tile.y };
    case 3:
      return { x: map.width - 1 - tile.y, y: tile.x };
    default:
      return tile;
  }
}

export function tileToScreen(
  tile: TileCoordinates,
  origin: IsometricOrigin,
  map?: MapDimensions,
  orientation: MapOrientation = 0,
): ScreenCoordinates {
  const projectedTile = map ? rotateTileCoordinates(tile, map, orientation) : tile;

  return {
    x: origin.x + ((projectedTile.x - projectedTile.y) * ISO_TILE_WIDTH) / 2,
    y: origin.y + ((projectedTile.x + projectedTile.y) * ISO_TILE_HEIGHT) / 2,
  };
}

export function getIsoTilePolygon(
  tile: TileCoordinates,
  origin: IsometricOrigin,
  map?: MapDimensions,
  orientation: MapOrientation = 0,
): ScreenCoordinates[] {
  const center = tileToScreen(tile, origin, map, orientation);
  const halfWidth = ISO_TILE_WIDTH / 2;
  const halfHeight = ISO_TILE_HEIGHT / 2;

  return [
    { x: center.x, y: center.y - halfHeight },
    { x: center.x + halfWidth, y: center.y },
    { x: center.x, y: center.y + halfHeight },
    { x: center.x - halfWidth, y: center.y },
  ];
}

export function screenToTile(
  point: ScreenCoordinates,
  origin: IsometricOrigin,
  map: MapDimensions,
  orientation: MapOrientation = 0,
): TileCoordinates | null {
  const localX = point.x - origin.x;
  const localY = point.y - origin.y;
  const projectedX = localX / ISO_TILE_WIDTH + localY / ISO_TILE_HEIGHT;
  const projectedY = localY / ISO_TILE_HEIGHT - localX / ISO_TILE_WIDTH;

  const baseX = Math.floor(projectedX);
  const baseY = Math.floor(projectedY);

  for (let y = baseY - 1; y <= baseY + 1; y += 1) {
    for (let x = baseX - 1; x <= baseX + 1; x += 1) {
      if (x < 0 || y < 0 || x >= map.width || y >= map.height) {
        continue;
      }

      const center = tileToScreen({ x, y }, origin);
      const normalizedDistance =
        Math.abs(point.x - center.x) / (ISO_TILE_WIDTH / 2) +
        Math.abs(point.y - center.y) / (ISO_TILE_HEIGHT / 2);

      if (normalizedDistance <= 1) {
        return unrotateTileCoordinates({ x, y }, map, orientation);
      }
    }
  }

  return null;
}
