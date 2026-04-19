import freightClasses from "../../../data/config/freightClasses.json";
import type { DomainEvent } from "../events/DomainEvent";
import type { FreightBatch } from "../freight/FreightBatch";
import type { FreightFlowState } from "../freight/FreightFlowState";
import type { WarehouseMap } from "../world/WarehouseMap";
import type { Zone } from "../world/Zone";

type EventFactory = <TType extends string>(type: TType) => DomainEvent<TType>;

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
  ): DomainEvent[] {
    const events: DomainEvent[] = [];

    this.recalculateZoneUsage(freightFlow, warehouseMap);

    for (const batch of freightFlow.freightBatches) {
      if (batch.state !== "on-dock") {
        continue;
      }

      const zone = this.findStorageZoneForBatch(batch, warehouseMap);

      if (!zone) {
        continue;
      }

      batch.state = "in-storage";
      batch.storageZoneId = zone.id;
      batch.storedTick = currentTick;
      zone.usedCubicFeet += batch.cubicFeet;

      const event = {
        ...createEvent("freight-stored"),
        freightBatchId: batch.id,
        freightClassId: batch.freightClassId,
        zoneId: zone.id,
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

  private recalculateZoneUsage(freightFlow: FreightFlowState, warehouseMap: WarehouseMap): void {
    for (const zone of warehouseMap.zones) {
      zone.usedCubicFeet = 0;
    }

    for (const batch of freightFlow.freightBatches) {
      if (batch.state !== "in-storage" || !batch.storageZoneId) {
        continue;
      }

      const zone = warehouseMap.zones.find(
        (candidateZone) => candidateZone.id === batch.storageZoneId,
      );

      if (zone) {
        zone.usedCubicFeet += batch.cubicFeet;
      }
    }
  }
}
