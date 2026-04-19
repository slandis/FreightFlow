import type { GameState } from "../core/GameState";

export function selectCriticalQueues(_state: GameState): string[] {
  return [];
}

export function selectInboundQueueSummary(state: GameState) {
  return state.freightFlow.queues;
}

export function selectDoorSummary(state: GameState) {
  const activeDoors = state.freightFlow.doors.length;
  const idleDoors = state.freightFlow.doors.filter((door) => door.state === "idle").length;
  const reservedDoors = state.freightFlow.doors.filter((door) => door.state === "reserved").length;
  const occupiedDoors = state.freightFlow.doors.filter((door) => door.state === "occupied").length;
  const unloadingDoors = state.freightFlow.doors.filter((door) => door.state === "unloading").length;

  return {
    activeDoors,
    idleDoors,
    reservedDoors,
    occupiedDoors,
    unloadingDoors,
  };
}

export function selectDockFreightCubicFeet(state: GameState): number {
  return state.freightFlow.queues.dockFreightCubicFeet;
}

export function selectInboundTrailerCount(state: GameState): number {
  return state.freightFlow.metrics.totalInboundTrailersArrived;
}

export function selectAverageYardDwell(state: GameState): number {
  return state.freightFlow.queues.averageYardDwellTicks;
}

export function selectAverageDoorDwell(state: GameState): number {
  return state.freightFlow.queues.averageDoorDwellTicks;
}
