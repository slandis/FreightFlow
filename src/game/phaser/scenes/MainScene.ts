import Phaser from "phaser";

export class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
  }

  create() {
    this.add.text(24, 24, "FreightFlow Warehouse Map", {
      color: "#eef4f2",
      fontFamily: "Arial",
      fontSize: "20px",
    });
  }

  update(_time: number, _delta: number) {
    // Simulation-driven map rendering updates will go here.
  }
}
