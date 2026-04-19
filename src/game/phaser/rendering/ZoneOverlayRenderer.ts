import Phaser from "phaser";
import { ISO_TILE_HEIGHT, ISO_TILE_WIDTH } from "../../shared/constants/map";
import type { WarehouseMap } from "../../simulation/world/WarehouseMap";
import { getIsoTilePolygon, type IsometricOrigin } from "./isometric";

export class ZoneOverlayRenderer {
  private readonly overlayLayer: Phaser.GameObjects.Graphics;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly map: WarehouseMap,
    private readonly origin: IsometricOrigin,
  ) {
    this.overlayLayer = scene.add.graphics();
    this.overlayLayer.setDepth(10);
  }

  render(): void {
    this.overlayLayer.clear();

    for (const tile of this.map.tiles) {
      if (tile.validForStorage || !tile.invalidReason) {
        continue;
      }

      const points = getIsoTilePolygon(tile, this.origin);
      const minX = Math.min(...points.map((point) => point.x));
      const maxX = Math.max(...points.map((point) => point.x));
      const minY = Math.min(...points.map((point) => point.y));
      const maxY = Math.max(...points.map((point) => point.y));
      const hatchSpacing = 6;

      this.overlayLayer.lineStyle(2, 0xe05252, 0.95);
      this.overlayLayer.beginPath();
      this.overlayLayer.moveTo(points[0].x, points[0].y);
      for (let index = 1; index < points.length; index += 1) {
        this.overlayLayer.lineTo(points[index].x, points[index].y);
      }
      this.overlayLayer.closePath();
      this.overlayLayer.strokePath();

      this.overlayLayer.lineStyle(1, 0xe05252, 0.6);
      for (
        let offset = -ISO_TILE_WIDTH;
        offset <= ISO_TILE_WIDTH;
        offset += hatchSpacing
      ) {
        const startX = minX + offset;
        const startY = maxY;
        const endX = startX + ISO_TILE_WIDTH / 2;
        const endY = minY;

        if (endX < minX || startX > maxX) {
          continue;
        }

        this.overlayLayer.lineBetween(
          Phaser.Math.Clamp(startX, minX, maxX),
          Phaser.Math.Clamp(startY, minY, maxY),
          Phaser.Math.Clamp(endX, minX, maxX),
          Phaser.Math.Clamp(endY + ISO_TILE_HEIGHT / 2, minY, maxY),
        );
      }
    }
  }
}
