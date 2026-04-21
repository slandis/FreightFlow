import Phaser from "phaser";
import { getDockTileCapacities } from "../../simulation/dock/dockCapacity";
import type { FreightFlowState } from "../../simulation/freight/FreightFlowState";
import type { DoorNode } from "../../simulation/world/DoorNode";
import type { WarehouseMap } from "../../simulation/world/WarehouseMap";
import { tileToScreen, type IsometricOrigin } from "./isometric";

const doorColors: Record<DoorNode["state"], number> = {
  idle: 0xeef4f2,
  reserved: 0xe6b655,
  occupied: 0x5ea3c6,
  unloading: 0x6aa076,
  loading: 0x8d70a8,
};
const dockCapacityIndicatorColors = {
  available: 0xeef4f2,
  warning: 0xf2c14e,
  full: 0xd95d52,
} as const;

export class DoorRenderer {
  private readonly layer: Phaser.GameObjects.Graphics;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly warehouseMap: WarehouseMap,
    private readonly freightFlow: FreightFlowState,
    private readonly origin: IsometricOrigin,
  ) {
    this.layer = scene.add.graphics();
    this.layer.setDepth(15);
  }

  render(): void {
    this.layer.clear();
    const dockUsageRatioByDoorId = new Map<string, number>();

    for (const capacity of getDockTileCapacities(this.warehouseMap, this.freightFlow)) {
      const usageRatio =
        capacity.capacityCubicFeet === 0
          ? 0
          : capacity.usedCubicFeet / capacity.capacityCubicFeet;

      for (const doorId of capacity.supportingDoorIds) {
        const existingRatio = dockUsageRatioByDoorId.get(doorId) ?? 0;
        dockUsageRatioByDoorId.set(doorId, Math.max(existingRatio, usageRatio));
      }
    }

    for (const door of this.freightFlow.doors) {
      const center = tileToScreen(door, this.origin);
      const markerY = center.y - 20;
      const dockUsageRatio = dockUsageRatioByDoorId.get(door.id) ?? 0;

      this.layer.fillStyle(doorColors[door.state], 0.95);
      this.layer.lineStyle(2, 0x182126, 0.9);
      this.layer.fillRoundedRect(center.x - 12, markerY - 8, 24, 16, 3);
      this.layer.strokeRoundedRect(center.x - 12, markerY - 8, 24, 16, 3);

      this.layer.fillStyle(this.getDockCapacityIndicatorColor(dockUsageRatio), 1);
      this.layer.lineStyle(1, 0x182126, 0.95);
      this.layer.fillCircle(center.x + 7, markerY - 3, 4);
      this.layer.strokeCircle(center.x + 7, markerY - 3, 4);

      if (!door.trailerId) {
        continue;
      }

      this.layer.fillStyle(0xf4f1d0, 0.95);
      this.layer.lineStyle(1, 0x182126, 0.9);
      this.layer.fillRoundedRect(center.x - 9, markerY - 27, 18, 13, 2);
      this.layer.strokeRoundedRect(center.x - 9, markerY - 27, 18, 13, 2);
    }
  }

  private getDockCapacityIndicatorColor(dockUsageRatio: number): number {
    if (dockUsageRatio >= 1) {
      return dockCapacityIndicatorColors.full;
    }

    if (dockUsageRatio > 0.75) {
      return dockCapacityIndicatorColors.warning;
    }

    return dockCapacityIndicatorColors.available;
  }
}
