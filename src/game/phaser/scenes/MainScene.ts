import Phaser from "phaser";
import type { SimulationRunner } from "../../simulation/core/SimulationRunner";
import { selectWarehouseMap } from "../../simulation/selectors/mapSelectors";
import { ISO_TILE_WIDTH } from "../../shared/constants/map";
import { MapInputController } from "../input/MapInputController";
import { DoorRenderer } from "../rendering/DoorRenderer";
import { screenToTile, tileToScreen, type MapOrientation } from "../rendering/isometric";
import { TileRenderer } from "../rendering/TileRenderer";
import { ZoneOverlayRenderer } from "../rendering/ZoneOverlayRenderer";
import { useUiStore, type MapFocusRequest } from "../../../ui/store/uiStore";

export class MainScene extends Phaser.Scene {
  private inputController: MapInputController | null = null;
  private unsubscribeSimulation: (() => void) | null = null;
  private unsubscribeUi: (() => void) | null = null;

  constructor(private readonly simulation: SimulationRunner) {
    super("MainScene");
  }

  create(): void {
    this.input.mouse?.disableContextMenu();

    const map = selectWarehouseMap(this.simulation.getState());
    const renderer = new TileRenderer(this, map, {
      x: (map.height * ISO_TILE_WIDTH) / 2 + 96,
      y: 96,
    }, useUiStore.getState().mapOrientation);
    const zoneOverlayRenderer = new ZoneOverlayRenderer(
      this,
      map,
      this.simulation.getState().freightFlow,
      renderer.getOrigin(),
      useUiStore.getState().mapOrientation,
    );
    const doorRenderer = new DoorRenderer(
      this,
      map,
      this.simulation.getState().freightFlow,
      renderer.getOrigin(),
      useUiStore.getState().mapOrientation,
    );

    renderer.render();
    zoneOverlayRenderer.render(useUiStore.getState().activeOverlayMode);
    doorRenderer.render();
    this.configureCamera(renderer);

    this.inputController = new MapInputController(this, this.simulation, map, renderer);
    this.inputController.attach();
    this.unsubscribeSimulation = this.simulation.subscribe(() => {
      renderer.render();
      zoneOverlayRenderer.render(useUiStore.getState().activeOverlayMode);
      doorRenderer.render();
      this.inputController?.refreshHighlights();
    });
    this.unsubscribeUi = useUiStore.subscribe((state, previousState) => {
      if (state.mapOrientation !== previousState.mapOrientation) {
        this.applyMapOrientation(
          state.mapOrientation,
          previousState.mapOrientation,
          renderer,
          zoneOverlayRenderer,
          doorRenderer,
        );
      }

      if (state.activeOverlayMode !== previousState.activeOverlayMode) {
        zoneOverlayRenderer.render(state.activeOverlayMode);
      }

      if (state.mapFocusRequest && state.mapFocusRequest !== previousState.mapFocusRequest) {
        this.focusOnTile(state.mapFocusRequest, renderer);
      }
    });

    const pendingFocus = useUiStore.getState().mapFocusRequest;
    if (pendingFocus) {
      this.focusOnTile(pendingFocus, renderer);
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      renderer.destroy();
      this.unsubscribeSimulation?.();
      this.unsubscribeSimulation = null;
      this.unsubscribeUi?.();
      this.unsubscribeUi = null;
    });
  }

  update(_time: number, _delta: number): void {
    // Simulation-driven map rendering updates will go here.
  }

  private configureCamera(renderer: TileRenderer): void {
    const camera = this.cameras.main;
    const bounds = renderer.getWorldBounds();
    const padding = 320;

    camera.setBackgroundColor("#182126");
    camera.setBounds(
      bounds.x - padding,
      bounds.y - padding,
      bounds.width + padding * 2,
      bounds.height + padding * 2,
    );
    camera.setZoom(0.74);
    camera.centerOn(bounds.centerX, bounds.centerY);
  }

  private focusOnTile(request: MapFocusRequest, renderer: TileRenderer): void {
    const camera = this.cameras.main;
    const center = tileToScreen(
      { x: request.x, y: request.y },
      renderer.getOrigin(),
      selectWarehouseMap(this.simulation.getState()),
      renderer.getOrientation(),
    );

    camera.pan(center.x, center.y, 350, "Sine.easeInOut");
    if (request.zoom) {
      camera.zoomTo(request.zoom, 250);
    }

    useUiStore.getState().clearMapFocusRequest(request.id);
  }

  private applyMapOrientation(
    nextOrientation: MapOrientation,
    previousOrientation: MapOrientation,
    renderer: TileRenderer,
    zoneOverlayRenderer: ZoneOverlayRenderer,
    doorRenderer: DoorRenderer,
  ): void {
    const map = selectWarehouseMap(this.simulation.getState());
    const camera = this.cameras.main;
    const worldCenter = camera.getWorldPoint(camera.width / 2, camera.height / 2);
    const centerTile = screenToTile(worldCenter, renderer.getOrigin(), map, previousOrientation);
    const previousZoom = camera.zoom;

    renderer.setOrientation(nextOrientation);
    zoneOverlayRenderer.setOrientation(nextOrientation);
    doorRenderer.setOrientation(nextOrientation);

    renderer.render();
    zoneOverlayRenderer.render(useUiStore.getState().activeOverlayMode);
    doorRenderer.render();

    const bounds = renderer.getWorldBounds();
    const padding = 320;
    camera.setBounds(
      bounds.x - padding,
      bounds.y - padding,
      bounds.width + padding * 2,
      bounds.height + padding * 2,
    );
    camera.setZoom(previousZoom);

    if (centerTile) {
      const nextCenter = tileToScreen(centerTile, renderer.getOrigin(), map, nextOrientation);
      camera.centerOn(nextCenter.x, nextCenter.y);
    } else {
      camera.centerOn(bounds.centerX, bounds.centerY);
    }

    this.inputController?.refreshHighlights();
  }
}
