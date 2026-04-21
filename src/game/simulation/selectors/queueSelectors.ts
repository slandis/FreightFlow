import type { GameState } from "../core/GameState";
import { selectDockCapacitySummary } from "../dock/dockCapacity";
import freightClasses from "../../../data/config/freightClasses.json";
import zoneTypes from "../../../data/config/zoneTypes.json";
import type { TileZoneType } from "../types/enums";

interface FreightClassConfig {
  id: string;
  name: string;
  compatibleZoneTypes: string[];
}

interface ZoneTypeConfig {
  id: string;
  name: string;
}

export interface DockStorageNeed {
  freightClassId: string;
  freightClassName: string;
  cubicFeetOnDock: number;
  largestBatchCubicFeet: number;
  compatibleZoneTypes: TileZoneType[];
  compatibleZoneNames: string[];
  matchingZoneCount: number;
  validMatchingZoneCount: number;
  invalidMatchingZoneCount: number;
  validCompatibleCapacityCubicFeet: number;
  largestCompatibleAvailableCubicFeet: number;
  missingCubicFeet: number;
  reason: string;
  ready: boolean;
}

const freightClassConfigById = new Map<string, FreightClassConfig>(
  (freightClasses as FreightClassConfig[]).map((freightClass) => [freightClass.id, freightClass]),
);

const zoneNameByType = new Map<string, string>(
  (zoneTypes as ZoneTypeConfig[]).map((zoneType) => [zoneType.id, zoneType.name]),
);

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

export function selectDockCapacity(state: GameState) {
  return selectDockCapacitySummary(state);
}

export function selectDockFreightCubicFeet(state: GameState): number {
  return state.freightFlow.queues.dockFreightCubicFeet;
}

export function selectDockStorageNeeds(state: GameState): DockStorageNeed[] {
  const dockBatches = state.freightFlow.freightBatches.filter(
    (batch) => batch.state === "on-dock",
  );
  const batchesByFreightClass = new Map<string, typeof dockBatches>();

  for (const batch of dockBatches) {
    const batches = batchesByFreightClass.get(batch.freightClassId) ?? [];

    batches.push(batch);
    batchesByFreightClass.set(batch.freightClassId, batches);
  }

  return [...batchesByFreightClass.entries()]
    .map(([freightClassId, batches]) => {
      const freightClass = freightClassConfigById.get(freightClassId);
      const compatibleZoneTypes = (freightClass?.compatibleZoneTypes ?? []) as TileZoneType[];
      const compatibleZoneTypeSet = new Set<TileZoneType>(compatibleZoneTypes);
      const matchingZones = state.warehouseMap.zones.filter((zone) =>
        compatibleZoneTypeSet.has(zone.zoneType),
      );
      const validMatchingZones = matchingZones.filter((zone) => zone.validForStorage);
      const cubicFeetOnDock = batches.reduce((total, batch) => total + batch.cubicFeet, 0);
      const largestBatchCubicFeet = Math.max(...batches.map((batch) => batch.cubicFeet));
      const availableCapacities = validMatchingZones.map((zone) =>
        Math.max(0, zone.capacityCubicFeet - zone.usedCubicFeet),
      );
      const validCompatibleCapacityCubicFeet = availableCapacities.reduce(
        (total, availableCapacity) => total + availableCapacity,
        0,
      );
      const largestCompatibleAvailableCubicFeet =
        availableCapacities.length > 0 ? Math.max(...availableCapacities) : 0;
      const missingCubicFeet = Math.max(0, cubicFeetOnDock - validCompatibleCapacityCubicFeet);
      const compatibleZoneNames = compatibleZoneTypes.map(
        (zoneType) => zoneNameByType.get(zoneType) ?? zoneType,
      );
      const reason = findDockStorageNeedReason({
        freightClassFound: Boolean(freightClass),
        matchingZoneCount: matchingZones.length,
        validMatchingZoneCount: validMatchingZones.length,
        largestBatchCubicFeet,
        largestCompatibleAvailableCubicFeet,
        missingCubicFeet,
      });

      return {
        freightClassId,
        freightClassName: freightClass?.name ?? freightClassId,
        cubicFeetOnDock,
        largestBatchCubicFeet,
        compatibleZoneTypes,
        compatibleZoneNames,
        matchingZoneCount: matchingZones.length,
        validMatchingZoneCount: validMatchingZones.length,
        invalidMatchingZoneCount: matchingZones.length - validMatchingZones.length,
        validCompatibleCapacityCubicFeet,
        largestCompatibleAvailableCubicFeet,
        missingCubicFeet,
        reason,
        ready: reason === "Ready for storage",
      };
    })
    .sort((first, second) => first.freightClassName.localeCompare(second.freightClassName));
}

function findDockStorageNeedReason(input: {
  freightClassFound: boolean;
  matchingZoneCount: number;
  validMatchingZoneCount: number;
  largestBatchCubicFeet: number;
  largestCompatibleAvailableCubicFeet: number;
  missingCubicFeet: number;
}): string {
  if (!input.freightClassFound) {
    return "Unknown freight class";
  }

  if (input.matchingZoneCount === 0) {
    return "No compatible storage zone assigned";
  }

  if (input.validMatchingZoneCount === 0) {
    return "Compatible storage is invalid";
  }

  if (input.largestCompatibleAvailableCubicFeet < input.largestBatchCubicFeet) {
    return "No compatible zone can fit largest dock batch";
  }

  if (input.missingCubicFeet > 0) {
    return "Insufficient compatible storage capacity";
  }

  return "Ready for storage";
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
