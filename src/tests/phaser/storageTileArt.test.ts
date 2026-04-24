import { describe, expect, it } from "vitest";
import { TileZoneType } from "../../game/simulation/types/enums";
import type { Zone } from "../../game/simulation/world/Zone";
import {
  getHighestThresholdNotExceeding,
  resolveTileTextureKey,
} from "../../game/phaser/rendering/storageTileArt";

function createZone(overrides: Partial<Zone> = {}): Zone {
  return {
    id: "zone-001",
    zoneType: TileZoneType.StandardStorage,
    tileIndexes: [1, 2],
    capacityCubicFeet: 1000,
    usedCubicFeet: 0,
    validForStorage: true,
    invalidReason: null,
    nearestTravelDistance: 1,
    ...overrides,
  };
}

describe("storage tile art", () => {
  it("uses the highest threshold not exceeding current utilization", () => {
    expect(getHighestThresholdNotExceeding(0)).toBe(0);
    expect(getHighestThresholdNotExceeding(24.9)).toBe(0);
    expect(getHighestThresholdNotExceeding(25)).toBe(25);
    expect(getHighestThresholdNotExceeding(50)).toBe(50);
    expect(getHighestThresholdNotExceeding(75)).toBe(75);
    expect(getHighestThresholdNotExceeding(99.9)).toBe(75);
    expect(getHighestThresholdNotExceeding(100)).toBe(100);
  });

  it("maps storage zone types to the expected texture key prefixes", () => {
    expect(resolveTileTextureKey(TileZoneType.StandardStorage, createZone())).toBe(
      "standard_tile_00",
    );
    expect(
      resolveTileTextureKey(
        TileZoneType.BulkStorage,
        createZone({ zoneType: TileZoneType.BulkStorage, usedCubicFeet: 500 }),
      ),
    ).toBe("bulk_tile_50");
    expect(
      resolveTileTextureKey(
        TileZoneType.FastTurnStorage,
        createZone({ zoneType: TileZoneType.FastTurnStorage, usedCubicFeet: 750 }),
      ),
    ).toBe("fast_tile_75");
    expect(
      resolveTileTextureKey(
        TileZoneType.OversizeStorage,
        createZone({ zoneType: TileZoneType.OversizeStorage, usedCubicFeet: 1000 }),
      ),
    ).toBe("oversize_tile_100");
    expect(
      resolveTileTextureKey(
        TileZoneType.SpecialHandlingStorage,
        createZone({ zoneType: TileZoneType.SpecialHandlingStorage, usedCubicFeet: 250 }),
      ),
    ).toBe("special_tile_25");
  });

  it("returns travel tile art for travel zones and null for unsupported zones", () => {
    expect(resolveTileTextureKey(TileZoneType.Travel)).toBe("travel_tile");
    expect(resolveTileTextureKey(TileZoneType.Dock)).toBeNull();
    expect(resolveTileTextureKey(TileZoneType.Unassigned)).toBeNull();
  });
});
