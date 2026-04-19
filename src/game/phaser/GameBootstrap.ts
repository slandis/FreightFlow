import Phaser from "phaser";
import type { SimulationRunner } from "../simulation/core/SimulationRunner";
import { BootScene } from "./scenes/BootScene";
import { MainScene } from "./scenes/MainScene";
import { UIScene } from "./scenes/UIScene";

export function createGame(container: HTMLElement, simulation: SimulationRunner): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: container,
    width: container.clientWidth || window.innerWidth,
    height: container.clientHeight || window.innerHeight,
    backgroundColor: "#182126",
    scene: [new BootScene(), new MainScene(simulation), new UIScene()],
    scale: {
      mode: Phaser.Scale.RESIZE,
      parent: container,
      width: "100%",
      height: "100%",
    },
  });
}
