import { describe, expect, it } from "vitest";
import { MAP_HEIGHT, MAP_WIDTH } from "../../game/shared/constants/map";
import { screenToTile, tileToScreen } from "../../game/phaser/rendering/isometric";

const origin = { x: 1024, y: 96 };
const map = { width: MAP_WIDTH, height: MAP_HEIGHT };

describe("isometric coordinate helpers", () => {
  it("maps tile centers back to their source tile", () => {
    const tile = { x: 17, y: 42 };
    const screenPoint = tileToScreen(tile, origin);

    expect(screenToTile(screenPoint, origin, map)).toEqual(tile);
  });

  it("rejects points outside the warehouse map", () => {
    expect(screenToTile({ x: origin.x - 2000, y: origin.y - 2000 }, origin, map)).toBeNull();
  });
});
