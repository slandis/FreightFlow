import type { FreightFlowState } from "../freight/FreightFlowState";
import type { OutboundOrder } from "../freight/OutboundOrder";
import type { WarehouseMap } from "../world/WarehouseMap";

export function getStorageDistanceMultiplier(distance: number | null): number {
  if (distance === null || distance <= 1) {
    return 1;
  }

  if (distance === 2) {
    return 0.92;
  }

  return 0.84;
}

export function getPickDistanceMultiplier(distance: number | null): number {
  if (distance === null || distance <= 1) {
    return 1;
  }

  if (distance === 2) {
    return 0.95;
  }

  return 0.9;
}

export function getWeightedStorageDistanceForOrder(
  order: OutboundOrder,
  freightFlow: FreightFlowState,
  warehouseMap: WarehouseMap,
): number | null {
  let weightedDistance = 0;
  let totalCubicFeet = 0;

  for (const batchId of order.freightBatchIds) {
    const batch = freightFlow.freightBatches.find((candidateBatch) => candidateBatch.id === batchId);

    if (!batch?.storageZoneId) {
      continue;
    }

    const zone = warehouseMap.zones.find((candidateZone) => candidateZone.id === batch.storageZoneId);
    const distance = zone?.nearestTravelDistance;

    if (distance === null || distance === undefined) {
      continue;
    }

    weightedDistance += distance * batch.cubicFeet;
    totalCubicFeet += batch.cubicFeet;
  }

  if (totalCubicFeet <= 0) {
    return null;
  }

  return weightedDistance / totalCubicFeet;
}
