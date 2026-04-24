import freightClasses from "../../../data/config/freightClasses.json";
import type { DomainEvent } from "../events/DomainEvent";
import type { FreightBatch } from "../freight/FreightBatch";
import type { FreightFlowState } from "../freight/FreightFlowState";
import type { LaborState } from "./LaborPool";
import { LaborAnalyticsRecorder } from "./LaborAnalyticsRecorder";
import { LaborRole } from "../types/enums";
import type { WarehouseMap } from "../world/WarehouseMap";
import type { Zone } from "../world/Zone";
import { recalculateZoneUsage } from "../world/zoneUsage";
import { getStorageDistanceMultiplier } from "./travelDistance";

type EventFactory = <TType extends string>(type: TType) => DomainEvent<TType>;
const laborAnalyticsRecorder = new LaborAnalyticsRecorder();

const compatibleZonesByFreightClass = new Map<string, Set<string>>(
  freightClasses.map((freightClass) => [
    freightClass.id,
    new Set(freightClass.compatibleZoneTypes),
  ]),
);

export class StorageSystem {
  process(
    freightFlow: FreightFlowState,
    warehouseMap: WarehouseMap,
    currentTick: number,
    createEvent: EventFactory,
    storageCapacityCubicFeet: number,
    labor: LaborState,
  ): DomainEvent[] {
    const events: DomainEvent[] = [];
    let remainingCapacity = storageCapacityCubicFeet;

    recalculateZoneUsage(freightFlow, warehouseMap);

    for (const batch of freightFlow.freightBatches) {
      if (batch.state !== "on-dock" || storageCapacityCubicFeet <= 0) {
        continue;
      }

      const zone = this.findStorageZoneForBatch(batch, warehouseMap);

      if (!zone) {
        continue;
      }

      batch.state = "storing";
      batch.storageZoneId = zone.id;
      batch.remainingStorageCubicFeet = batch.cubicFeet;
      batch.storageStartedTick = currentTick;
      zone.usedCubicFeet += batch.cubicFeet;
    }

    for (const batch of freightFlow.freightBatches) {
      if (batch.state !== "storing" || remainingCapacity <= 0) {
        continue;
      }

      const remainingStorageCubicFeet = batch.remainingStorageCubicFeet ?? batch.cubicFeet;
      const zone = warehouseMap.zones.find((candidateZone) => candidateZone.id === batch.storageZoneId);
      const distanceMultiplier = getStorageDistanceMultiplier(zone?.nearestTravelDistance ?? null);
      const effectiveCapacity = Math.max(1, remainingCapacity * distanceMultiplier);
      const processedCubicFeet = Math.min(effectiveCapacity, remainingStorageCubicFeet);
      remainingCapacity -= processedCubicFeet;
      batch.remainingStorageCubicFeet = Math.max(0, remainingStorageCubicFeet - processedCubicFeet);

      if (batch.remainingStorageCubicFeet > 0) {
        continue;
      }

      batch.state = "in-storage";
      batch.storedTick = currentTick;
      batch.remainingStorageCubicFeet = null;
      batch.dockTileIndex = null;
      laborAnalyticsRecorder.recordCompletedWork(
        labor,
        LaborRole.Storage,
        batch.cubicFeet,
        currentTick - (batch.storageStartedTick ?? currentTick),
      );

      const event = {
        ...createEvent("freight-stored"),
        freightBatchId: batch.id,
        freightClassId: batch.freightClassId,
        zoneId: batch.storageZoneId,
        cubicFeet: batch.cubicFeet,
      };

      events.push(event);
    }

    return events;
  }

  private findStorageZoneForBatch(batch: FreightBatch, warehouseMap: WarehouseMap): Zone | null {
    const compatibleZoneTypes = compatibleZonesByFreightClass.get(batch.freightClassId);

    if (!compatibleZoneTypes) {
      return null;
    }

    return (
      warehouseMap.zones
        .filter(
          (zone) =>
            zone.validForStorage &&
            compatibleZoneTypes.has(zone.zoneType) &&
            zone.capacityCubicFeet - zone.usedCubicFeet >= batch.cubicFeet,
        )
        .sort((first, second) => {
          const firstDistance = first.nearestTravelDistance ?? Number.MAX_SAFE_INTEGER;
          const secondDistance = second.nearestTravelDistance ?? Number.MAX_SAFE_INTEGER;

          if (firstDistance !== secondDistance) {
            return firstDistance - secondDistance;
          }

          return first.usedCubicFeet - second.usedCubicFeet;
        })[0] ?? null
    );
  }
}
