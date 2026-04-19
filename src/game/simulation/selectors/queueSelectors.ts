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
  const loadingDoors = state.freightFlow.doors.filter((door) => door.state === "loading").length;

  return {
    activeDoors,
    idleDoors,
    reservedDoors,
    occupiedDoors,
    unloadingDoors,
    loadingDoors,
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

export function selectInventoryByFreightClass(state: GameState): Record<string, number> {
  return state.freightFlow.inventoryByFreightClass;
}

export function selectTotalStoredCubicFeet(state: GameState): number {
  return Object.values(state.freightFlow.inventoryByFreightClass).reduce(
    (total, cubicFeet) => total + cubicFeet,
    0,
  );
}

export function selectStorageCapacitySummary(state: GameState) {
  const storageZones = state.warehouseMap.zones.filter((zone) => zone.capacityCubicFeet > 0);

  return {
    usedCubicFeet: storageZones.reduce((total, zone) => total + zone.usedCubicFeet, 0),
    capacityCubicFeet: storageZones.reduce((total, zone) => total + zone.capacityCubicFeet, 0),
  };
}

export function selectStorageQueueCubicFeet(state: GameState): number {
  return state.freightFlow.queues.storageQueueCubicFeet;
}

export function selectOpenOutboundOrderCount(state: GameState): number {
  return state.freightFlow.outboundOrders.filter((order) => order.state === "open").length;
}

export function selectPickedOutboundOrderCount(state: GameState): number {
  return state.freightFlow.outboundOrders.filter((order) => order.state === "picked").length;
}

export function selectLoadingOutboundOrderCount(state: GameState): number {
  return state.freightFlow.outboundOrders.filter((order) => order.state === "loading").length;
}

export function selectCompletedOutboundOrderCount(state: GameState): number {
  return state.freightFlow.outboundOrders.filter((order) => order.state === "complete").length;
}

export function selectOutboundShippedCubicFeet(state: GameState): number {
  return state.freightFlow.metrics.totalOutboundCubicFeetShipped;
}

export function selectOutboundQueueSummary(state: GameState) {
  return {
    openOrders: selectOpenOutboundOrderCount(state),
    pickedOrders: selectPickedOutboundOrderCount(state),
    loadingOrders: selectLoadingOutboundOrderCount(state),
    completedOrders: selectCompletedOutboundOrderCount(state),
    blockedOrders: state.freightFlow.outboundOrders.filter((order) => order.state === "blocked")
      .length,
    pickQueueCubicFeet: state.freightFlow.queues.pickQueueCubicFeet,
    loadQueueCubicFeet: state.freightFlow.queues.loadQueueCubicFeet,
  };
}
