import Phaser from "phaser";
import { ISO_TILE_HEIGHT, ISO_TILE_WIDTH } from "../../shared/constants/map";
import type { FreightFlowState } from "../../simulation/freight/FreightFlowState";
import { TileZoneType } from "../../simulation/types/enums";
import type { WarehouseMap } from "../../simulation/world/WarehouseMap";
import type { Tile } from "../../simulation/world/Tile";
import type { OverlayMode } from "../../../ui/store/uiStore";
import {
  getIsoTilePolygon,
  tileToScreen,
  type IsometricOrigin,
  type MapOrientation,
} from "./isometric";

const zoneOverlayColors: Partial<Record<TileZoneType, number>> = {
  [TileZoneType.Travel]: 0xe6b655,
  [TileZoneType.StandardStorage]: 0x5ea3c6,
  [TileZoneType.BulkStorage]: 0x8d70a8,
  [TileZoneType.FastTurnStorage]: 0x5fbf8f,
  [TileZoneType.OversizeStorage]: 0xd96c5f,
  [TileZoneType.SpecialHandlingStorage]: 0xf4f1d0,
};

export class ZoneOverlayRenderer {
  private readonly overlayLayer: Phaser.GameObjects.Graphics;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly map: WarehouseMap,
    private readonly freightFlow: FreightFlowState,
    private readonly origin: IsometricOrigin,
    private orientation: MapOrientation = 0,
  ) {
    this.overlayLayer = scene.add.graphics();
    this.overlayLayer.setDepth(10);
  }

  render(mode: OverlayMode = "invalid-storage"): void {
    this.overlayLayer.clear();

    if (mode === "none") {
      return;
    }

    if (mode === "zone-types") {
      this.renderZoneTypes();
      return;
    }

    if (mode === "travel-network") {
      this.renderTravelNetwork();
      return;
    }

    if (mode === "storage-capacity") {
      this.renderStorageCapacity();
      return;
    }

    if (mode === "door-utilization") {
      this.renderDoorUtilization();
      return;
    }

    if (mode === "queue-pressure") {
      this.renderQueuePressure();
      return;
    }

    this.renderInvalidStorage();
  }

  setOrientation(orientation: MapOrientation): void {
    this.orientation = orientation;
  }

  private renderInvalidStorage(): void {
    for (const tile of this.map.tiles) {
      if (tile.validForStorage || !tile.invalidReason) {
        continue;
      }

      this.drawHatchedTile(tile, 0xe05252);
    }
  }

  private renderZoneTypes(): void {
    for (const tile of this.map.tiles) {
      const color = zoneOverlayColors[tile.zoneType];

      if (!color || tile.zoneType === TileZoneType.Dock || tile.zoneType === TileZoneType.Unassigned) {
        continue;
      }

      this.drawTile(tile, color, 0.2, 1.5, 0.82);
    }
  }

  private renderTravelNetwork(): void {
    for (const tile of this.map.tiles) {
      if (tile.zoneType !== TileZoneType.Travel) {
        continue;
      }

      this.drawTile(tile, 0xe6b655, 0.32, 2, 0.95);
    }
  }

  private renderStorageCapacity(): void {
    const zonesById = new Map(this.map.zones.map((zone) => [zone.id, zone]));

    for (const tile of this.map.tiles) {
      if (!isStorageTile(tile) || !tile.zoneId) {
        continue;
      }

      const zone = zonesById.get(tile.zoneId);
      const utilization =
        zone && zone.capacityCubicFeet > 0 ? zone.usedCubicFeet / zone.capacityCubicFeet : 0;
      const color = !tile.validForStorage
        ? 0xe05252
        : utilization >= 0.85
          ? 0xd96c5f
          : utilization >= 0.55
            ? 0xe6b655
            : 0x5fbf8f;

      this.drawTile(tile, color, 0.22 + Math.min(utilization, 1) * 0.28, 1.5, 0.82);
    }
  }

  private renderDoorUtilization(): void {
    for (const door of this.freightFlow.doors) {
      const center = tileToScreen(door, this.origin, this.map, this.orientation);
      const color =
        door.state === "idle"
          ? 0x5fbf8f
          : door.state === "reserved"
            ? 0xe6b655
            : door.state === "loading" || door.state === "unloading"
              ? 0xd96c5f
              : 0x5ea3c6;

      this.overlayLayer.lineStyle(3, color, 0.95);
      this.overlayLayer.strokeCircle(center.x, center.y - 20, 18);
      this.overlayLayer.fillStyle(color, 0.18);
      this.overlayLayer.fillCircle(center.x, center.y - 20, 18);
    }
  }

  private renderQueuePressure(): void {
    const queues = this.freightFlow.queues;
    const hasPressure =
      queues.yardTrailers > 0 ||
      queues.unloadTrailers > 0 ||
      queues.dockFreightCubicFeet > 0 ||
      queues.storageQueueCubicFeet > 0 ||
      queues.pickQueueCubicFeet > 0 ||
      queues.loadQueueCubicFeet > 0;

    if (hasPressure) {
      for (const tile of this.map.tiles) {
        if (!tile.isDockEdge) {
          continue;
        }

        this.drawTile(tile, 0xe6b655, 0.08, 0.75, 0.35);
      }
    }

    for (const door of this.freightFlow.doors) {
      const center = tileToScreen(door, this.origin, this.map, this.orientation);
      const color = door.state === "idle" ? 0xe6b655 : 0xd96c5f;

      this.overlayLayer.lineStyle(2, color, hasPressure ? 0.95 : 0.45);
      this.overlayLayer.strokeRoundedRect(center.x - 18, center.y - 35, 36, 28, 4);
    }
  }

  private drawTile(
    tile: Tile,
    color: number,
    fillAlpha: number,
    lineWidth: number,
    lineAlpha: number,
  ): void {
    const points = getIsoTilePolygon(tile, this.origin, this.map, this.orientation);

    this.overlayLayer.fillStyle(color, fillAlpha);
    this.overlayLayer.beginPath();
    this.overlayLayer.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length; index += 1) {
      this.overlayLayer.lineTo(points[index].x, points[index].y);
    }
    this.overlayLayer.closePath();
    this.overlayLayer.fillPath();
    this.overlayLayer.lineStyle(lineWidth, color, lineAlpha);
    this.overlayLayer.strokePath();
  }

  private drawHatchedTile(tile: Tile, color: number): void {
    const points = getIsoTilePolygon(tile, this.origin, this.map, this.orientation);
    const minX = Math.min(...points.map((point) => point.x));
    const maxX = Math.max(...points.map((point) => point.x));
    const minY = Math.min(...points.map((point) => point.y));
    const maxY = Math.max(...points.map((point) => point.y));
    const hatchSpacing = 6;

    this.drawTile(tile, color, 0.08, 2, 0.95);

    this.overlayLayer.lineStyle(1, color, 0.6);
    for (let offset = -ISO_TILE_WIDTH; offset <= ISO_TILE_WIDTH; offset += hatchSpacing) {
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

function isStorageTile(tile: Tile): boolean {
  return (
    tile.zoneType === TileZoneType.StandardStorage ||
    tile.zoneType === TileZoneType.BulkStorage ||
    tile.zoneType === TileZoneType.FastTurnStorage ||
    tile.zoneType === TileZoneType.OversizeStorage ||
    tile.zoneType === TileZoneType.SpecialHandlingStorage
  );
}
