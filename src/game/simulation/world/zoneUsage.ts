import type { FreightFlowState } from "../freight/FreightFlowState";
import type { WarehouseMap } from "./WarehouseMap";

export function recalculateZoneUsage(
  freightFlow: FreightFlowState,
  warehouseMap: WarehouseMap,
): void {
  for (const zone of warehouseMap.zones) {
    zone.usedCubicFeet = 0;
  }

  for (const batch of freightFlow.freightBatches) {
    const zoneId =
      batch.state === "in-storage" || batch.state === "storing"
        ? batch.storageZoneId
        : batch.state === "in-stage" || batch.state === "picked" || batch.state === "loading"
          ? batch.stageZoneId
          : null;

    if (!zoneId) {
      continue;
    }

    const zone = warehouseMap.zones.find((candidateZone) => candidateZone.id === zoneId);

    if (zone) {
      zone.usedCubicFeet += batch.cubicFeet;
    }
  }
}
