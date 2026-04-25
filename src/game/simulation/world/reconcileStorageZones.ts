import type { GameState } from "../core/GameState";
import type { Trailer } from "../freight/Trailer";
import type { Zone } from "./Zone";
import { recalculateZoneUsage } from "./zoneUsage";

export function reconcileStorageZonesAfterMapEdit(
  state: GameState,
  previousZones: Zone[],
): void {
  const previousZonesById = new Map(previousZones.map((zone) => [zone.id, zone]));

  for (const batch of state.freightFlow.freightBatches) {
    if ((batch.state === "in-storage" || batch.state === "storing") && batch.storageZoneId) {
      batch.storageZoneId = remapZoneId(
        batch.storageZoneId,
        previousZonesById,
        state.warehouseMap.zones,
      );
    }

    if (
      (batch.state === "in-stage" || batch.state === "picked" || batch.state === "loading") &&
      batch.stageZoneId
    ) {
      batch.stageZoneId = remapZoneId(
        batch.stageZoneId,
        previousZonesById,
        state.warehouseMap.zones,
      );
    }
  }

  for (const trailer of state.freightFlow.trailers) {
    if (!shouldRemapTrailerStageZone(trailer) || !trailer.stageZoneId) {
      continue;
    }

    trailer.stageZoneId = remapZoneId(
      trailer.stageZoneId,
      previousZonesById,
      state.warehouseMap.zones,
    );
  }

  recalculateZoneUsage(state.freightFlow, state.warehouseMap);
}

function remapZoneId(
  zoneId: string,
  previousZonesById: Map<string, Zone>,
  nextZones: Zone[],
): string | null {
  const previousZone = previousZonesById.get(zoneId);

  if (!previousZone) {
    return null;
  }

  const remappedZone = findBestZoneMatch(previousZone, nextZones);

  return remappedZone?.id ?? null;
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

function shouldRemapTrailerStageZone(trailer: Trailer): boolean {
  return (
    trailer.state === "switching-to-door" ||
    trailer.state === "at-door" ||
    trailer.state === "unloading" ||
    trailer.state === "loading"
  );
}
