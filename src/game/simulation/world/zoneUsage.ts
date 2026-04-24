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
    if ((batch.state !== "in-storage" && batch.state !== "storing") || !batch.storageZoneId) {
      continue;
    }

    const zone = warehouseMap.zones.find((candidateZone) => candidateZone.id === batch.storageZoneId);

    if (zone) {
      zone.usedCubicFeet += batch.cubicFeet;
    }
  }
}
