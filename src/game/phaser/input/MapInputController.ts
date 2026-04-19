import Phaser from "phaser";
import { useUiStore, type TileSummary } from "../../../ui/store/uiStore";
import { PaintZoneCommand } from "../../simulation/commands/PaintZoneCommand";
import type { SimulationRunner } from "../../simulation/core/SimulationRunner";
import { TileZoneType } from "../../simulation/types/enums";
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
  private isPainting = false;
  private hasDragged = false;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private lastPaintedTile: Tile | null = null;
  private readonly paintedTileKeys = new Set<string>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly simulation: SimulationRunner,
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
    this.isPainting = false;
    this.lastPaintedTile = null;
    this.paintedTileKeys.clear();

    this.updateHoveredTile(pointer);

    if (!this.isPanning && this.getPointerButton(pointer) === 0 && this.isPaintToolActive()) {
      this.isPainting = true;
      this.paintHoveredTile();
    }
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

    if (this.isPainting && pointer.leftButtonDown()) {
      this.paintHoveredTile();
    }
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    const button = this.getPointerButton(pointer);

    if (this.isPanning) {
      this.isPanning = false;
      return;
    }

    if (this.isPainting) {
      this.isPainting = false;
      this.lastPaintedTile = null;
      this.paintedTileKeys.clear();
      return;
    }

    if (button !== 0 || this.hasDragged || !this.hoveredTile) {
      return;
    }

    this.selectedTile = this.hoveredTile;
    this.renderer.highlightSelection(this.selectedTile);
    useUiStore.getState().setSelectedTile(this.createTileSummary(this.selectedTile));
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
      this.hoveredTile ? this.createTileSummary(this.hoveredTile) : null,
    );
  }

  refreshHighlights(): void {
    this.renderer.highlightHover(this.hoveredTile);
    this.renderer.highlightSelection(this.selectedTile);
    useUiStore.getState().setHoveredTile(
      this.hoveredTile ? this.createTileSummary(this.hoveredTile) : null,
    );
    useUiStore.getState().setSelectedTile(
      this.selectedTile ? this.createTileSummary(this.selectedTile) : null,
    );
  }

  private paintHoveredTile(): void {
    const zoneType = this.getActivePaintZoneType();

    if (!this.hoveredTile || !zoneType) {
      return;
    }

    const tilesToPaint = this.lastPaintedTile
      ? this.interpolateTiles(this.lastPaintedTile, this.hoveredTile)
      : [this.hoveredTile];

    for (const tile of tilesToPaint) {
      const key = `${tile.x},${tile.y}`;

      if (this.paintedTileKeys.has(key)) {
        continue;
      }

      this.paintedTileKeys.add(key);
      this.simulation.dispatch(new PaintZoneCommand(tile.x, tile.y, zoneType));
    }

    this.lastPaintedTile = this.hoveredTile;
  }

  private interpolateTiles(startTile: Tile, endTile: Tile): Tile[] {
    const tiles: Tile[] = [];
    const deltaX = endTile.x - startTile.x;
    const deltaY = endTile.y - startTile.y;
    const steps = Math.max(Math.abs(deltaX), Math.abs(deltaY));

    if (steps === 0) {
      return [endTile];
    }

    for (let step = 0; step <= steps; step += 1) {
      const x = Math.round(startTile.x + (deltaX * step) / steps);
      const y = Math.round(startTile.y + (deltaY * step) / steps);
      const tile = this.map.getTile(x, y);

      if (tile) {
        tiles.push(tile);
      }
    }

    return tiles;
  }

  private isPaintToolActive(): boolean {
    return this.getActivePaintZoneType() !== null;
  }

  private getActivePaintZoneType(): TileZoneType | null {
    const activeTool = useUiStore.getState().activeTool;

    if (activeTool === "select") {
      return null;
    }

    if (activeTool === "erase") {
      return TileZoneType.Unassigned;
    }

    return activeTool;
  }

  private createTileSummary(tile: Tile): TileSummary {
    return {
      x: tile.x,
      y: tile.y,
      zoneType: tile.zoneType,
      zoneId: tile.zoneId,
      isDockEdge: tile.isDockEdge,
      validForStorage: tile.validForStorage,
      invalidReason: tile.invalidReason,
      nearestTravelDistance: tile.nearestTravelDistance,
    };
  }

  private getPointerButton(pointer: Phaser.Input.Pointer): number {
    const event = pointer.event as MouseEvent | PointerEvent | undefined;

    return event?.button ?? -1;
  }
}
