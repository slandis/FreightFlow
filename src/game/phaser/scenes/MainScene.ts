import Phaser from "phaser";
import type { SimulationRunner } from "../../simulation/core/SimulationRunner";
import type { GameState } from "../../simulation/core/GameState";
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
  private tileRenderer: TileRenderer | null = null;
  private zoneOverlayRenderer: ZoneOverlayRenderer | null = null;
  private doorRenderer: DoorRenderer | null = null;
  private unsubscribeSimulation: (() => void) | null = null;
  private unsubscribeUi: (() => void) | null = null;
  private activeMapRef: ReturnType<typeof selectWarehouseMap> | null = null;
  private activeFreightFlowRef: GameState["freightFlow"] | null = null;

  constructor(private readonly simulation: SimulationRunner) {
    super("MainScene");
  }

  create(): void {
    this.input.mouse?.disableContextMenu();

    this.rebuildSceneBindings(true);
    this.unsubscribeSimulation = this.simulation.subscribe(() => {
      const state = this.simulation.getState();
      const nextMapRef = selectWarehouseMap(state);
      const nextFreightFlowRef = state.freightFlow;

      if (
        nextMapRef !== this.activeMapRef ||
        nextFreightFlowRef !== this.activeFreightFlowRef
      ) {
        this.rebuildSceneBindings(false);
      }

      this.tileRenderer?.render();
      this.zoneOverlayRenderer?.render(useUiStore.getState().activeOverlayMode);
      this.doorRenderer?.render();
      this.inputController?.refreshHighlights();
    });
    this.unsubscribeUi = useUiStore.subscribe((state, previousState) => {
      if (!this.tileRenderer || !this.zoneOverlayRenderer || !this.doorRenderer) {
        return;
      }

      if (state.mapOrientation !== previousState.mapOrientation) {
        this.applyMapOrientation(
          state.mapOrientation,
          previousState.mapOrientation,
          this.tileRenderer,
          this.zoneOverlayRenderer,
          this.doorRenderer,
        );
      }

      if (state.activeOverlayMode !== previousState.activeOverlayMode) {
        this.zoneOverlayRenderer.render(state.activeOverlayMode);
      }

      if (state.mapFocusRequest && state.mapFocusRequest !== previousState.mapFocusRequest) {
        this.focusOnTile(state.mapFocusRequest, this.tileRenderer);
      }
    });

    const pendingFocus = useUiStore.getState().mapFocusRequest;
    if (pendingFocus && this.tileRenderer) {
      this.focusOnTile(pendingFocus, this.tileRenderer);
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.destroySceneBindings();
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

  private rebuildSceneBindings(resetCamera: boolean): void {
    this.destroySceneBindings();

    const state = this.simulation.getState();
    const map = selectWarehouseMap(state);
    const renderer = new TileRenderer(
      this,
      map,
      {
        x: (map.height * ISO_TILE_WIDTH) / 2 + 96,
        y: 96,
      },
      useUiStore.getState().mapOrientation,
    );
    const zoneOverlayRenderer = new ZoneOverlayRenderer(
      this,
      map,
      state.freightFlow,
      renderer.getOrigin(),
      useUiStore.getState().mapOrientation,
    );
    const doorRenderer = new DoorRenderer(
      this,
      map,
      state.freightFlow,
      renderer.getOrigin(),
      useUiStore.getState().mapOrientation,
    );

    renderer.render();
    zoneOverlayRenderer.render(useUiStore.getState().activeOverlayMode);
    doorRenderer.render();

    if (resetCamera) {
      this.configureCamera(renderer);
    } else {
      const camera = this.cameras.main;
      const bounds = renderer.getWorldBounds();
      const padding = 320;
      camera.setBounds(
        bounds.x - padding,
        bounds.y - padding,
        bounds.width + padding * 2,
        bounds.height + padding * 2,
      );
      camera.centerOn(bounds.centerX, bounds.centerY);
    }

    this.inputController = new MapInputController(this, this.simulation, map, renderer);
    this.inputController.attach();
    this.tileRenderer = renderer;
    this.zoneOverlayRenderer = zoneOverlayRenderer;
    this.doorRenderer = doorRenderer;
    this.activeMapRef = map;
    this.activeFreightFlowRef = state.freightFlow;
  }

  private destroySceneBindings(): void {
    this.inputController?.destroy();
    this.inputController = null;
    this.tileRenderer?.destroy();
    this.tileRenderer = null;
    this.zoneOverlayRenderer?.destroy();
    this.zoneOverlayRenderer = null;
    this.doorRenderer?.destroy();
    this.doorRenderer = null;
    this.activeMapRef = null;
    this.activeFreightFlowRef = null;
  }
}
