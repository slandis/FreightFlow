import Phaser from "phaser";
import { useUiStore, type TileSummary } from "../../../ui/store/uiStore";
import { PaintZoneCommand } from "../../simulation/commands/PaintZoneCommand";
import { PaintZoneAreaCommand } from "../../simulation/commands/PaintZoneAreaCommand";
import { PlaceDoorCommand } from "../../simulation/commands/PlaceDoorCommand";
import { RemoveDoorCommand } from "../../simulation/commands/RemoveDoorCommand";
import type { SimulationRunner } from "../../simulation/core/SimulationRunner";
import { TileZoneType } from "../../simulation/types/enums";
import type { WarehouseMap } from "../../simulation/world/WarehouseMap";
import type { Tile } from "../../simulation/world/Tile";
import type { DoorNode } from "../../simulation/world/DoorNode";
import { screenToTile } from "../rendering/isometric";
import type { TileRenderer } from "../rendering/TileRenderer";
import { getRectangularPaintSelection } from "./paintSelection";

const MIN_ZOOM = 0.45;
const MAX_ZOOM = 1.8;
const DRAG_THRESHOLD_PIXELS = 4;

export class MapInputController {
  private hoveredTile: Tile | null = null;
  private selectedTile: Tile | null = null;
  private isPanning = false;
  private isPainting = false;
  private isDoorEditing = false;
  private hasDragged = false;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private paintStartTile: Tile | null = null;
  private paintPreviewTiles: Tile[] = [];

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
    this.isDoorEditing = false;
    this.paintStartTile = null;
    this.paintPreviewTiles = [];
    this.renderer.highlightPaintPreview([]);

    this.updateHoveredTile(pointer);

    if (!this.isPanning && this.getPointerButton(pointer) === 0 && this.isPaintToolActive()) {
      this.isPainting = true;
      this.paintStartTile = this.hoveredTile;
      this.updatePaintPreview();
    }

    if (!this.isPanning && this.getPointerButton(pointer) === 0 && this.isDoorToolActive()) {
      this.isDoorEditing = true;
      this.applyDoorTool();
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
      this.updatePaintPreview();
    }
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    const button = this.getPointerButton(pointer);

    if (this.isPanning) {
      this.isPanning = false;
      return;
    }

    if (this.isPainting) {
      this.applyPaintSelection();
      this.isPainting = false;
      this.paintStartTile = null;
      this.paintPreviewTiles = [];
      this.renderer.highlightPaintPreview([]);
      return;
    }

    if (this.isDoorEditing) {
      this.isDoorEditing = false;
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
    this.renderer.highlightPaintPreview(this.paintPreviewTiles);
    this.renderer.highlightSelection(this.selectedTile);
    useUiStore.getState().setHoveredTile(
      this.hoveredTile ? this.createTileSummary(this.hoveredTile) : null,
    );
    useUiStore.getState().setSelectedTile(
      this.selectedTile ? this.createTileSummary(this.selectedTile) : null,
    );
  }

  private updatePaintPreview(): void {
    if (!this.paintStartTile || !this.hoveredTile) {
      return;
    }

    this.paintPreviewTiles = getRectangularPaintSelection(
      this.map,
      this.paintStartTile,
      this.hoveredTile,
    );
    this.renderer.highlightPaintPreview(this.paintPreviewTiles);
  }

  private applyPaintSelection(): void {
    const zoneType = this.getActivePaintZoneType();

    if (!zoneType) {
      return;
    }

    if (this.paintPreviewTiles.length === 0) {
      return;
    }

    if (this.paintPreviewTiles.length === 1) {
      const tile = this.paintPreviewTiles[0];
      this.simulation.dispatch(new PaintZoneCommand(tile.x, tile.y, zoneType));
      return;
    }

    this.simulation.dispatch(
      new PaintZoneAreaCommand(
        this.paintPreviewTiles.map((tile) => ({ x: tile.x, y: tile.y })),
        zoneType,
      ),
    );
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

    if (Object.values(TileZoneType).includes(activeTool as TileZoneType)) {
      return activeTool as TileZoneType;
    }

    return null;
  }

  private isDoorToolActive(): boolean {
    return this.isDoorTool(useUiStore.getState().activeTool);
  }

  private isDoorTool(activeTool: string): boolean {
    return (
      activeTool === "door-flex" ||
      activeTool === "door-inbound" ||
      activeTool === "door-outbound" ||
      activeTool === "door-remove"
    );
  }

  private applyDoorTool(): void {
    if (!this.hoveredTile) {
      return;
    }

    const activeTool = useUiStore.getState().activeTool;

    if (activeTool === "door-remove") {
      this.simulation.dispatch(new RemoveDoorCommand(this.hoveredTile.x, this.hoveredTile.y));
      return;
    }

    const mode = this.getDoorMode(activeTool);

    if (!mode) {
      return;
    }

    this.simulation.dispatch(new PlaceDoorCommand(this.hoveredTile.x, this.hoveredTile.y, mode));
  }

  private getDoorMode(activeTool: string): DoorNode["mode"] | null {
    if (activeTool === "door-inbound") {
      return "inbound";
    }

    if (activeTool === "door-outbound") {
      return "outbound";
    }

    if (activeTool === "door-flex") {
      return "flex";
    }

    return null;
  }

  private createTileSummary(tile: Tile): TileSummary {
    const door = this.simulation
      .getState()
      .freightFlow.doors.find((candidateDoor) => candidateDoor.x === tile.x && candidateDoor.y === tile.y);

    return {
      x: tile.x,
      y: tile.y,
      zoneType: tile.zoneType,
      zoneId: tile.zoneId,
      isDockEdge: tile.isDockEdge,
      validForStorage: tile.validForStorage,
      invalidReason: tile.invalidReason,
      nearestTravelDistance: tile.nearestTravelDistance,
      isActiveDoor: tile.isActiveDoor,
      doorId: door?.id ?? null,
      doorMode: door?.mode ?? null,
      doorState: door?.state ?? null,
    };
  }

  private getPointerButton(pointer: Phaser.Input.Pointer): number {
    const event = pointer.event as MouseEvent | PointerEvent | undefined;

    return event?.button ?? -1;
  }
}
