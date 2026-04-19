import Phaser from "phaser";
import { useUiStore } from "../../../ui/store/uiStore";
import type { WarehouseMap } from "../../simulation/world/WarehouseMap";
import type { Tile } from "../../simulation/world/Tile";
import { screenToTile } from "../rendering/isometric";
import type { TileRenderer } from "../rendering/TileRenderer";

const MIN_ZOOM = 0.45;
const MAX_ZOOM = 1.8;
const DRAG_THRESHOLD_PIXELS = 4;

export class MapInputController {
  private hoveredTile: Tile | null = null;
  private selectedTile: Tile | null = null;
  private isPanning = false;
  private hasDragged = false;
  private lastPointerX = 0;
  private lastPointerY = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly map: WarehouseMap,
    private readonly renderer: TileRenderer,
  ) {}

  attach(): void {
    this.scene.input.on("pointerdown", this.handlePointerDown, this);
    this.scene.input.on("pointermove", this.handlePointerMove, this);
    this.scene.input.on("pointerup", this.handlePointerUp, this);
    this.scene.input.on("wheel", this.handleWheel, this);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  destroy(): void {
    this.scene.input.off("pointerdown", this.handlePointerDown, this);
    this.scene.input.off("pointermove", this.handlePointerMove, this);
    this.scene.input.off("pointerup", this.handlePointerUp, this);
    this.scene.input.off("wheel", this.handleWheel, this);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    this.lastPointerX = pointer.x;
    this.lastPointerY = pointer.y;
    this.hasDragged = false;
    this.isPanning = pointer.rightButtonDown() || pointer.middleButtonDown();

    this.updateHoveredTile(pointer);
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    const deltaX = pointer.x - this.lastPointerX;
    const deltaY = pointer.y - this.lastPointerY;

    if (Math.abs(deltaX) > DRAG_THRESHOLD_PIXELS || Math.abs(deltaY) > DRAG_THRESHOLD_PIXELS) {
      this.hasDragged = true;
    }

    if (this.isPanning && (pointer.rightButtonDown() || pointer.middleButtonDown())) {
      const camera = this.scene.cameras.main;
      camera.scrollX -= deltaX / camera.zoom;
      camera.scrollY -= deltaY / camera.zoom;
    }

    this.lastPointerX = pointer.x;
    this.lastPointerY = pointer.y;
    this.updateHoveredTile(pointer);
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    const button = this.getPointerButton(pointer);

    if (this.isPanning) {
      this.isPanning = false;
      return;
    }

    if (button !== 0 || this.hasDragged || !this.hoveredTile) {
      return;
    }

    this.selectedTile = this.hoveredTile;
    this.renderer.highlightSelection(this.selectedTile);
    useUiStore.getState().setSelectedTile({
      x: this.selectedTile.x,
      y: this.selectedTile.y,
      zoneType: this.selectedTile.zoneType,
      isDockEdge: this.selectedTile.isDockEdge,
    });
  }

  private handleWheel(
    pointer: Phaser.Input.Pointer,
    _objects: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number,
  ): void {
    const camera = this.scene.cameras.main;
    const beforeZoom = camera.getWorldPoint(pointer.x, pointer.y);
    const nextZoom = Phaser.Math.Clamp(camera.zoom * (1 - deltaY * 0.001), MIN_ZOOM, MAX_ZOOM);

    camera.setZoom(nextZoom);

    const afterZoom = camera.getWorldPoint(pointer.x, pointer.y);
    camera.scrollX += beforeZoom.x - afterZoom.x;
    camera.scrollY += beforeZoom.y - afterZoom.y;
    this.updateHoveredTile(pointer);
  }

  private updateHoveredTile(pointer: Phaser.Input.Pointer): void {
    const camera = this.scene.cameras.main;
    const worldPoint = camera.getWorldPoint(pointer.x, pointer.y);
    const tileCoordinates = screenToTile(worldPoint, this.renderer.getOrigin(), this.map);
    const nextTile = tileCoordinates
      ? this.map.getTile(tileCoordinates.x, tileCoordinates.y) ?? null
      : null;

    if (
      this.hoveredTile?.x === nextTile?.x &&
      this.hoveredTile?.y === nextTile?.y &&
      this.hoveredTile?.zoneType === nextTile?.zoneType
    ) {
      return;
    }

    this.hoveredTile = nextTile;
    this.renderer.highlightHover(this.hoveredTile);
    useUiStore.getState().setHoveredTile(
      this.hoveredTile
        ? {
            x: this.hoveredTile.x,
            y: this.hoveredTile.y,
            zoneType: this.hoveredTile.zoneType,
            isDockEdge: this.hoveredTile.isDockEdge,
          }
        : null,
    );
  }

  private getPointerButton(pointer: Phaser.Input.Pointer): number {
    const event = pointer.event as MouseEvent | PointerEvent | undefined;

    return event?.button ?? -1;
  }
}
