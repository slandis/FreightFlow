import Phaser from "phaser";
import type { FreightFlowState } from "../../simulation/freight/FreightFlowState";
import type { DoorNode } from "../../simulation/world/DoorNode";
import { tileToScreen, type IsometricOrigin } from "./isometric";

const doorColors: Record<DoorNode["state"], number> = {
  idle: 0xeef4f2,
  reserved: 0xe6b655,
  occupied: 0x5ea3c6,
  unloading: 0x6aa076,
  loading: 0x8d70a8,
};

export class DoorRenderer {
  private readonly layer: Phaser.GameObjects.Graphics;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly freightFlow: FreightFlowState,
    private readonly origin: IsometricOrigin,
  ) {
    this.layer = scene.add.graphics();
    this.layer.setDepth(15);
  }

  render(): void {
    this.layer.clear();

    for (const door of this.freightFlow.doors) {
      const center = tileToScreen(door, this.origin);
      const markerY = center.y - 20;

      this.layer.fillStyle(doorColors[door.state], 0.95);
      this.layer.lineStyle(2, 0x182126, 0.9);
      this.layer.fillRoundedRect(center.x - 12, markerY - 8, 24, 16, 3);
      this.layer.strokeRoundedRect(center.x - 12, markerY - 8, 24, 16, 3);

      if (!door.trailerId) {
        continue;
      }

      this.layer.fillStyle(0xf4f1d0, 0.95);
      this.layer.lineStyle(1, 0x182126, 0.9);
      this.layer.fillRoundedRect(center.x - 9, markerY - 27, 18, 13, 2);
      this.layer.strokeRoundedRect(center.x - 9, markerY - 27, 18, 13, 2);
    }
  }
}
