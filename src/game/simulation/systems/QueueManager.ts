import type { FreightFlowState } from "../freight/FreightFlowState";

export class QueueManager {
  updateQueues(freightFlow: FreightFlowState, currentTick: number): void {
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
      averageYardDwellTicks: average(yardDwellSamples),
      averageDoorDwellTicks: average(doorDwellSamples),
    };
  }
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}
