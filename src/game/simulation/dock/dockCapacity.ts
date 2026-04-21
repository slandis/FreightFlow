import type { GameState } from "../core/GameState";
import type { FreightFlowState } from "../freight/FreightFlowState";
import type { Trailer } from "../freight/Trailer";
import type { DoorNode } from "../world/DoorNode";
import type { WarehouseMap } from "../world/WarehouseMap";

export const DOCK_TILE_CAPACITY_CUBIC_FEET = 5000;

export interface DockTileCapacity {
  tileIndex: number;
  x: number;
  y: number;
  supportingDoorIds: string[];
  capacityCubicFeet: number;
  usedCubicFeet: number;
  availableCubicFeet: number;
}

export interface DockCapacitySummary {
  supportedTileCount: number;
  totalCapacityCubicFeet: number;
  usedCubicFeet: number;
  availableCubicFeet: number;
}

export function selectDockCapacitySummary(state: GameState): DockCapacitySummary {
  return summarizeDockCapacity(state.warehouseMap, state.freightFlow);
}

export function summarizeDockCapacity(
  warehouseMap: WarehouseMap,
  freightFlow: FreightFlowState,
  doors: DoorNode[] = freightFlow.doors,
): DockCapacitySummary {
  const capacities = getDockTileCapacities(warehouseMap, freightFlow, doors);

  return {
    supportedTileCount: capacities.length,
    totalCapacityCubicFeet: capacities.reduce(
      (total, capacity) => total + capacity.capacityCubicFeet,
      0,
    ),
    usedCubicFeet: capacities.reduce((total, capacity) => total + capacity.usedCubicFeet, 0),
    availableCubicFeet: capacities.reduce(
      (total, capacity) => total + capacity.availableCubicFeet,
      0,
    ),
  };
}

export function getDockTileCapacities(
  warehouseMap: WarehouseMap,
  freightFlow: FreightFlowState,
  doors: DoorNode[] = freightFlow.doors,
): DockTileCapacity[] {
  const supportingDoorIdsByTileIndex = new Map<number, string[]>();

  for (const door of doors) {
    for (const tileIndex of getSupportedDockTileIndexes(warehouseMap, door)) {
      const supportingDoorIds = supportingDoorIdsByTileIndex.get(tileIndex) ?? [];

      if (!supportingDoorIds.includes(door.id)) {
        supportingDoorIds.push(door.id);
      }

      supportingDoorIdsByTileIndex.set(tileIndex, supportingDoorIds);
    }
  }

  const usageByTileIndex = buildDockTileUsageByTileIndex(freightFlow);

  return [...supportingDoorIdsByTileIndex.entries()]
    .map(([tileIndex, supportingDoorIds]) => {
      const tile = warehouseMap.tiles[tileIndex];
      const usedCubicFeet = usageByTileIndex.get(tileIndex) ?? 0;

      return {
        tileIndex,
        x: tile.x,
        y: tile.y,
        supportingDoorIds,
        capacityCubicFeet: DOCK_TILE_CAPACITY_CUBIC_FEET,
        usedCubicFeet,
        availableCubicFeet: Math.max(0, DOCK_TILE_CAPACITY_CUBIC_FEET - usedCubicFeet),
      };
    })
    .sort((first, second) => first.tileIndex - second.tileIndex);
}

export function findAvailableDockTileIndexForDoor(
  warehouseMap: WarehouseMap,
  freightFlow: FreightFlowState,
  door: DoorNode,
  requiredCubicFeet: number,
): number | null {
  const capacitiesByTileIndex = new Map(
    getDockTileCapacities(warehouseMap, freightFlow).map((capacity) => [
      capacity.tileIndex,
      capacity,
    ]),
  );

  return (
    getSupportedDockTileIndexes(warehouseMap, door)
      .map((tileIndex) => capacitiesByTileIndex.get(tileIndex))
      .filter((capacity): capacity is DockTileCapacity => Boolean(capacity))
      .filter((capacity) => capacity.availableCubicFeet >= requiredCubicFeet)
      .sort((first, second) => {
        if (first.availableCubicFeet !== second.availableCubicFeet) {
          return second.availableCubicFeet - first.availableCubicFeet;
        }

        return first.tileIndex - second.tileIndex;
      })[0]?.tileIndex ?? null
  );
}

