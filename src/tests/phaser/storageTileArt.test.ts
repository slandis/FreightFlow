import { describe, expect, it } from "vitest";
import { TileZoneType } from "../../game/simulation/types/enums";
import type { Zone } from "../../game/simulation/world/Zone";
import {
  getStorageUtilizationThreshold,
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
  it("maps non-zero storage utilization below 50 percent to the 25 tile art", () => {
    expect(getStorageUtilizationThreshold(0)).toBe(0);
    expect(getStorageUtilizationThreshold(1)).toBe(25);
    expect(getStorageUtilizationThreshold(18)).toBe(25);
    expect(getStorageUtilizationThreshold(25)).toBe(25);
    expect(getStorageUtilizationThreshold(49.9)).toBe(25);
    expect(getStorageUtilizationThreshold(50)).toBe(50);
    expect(getStorageUtilizationThreshold(75)).toBe(75);
    expect(getStorageUtilizationThreshold(99.9)).toBe(75);
    expect(getStorageUtilizationThreshold(100)).toBe(100);
  });

  it("maps storage zone types to the expected texture key prefixes", () => {
    expect(resolveTileTextureKey(TileZoneType.StandardStorage, createZone())).toBe(
      "standard_tile_00",
    );
    expect(
      resolveTileTextureKey(
        TileZoneType.StandardStorage,
        createZone({ usedCubicFeet: 180 }),
      ),
    ).toBe("standard_tile_25");
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
