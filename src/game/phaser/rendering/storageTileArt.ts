import { TileZoneType } from "../../simulation/types/enums";
import type { Zone } from "../../simulation/world/Zone";

const UTILIZATION_THRESHOLDS = [0, 25, 50, 75, 100] as const;

const texturePrefixByZoneType: Partial<Record<TileZoneType, string>> = {
  [TileZoneType.Travel]: "travel_tile",
  [TileZoneType.StandardStorage]: "standard_tile",
  [TileZoneType.BulkStorage]: "bulk_tile",
  [TileZoneType.FastTurnStorage]: "fast_tile",
  [TileZoneType.OversizeStorage]: "oversize_tile",
  [TileZoneType.SpecialHandlingStorage]: "special_tile",
};

export function resolveTileTextureKey(
  zoneType: TileZoneType,
  zone?: Zone | null,
): string | null {
  const prefix = texturePrefixByZoneType[zoneType];

  if (!prefix) {
    return null;
  }

  if (zoneType === TileZoneType.Travel) {
    return prefix;
  }

  if (!zone) {
    return null;
  }

  const utilizationPercent =
    zone.capacityCubicFeet > 0 ? (zone.usedCubicFeet / zone.capacityCubicFeet) * 100 : 0;
  const threshold = getHighestThresholdNotExceeding(utilizationPercent);

  return `${prefix}_${threshold.toString().padStart(2, "0")}`;
}

export function getHighestThresholdNotExceeding(utilizationPercent: number): number {
  const normalizedUtilization = Math.max(0, Math.min(100, utilizationPercent));
  let selectedThreshold: number = UTILIZATION_THRESHOLDS[0];

  for (const threshold of UTILIZATION_THRESHOLDS) {
    if (normalizedUtilization >= threshold) {
      selectedThreshold = threshold;
    }
  }

  return selectedThreshold;
}

export function getTileArtTextureKeys(): string[] {
  return [
    "travel_tile",
    ...Object.values(texturePrefixByZoneType)
      .filter((prefix): prefix is string => Boolean(prefix && prefix !== "travel_tile"))
      .flatMap((prefix) =>
        UTILIZATION_THRESHOLDS.map(
          (threshold) => `${prefix}_${threshold.toString().padStart(2, "0")}`,
        ),
      ),
  ];
}
