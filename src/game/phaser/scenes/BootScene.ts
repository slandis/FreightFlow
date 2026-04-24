import Phaser from "phaser";
import bulkTile00 from "../../../assets/bulk_tile_00.png";
import bulkTile25 from "../../../assets/bulk_tile_25.png";
import bulkTile50 from "../../../assets/bulk_tile_50.png";
import bulkTile75 from "../../../assets/bulk_tile_75.png";
import bulkTile100 from "../../../assets/bulk_tile_100.png";
import fastTile00 from "../../../assets/fast_tile_00.png";
import fastTile25 from "../../../assets/fast_tile_25.png";
import fastTile50 from "../../../assets/fast_tile_50.png";
import fastTile75 from "../../../assets/fast_tile_75.png";
import fastTile100 from "../../../assets/fast_tile_100.png";
import oversizeTile00 from "../../../assets/oversize_tile_00.png";
import oversizeTile25 from "../../../assets/oversize_tile_25.png";
import oversizeTile50 from "../../../assets/oversize_tile_50.png";
import oversizeTile75 from "../../../assets/oversize_tile_75.png";
import oversizeTile100 from "../../../assets/oversize_tile_100.png";
import specialTile00 from "../../../assets/special_tile_00.png";
import specialTile25 from "../../../assets/special_tile_25.png";
import specialTile50 from "../../../assets/special_tile_50.png";
import specialTile75 from "../../../assets/special_tile_75.png";
import specialTile100 from "../../../assets/special_tile_100.png";
import standardTile00 from "../../../assets/standard_tile_00.png";
import standardTile25 from "../../../assets/standard_tile_25.png";
import standardTile50 from "../../../assets/standard_tile_50.png";
import standardTile75 from "../../../assets/standard_tile_75.png";
import standardTile100 from "../../../assets/standard_tile_100.png";
import travelTile from "../../../assets/travel_tile.png";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload() {
    this.load.image("travel_tile", travelTile);

    this.load.image("bulk_tile_00", bulkTile00);
    this.load.image("bulk_tile_25", bulkTile25);
    this.load.image("bulk_tile_50", bulkTile50);
    this.load.image("bulk_tile_75", bulkTile75);
    this.load.image("bulk_tile_100", bulkTile100);

    this.load.image("fast_tile_00", fastTile00);
    this.load.image("fast_tile_25", fastTile25);
    this.load.image("fast_tile_50", fastTile50);
    this.load.image("fast_tile_75", fastTile75);
    this.load.image("fast_tile_100", fastTile100);

    this.load.image("oversize_tile_00", oversizeTile00);
    this.load.image("oversize_tile_25", oversizeTile25);
    this.load.image("oversize_tile_50", oversizeTile50);
    this.load.image("oversize_tile_75", oversizeTile75);
    this.load.image("oversize_tile_100", oversizeTile100);

    this.load.image("special_tile_00", specialTile00);
    this.load.image("special_tile_25", specialTile25);
    this.load.image("special_tile_50", specialTile50);
    this.load.image("special_tile_75", specialTile75);
    this.load.image("special_tile_100", specialTile100);

    this.load.image("standard_tile_00", standardTile00);
    this.load.image("standard_tile_25", standardTile25);
    this.load.image("standard_tile_50", standardTile50);
    this.load.image("standard_tile_75", standardTile75);
    this.load.image("standard_tile_100", standardTile100);
  }

  create() {
    this.scene.start("MainScene");
    this.scene.start("UIScene");
  }
}
