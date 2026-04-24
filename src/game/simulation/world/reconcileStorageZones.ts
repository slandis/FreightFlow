import type { GameState } from "../core/GameState";
import type { Zone } from "./Zone";
import { recalculateZoneUsage } from "./zoneUsage";

export function reconcileStorageZonesAfterMapEdit(
  state: GameState,
  previousZones: Zone[],
): void {
  const previousZonesById = new Map(previousZones.map((zone) => [zone.id, zone]));

  for (const batch of state.freightFlow.freightBatches) {
    if ((batch.state !== "in-storage" && batch.state !== "storing") || !batch.storageZoneId) {
      continue;
    }

    const previousZone = previousZonesById.get(batch.storageZoneId);

    if (!previousZone) {
      continue;
    }

    const remappedZone = findBestZoneMatch(previousZone, state.warehouseMap.zones);

    batch.storageZoneId = remappedZone?.id ?? null;
  }

  recalculateZoneUsage(state.freightFlow, state.warehouseMap);
}

function findBestZoneMatch(previousZone: Zone, nextZones: Zone[]): Zone | null {
  const previousTileIndexes = new Set(previousZone.tileIndexes);

  const candidates = nextZones
    .filter((zone) => zone.zoneType === previousZone.zoneType)
    .map((zone) => ({
      zone,
      overlapCount: zone.tileIndexes.reduce(
        (total, tileIndex) => total + (previousTileIndexes.has(tileIndex) ? 1 : 0),
        0,
      ),
    }))
    .filter((candidate) => candidate.overlapCount > 0)
    .sort((first, second) => {
      if (second.overlapCount !== first.overlapCount) {
        return second.overlapCount - first.overlapCount;
      }

      if (second.zone.tileIndexes.length !== first.zone.tileIndexes.length) {
        return second.zone.tileIndexes.length - first.zone.tileIndexes.length;
      }

      return first.zone.id.localeCompare(second.zone.id);
    });

  return candidates[0]?.zone ?? null;
}