export function findAvailableInboundDoorAssignment(
  warehouseMap: WarehouseMap,
  freightFlow: FreightFlowState,
  trailer: Trailer,
): { door: DoorNode; dockTileIndex: number } | null {
  for (const door of freightFlow.doors) {
    if (door.state !== "idle" || (door.mode !== "inbound" && door.mode !== "flex")) {
      continue;
    }

    const dockTileIndex = findAvailableDockTileIndexForDoor(
      warehouseMap,
      freightFlow,
      door,
      getTrailerReservedDockCubicFeet(freightFlow, trailer),
    );

    if (dockTileIndex !== null) {
      return { door, dockTileIndex };
    }
  }

  return null;
}

export function countAvailableInboundDoorAssignments(state: GameState): number {
  const waitingInboundTrailer = state.freightFlow.trailers
    .filter((trailer) => trailer.direction === "inbound" && trailer.state === "yard")
    .sort((first, second) => first.arrivalTick - second.arrivalTick)[0];

  if (!waitingInboundTrailer) {
    return 0;
  }

  return state.freightFlow.doors.filter((door) => {
    if (door.state !== "idle" || (door.mode !== "inbound" && door.mode !== "flex")) {
      return false;
    }

    return (
      findAvailableDockTileIndexForDoor(
        state.warehouseMap,
        state.freightFlow,
        door,
        getTrailerReservedDockCubicFeet(state.freightFlow, waitingInboundTrailer),
      ) !== null
    );
  }).length;
}

export function wouldDoorRemovalOrphanDockCapacity(
  warehouseMap: WarehouseMap,
  freightFlow: FreightFlowState,
  doorToRemove: DoorNode,
): boolean {
  const remainingDoors = freightFlow.doors.filter((door) => door.id !== doorToRemove.id);
  const remainingSupportedTileIndexes = new Set(
    getDockTileCapacities(warehouseMap, freightFlow, remainingDoors).map(
      (capacity) => capacity.tileIndex,
    ),
  );
  const occupiedTileIndexes = [...buildDockTileUsageByTileIndex(freightFlow).entries()]
    .filter(([, usedCubicFeet]) => usedCubicFeet > 0)
    .map(([tileIndex]) => tileIndex);

  return occupiedTileIndexes.some(
    (tileIndex) =>
      getSupportedDockTileIndexes(warehouseMap, doorToRemove).includes(tileIndex) &&
      !remainingSupportedTileIndexes.has(tileIndex),
  );
}

function buildDockTileUsageByTileIndex(freightFlow: FreightFlowState): Map<number, number> {
  const usageByTileIndex = new Map<number, number>();

  for (const batch of freightFlow.freightBatches) {
    if (
      batch.dockTileIndex === null ||
      (batch.state !== "on-dock" && batch.state !== "storing")
    ) {
      continue;
    }

    usageByTileIndex.set(
      batch.dockTileIndex,
      (usageByTileIndex.get(batch.dockTileIndex) ?? 0) + batch.cubicFeet,
    );
  }

  for (const trailer of freightFlow.trailers) {
    if (
      trailer.dockTileIndex === null ||
      (trailer.state !== "yard" &&
        trailer.state !== "switching-to-door" &&
        trailer.state !== "at-door" &&
        trailer.state !== "unloading")
    ) {
      continue;
    }

    usageByTileIndex.set(
      trailer.dockTileIndex,
      (usageByTileIndex.get(trailer.dockTileIndex) ?? 0) +
        getTrailerReservedDockCubicFeet(freightFlow, trailer),
    );
  }

  return usageByTileIndex;
}

function getTrailerReservedDockCubicFeet(
  freightFlow: FreightFlowState,
  trailer: Trailer,
): number {
  const freightBatches = freightFlow.freightBatches.filter((batch) =>
    trailer.freightBatchIds.includes(batch.id),
  );

  if (freightBatches.length === 0) {
    return trailer.remainingUnloadCubicFeet;
  }

  return freightBatches.reduce((total, batch) => total + batch.cubicFeet, 0);
}

function getSupportedDockTileIndexes(
  warehouseMap: WarehouseMap,
  door: DoorNode,
): number[] {
  const candidateCoordinates = [
    [door.x, door.y],
    [door.x - 1, door.y],
    [door.x + 1, door.y],
    [door.x, door.y - 1],
    [door.x, door.y + 1],
  ];
  const tileIndexes = new Set<number>();

  for (const [x, y] of candidateCoordinates) {
    const tile = warehouseMap.getTile(x, y);

    if (!tile?.isDockEdge) {
      continue;
    }

    tileIndexes.add(warehouseMap.getTileIndex(tile.x, tile.y));
  }

  return [...tileIndexes.values()];
}
