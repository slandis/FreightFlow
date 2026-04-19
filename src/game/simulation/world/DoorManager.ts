import type { FreightFlowState } from "../freight/FreightFlowState";
import type { WarehouseMap } from "./WarehouseMap";
import type { DoorNode } from "./DoorNode";

const INITIAL_DOOR_X_COORDINATES = [8, 14, 20, 26, 32, 38, 44, 50];

export function createInitialFreightFlowState(map: WarehouseMap): FreightFlowState {
  const doors: DoorNode[] = INITIAL_DOOR_X_COORDINATES.map((x, index) => {
    const tile = map.getTile(x, 0);

    if (tile) {
      tile.isActiveDoor = true;
    }

    return {
      id: `door-${(index + 1).toString().padStart(3, "0")}`,
      x,
      y: 0,
      mode: "flex",
      trailerId: null,
      state: "idle",
    };
  });

  return {
    trailers: [],
    freightBatches: [],
    doors,
    queues: {
      yardTrailers: 0,
      switchingTrailers: 0,
      unloadTrailers: 0,
      dockFreightCubicFeet: 0,
      averageYardDwellTicks: 0,
      averageDoorDwellTicks: 0,
    },
    metrics: {
      totalInboundTrailersArrived: 0,
      totalUnloadedCubicFeet: 0,
    },
    nextTrailerSequence: 1,
    nextFreightBatchSequence: 1,
  };
}
