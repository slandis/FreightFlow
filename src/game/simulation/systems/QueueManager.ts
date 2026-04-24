import type { FreightFlowState } from "../freight/FreightFlowState";
import type { WarehouseMap } from "../world/WarehouseMap";
import { recalculateZoneUsage } from "../world/zoneUsage";

export class QueueManager {
  updateQueues(
    freightFlow: FreightFlowState,
    currentTick: number,
    warehouseMap?: WarehouseMap,
  ): void {
    const yardTrailers = freightFlow.trailers.filter((trailer) => trailer.state === "yard");
    const switchingTrailers = freightFlow.trailers.filter(
      (trailer) => trailer.state === "switching-to-door",
    );
    const unloadTrailers = freightFlow.trailers.filter(
      (trailer) => trailer.state === "at-door" || trailer.state === "unloading",
    );
    const dockFreightCubicFeet = freightFlow.freightBatches
      .filter((batch) => batch.state === "on-dock")
      .reduce((total, batch) => total + batch.cubicFeet, 0);
    const storageQueueCubicFeet = freightFlow.freightBatches
      .filter((batch) => batch.state === "on-dock" || batch.state === "storing")
      .reduce((total, batch) => total + (batch.remainingStorageCubicFeet ?? batch.cubicFeet), 0);
    const pickQueueCubicFeet = freightFlow.outboundOrders
      .filter((order) => order.state === "open" || order.state === "picking")
      .reduce((total, order) => total + order.remainingPickCubicFeet, 0);
    const loadQueueCubicFeet = freightFlow.outboundOrders
      .filter((order) => order.state === "picked" || order.state === "loading")
      .reduce((total, order) => total + order.remainingLoadCubicFeet, 0);
    const yardDwellSamples = freightFlow.trailers
      .filter((trailer) => trailer.state === "yard")
      .map((trailer) => currentTick - trailer.arrivalTick);
    const doorDwellSamples = freightFlow.trailers
      .filter((trailer) => trailer.doorAssignedTick !== null && trailer.completedTick === null)
      .map((trailer) => currentTick - (trailer.doorAssignedTick ?? currentTick));

    freightFlow.queues = {
      yardTrailers: yardTrailers.length,
      switchingTrailers: switchingTrailers.length,
      unloadTrailers: unloadTrailers.length,
      dockFreightCubicFeet,
      storageQueueCubicFeet,
      pickQueueCubicFeet,
      loadQueueCubicFeet,
      averageYardDwellTicks: average(yardDwellSamples),
      averageDoorDwellTicks: average(doorDwellSamples),
    };

    freightFlow.inventoryByFreightClass = calculateInventoryByFreightClass(freightFlow);

    if (warehouseMap) {
      recalculateZoneUsage(freightFlow, warehouseMap);
    }
  }
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function calculateInventoryByFreightClass(freightFlow: FreightFlowState): Record<string, number> {
  const inventory: Record<string, number> = {};

  for (const batch of freightFlow.freightBatches) {
    if (batch.state !== "in-storage" || batch.outboundOrderId !== null) {
      continue;
    }

    inventory[batch.freightClassId] = (inventory[batch.freightClassId] ?? 0) + batch.cubicFeet;
  }

  return inventory;
}
