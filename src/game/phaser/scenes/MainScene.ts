import Phaser from "phaser";
import type { SimulationRunner } from "../../simulation/core/SimulationRunner";
import { selectWarehouseMap } from "../../simulation/selectors/mapSelectors";
import { ISO_TILE_WIDTH } from "../../shared/constants/map";
import { MapInputController } from "../input/MapInputController";
import { DoorRenderer } from "../rendering/DoorRenderer";
import { TileRenderer } from "../rendering/TileRenderer";
import { ZoneOverlayRenderer } from "../rendering/ZoneOverlayRenderer";

export class MainScene extends Phaser.Scene {
  private inputController: MapInputController | null = null;
  private unsubscribeSimulation: (() => void) | null = null;

  constructor(private readonly simulation: SimulationRunner) {
    super("MainScene");
  }

  create(): void {
    this.input.mouse?.disableContextMenu();

    const map = selectWarehouseMap(this.simulation.getState());
    const renderer = new TileRenderer(this, map, {
      x: (map.height * ISO_TILE_WIDTH) / 2 + 96,
      y: 96,
    });
    const zoneOverlayRenderer = new ZoneOverlayRenderer(this, map, renderer.getOrigin());
    const doorRenderer = new DoorRenderer(
      this,
      this.simulation.getState().freightFlow,
      renderer.getOrigin(),
    );

    renderer.render();
    zoneOverlayRenderer.render();
    doorRenderer.render();
    this.configureCamera(renderer);

    this.inputController = new MapInputController(this, this.simulation, map, renderer);
    this.inputController.attach();
    this.unsubscribeSimulation = this.simulation.subscribe(() => {
      renderer.render();
      zoneOverlayRenderer.render();
      doorRenderer.render();
      this.inputController?.refreshHighlights();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribeSimulation?.();
      this.unsubscribeSimulation = null;
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
}
