import Phaser from "phaser";
import { ISO_TILE_HEIGHT, ISO_TILE_WIDTH } from "../../shared/constants/map";
import { TileZoneType } from "../../simulation/types/enums";
import type { WarehouseMap } from "../../simulation/world/WarehouseMap";
import type { Tile } from "../../simulation/world/Tile";
import { getIsoTilePolygon, tileToScreen, type IsometricOrigin } from "./isometric";
import { resolveTileTextureKey } from "./storageTileArt";

const tileFillColors: Record<TileZoneType, number> = {
  [TileZoneType.Unassigned]: 0x31413b,
  [TileZoneType.Dock]: 0xc9a646,
  [TileZoneType.Travel]: 0x6aa076,
  [TileZoneType.StandardStorage]: 0x6b8fbc,
  [TileZoneType.BulkStorage]: 0x9f7e54,
  [TileZoneType.FastTurnStorage]: 0xa4b85c,
  [TileZoneType.OversizeStorage]: 0xa86b5f,
  [TileZoneType.SpecialHandlingStorage]: 0x8d70a8,
};

export class TileRenderer {
  private readonly baseLayer: Phaser.GameObjects.Graphics;
  private readonly storageTileLayer: Phaser.GameObjects.Container;
  private readonly hoverLayer: Phaser.GameObjects.Graphics;
  private readonly paintPreviewLayer: Phaser.GameObjects.Graphics;
  private readonly selectionLayer: Phaser.GameObjects.Graphics;
  private readonly storageTileImages = new Map<number, Phaser.GameObjects.Image>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly map: WarehouseMap,
    private readonly origin: IsometricOrigin,
  ) {
    this.baseLayer = scene.add.graphics();
    this.storageTileLayer = scene.add.container();
    this.hoverLayer = scene.add.graphics();
    this.paintPreviewLayer = scene.add.graphics();
    this.selectionLayer = scene.add.graphics();
    this.baseLayer.setDepth(0);
    this.storageTileLayer.setDepth(10);
    this.hoverLayer.setDepth(20);
    this.paintPreviewLayer.setDepth(25);
    this.selectionLayer.setDepth(30);
  }

  render(): void {
    this.baseLayer.clear();

    for (const tile of this.map.tiles) {
      this.drawTile(this.baseLayer, tile, tileFillColors[tile.zoneType], 0.94, 0x16211e, 0.5);
    }

    this.renderStorageTileImages();
  }

  highlightHover(tile: Tile | null): void {
    this.hoverLayer.clear();

    if (!tile) {
      return;
    }

    this.drawTile(this.hoverLayer, tile, 0xffffff, 0.2, 0xf4f1d0, 1.8);
  }

  highlightSelection(tile: Tile | null): void {
    this.selectionLayer.clear();

    if (!tile) {
      return;
    }

    this.drawTile(this.selectionLayer, tile, 0x000000, 0, 0xf0c85a, 3);
  }

  highlightPaintPreview(tiles: Tile[]): void {
    this.paintPreviewLayer.clear();

    for (const tile of tiles) {
      this.drawTile(this.paintPreviewLayer, tile, 0xf0c85a, 0.18, 0xf6db8f, 1.8);
    }
  }

  getOrigin(): IsometricOrigin {
    return this.origin;
  }

  getWorldBounds(): Phaser.Geom.Rectangle {
    const corners = [
      tileToScreen({ x: 0, y: 0 }, this.origin),
      tileToScreen({ x: this.map.width - 1, y: 0 }, this.origin),
      tileToScreen({ x: 0, y: this.map.height - 1 }, this.origin),
      tileToScreen({ x: this.map.width - 1, y: this.map.height - 1 }, this.origin),
    ];

    const xs = corners.map((corner) => corner.x);
    const ys = corners.map((corner) => corner.y);
    const minX = Math.min(...xs) - ISO_TILE_WIDTH;
    const maxX = Math.max(...xs) + ISO_TILE_WIDTH;
    const minY = Math.min(...ys) - ISO_TILE_HEIGHT;
    const maxY = Math.max(...ys) + ISO_TILE_HEIGHT;

    return new Phaser.Geom.Rectangle(minX, minY, maxX - minX, maxY - minY);
  }

  destroy(): void {
    for (const image of this.storageTileImages.values()) {
      image.destroy();
    }

    this.storageTileImages.clear();
    this.storageTileLayer.destroy();
    this.baseLayer.destroy();
    this.hoverLayer.destroy();
    this.paintPreviewLayer.destroy();
    this.selectionLayer.destroy();
  }

  private drawTile(
    layer: Phaser.GameObjects.Graphics,
    tile: Tile,
    fillColor: number,
    fillAlpha: number,
    lineColor: number,
    lineAlpha: number,
  ): void {
    const points = getIsoTilePolygon(tile, this.origin);

    layer.fillStyle(fillColor, fillAlpha);
    layer.lineStyle(1, lineColor, lineAlpha);
    layer.beginPath();
    layer.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length; index += 1) {
      layer.lineTo(points[index].x, points[index].y);
    }
    layer.closePath();
    layer.fillPath();
    layer.strokePath();
  }

  private renderStorageTileImages(): void {
    const zonesById = new Map(this.map.zones.map((zone) => [zone.id, zone] as const));
    const activeTileIndexes = new Set<number>();

    for (const tile of this.map.tiles) {
      const tileIndex = this.map.getTileIndex(tile.x, tile.y);
      const textureKey = resolveTileTextureKey(
        tile.zoneType,
        tile.zoneId ? zonesById.get(tile.zoneId) : null,
      );

      if (!textureKey) {
        this.destroyStorageTileImage(tileIndex);
        continue;
      }

      activeTileIndexes.add(tileIndex);
      const center = tileToScreen(tile, this.origin);
      const imageX = center.x;
      const imageY = center.y + ISO_TILE_HEIGHT / 2;
      const existingImage = this.storageTileImages.get(tileIndex);

      if (existingImage) {
        if (existingImage.texture.key !== textureKey) {
          existingImage.setTexture(textureKey);
        }

        existingImage.setPosition(imageX, imageY);
        continue;
      }

      const image = this.scene.add.image(imageX, imageY, textureKey);
      image.setOrigin(0.5, 1);
      this.storageTileLayer.add(image);
      this.storageTileImages.set(tileIndex, image);
    }

    for (const tileIndex of [...this.storageTileImages.keys()]) {
      if (!activeTileIndexes.has(tileIndex)) {
        this.destroyStorageTileImage(tileIndex);
      }
    }

    this.reorderStorageTileImages();
  }

  private destroyStorageTileImage(tileIndex: number): void {
    const image = this.storageTileImages.get(tileIndex);

    if (!image) {
      return;
    }

    image.destroy();
    this.storageTileImages.delete(tileIndex);
  }

  private reorderStorageTileImages(): void {
    const sortedImages = [...this.storageTileImages.values()].sort((first, second) => {
      if (first.y !== second.y) {
        return first.y - second.y;
      }

      return first.x - second.x;
    });

    this.storageTileLayer.removeAll(false);
    this.storageTileLayer.add(sortedImages);
  }
}
