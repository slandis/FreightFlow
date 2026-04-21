import { describe, expect, it } from "vitest";
import { getRectangularPaintSelection } from "../../game/phaser/input/paintSelection";
import { WarehouseMap } from "../../game/simulation/world/WarehouseMap";

describe("paint selection", () => {
  it("selects a straight row when dragging along one row", () => {
    const map = new WarehouseMap(10, 10);
    const start = map.getTile(3, 4);
    const end = map.getTile(6, 4);

    expect(start).toBeTruthy();
    expect(end).toBeTruthy();

    const selection = getRectangularPaintSelection(map, start!, end!);

    expect(selection.map((tile) => `${tile.x},${tile.y}`)).toEqual([
      "3,4",
      "4,4",
      "5,4",
      "6,4",
    ]);
  });

  it("selects a full rectangle when dragging into another row", () => {
    const map = new WarehouseMap(10, 10);
    const start = map.getTile(2, 2);
    const end = map.getTile(4, 4);

    expect(start).toBeTruthy();
    expect(end).toBeTruthy();

    const selection = getRectangularPaintSelection(map, start!, end!);

    expect(selection).toHaveLength(9);
    expect(selection.map((tile) => `${tile.x},${tile.y}`)).toEqual([
      "2,2",
      "3,2",
      "4,2",
      "2,3",
      "3,3",
      "4,3",
      "2,4",
      "3,4",
      "4,4",
    ]);
  });
});
