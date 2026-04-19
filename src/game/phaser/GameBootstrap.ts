import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { MainScene } from "./scenes/MainScene";
import { UIScene } from "./scenes/UIScene";

export function createGame(container: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: container,
    width: container.clientWidth || window.innerWidth,
    height: container.clientHeight || window.innerHeight,
    backgroundColor: "#182126",
    scene: [BootScene, MainScene, UIScene],
    scale: {
      mode: Phaser.Scale.RESIZE,
      parent: container,
      width: "100%",
      height: "100%",
    },
  });
}
