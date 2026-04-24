import type { GameState } from "../core/GameState";
import type { FreightFlowState } from "../freight/FreightFlowState";
import type { Trailer } from "../freight/Trailer";
import { TileZoneType } from "../types/enums";
import type { DoorNode } from "../world/DoorNode";
import type { WarehouseMap } from "../world/WarehouseMap";
import type { Zone } from "../world/Zone";

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
  const stageUsageByZoneId = buildStageUsageByZoneId(freightFlow);

  return warehouseMap.zones
    .filter((zone) => zone.zoneType === TileZoneType.Stage)
    .map((zone) => {
      const supportingDoorIds = doors
        .filter((door) => doesDoorSupportZone(warehouseMap, door, zone))
        .map((door) => door.id);
      const anchorTile = warehouseMap.tiles[zone.tileIndexes[0]];
      const usedCubicFeet = stageUsageByZoneId.get(zone.id) ?? 0;

      return {
        tileIndex: zone.tileIndexes[0],
        x: anchorTile?.x ?? 0,
        y: anchorTile?.y ?? 0,
        supportingDoorIds,
        capacityCubicFeet: zone.capacityCubicFeet,
        usedCubicFeet,
        availableCubicFeet: Math.max(0, zone.capacityCubicFeet - usedCubicFeet),
      };
    })
    .sort((first, second) => first.tileIndex - second.tileIndex);
}

export function findAvailableInboundDoorAssignment(
  warehouseMap: WarehouseMap,
  freightFlow: FreightFlowState,
  trailer: Trailer,
): { door: DoorNode; stageZoneId: string } | null {
  const stageUsageByZoneId = buildStageUsageByZoneId(freightFlow);
  const requiredCubicFeet = getTrailerReservedDockCubicFeet(freightFlow, trailer);

  for (const door of freightFlow.doors) {
    if (door.state !== "idle" || (door.mode !== "inbound" && door.mode !== "flex")) {
      continue;
    }

    const stageZone = getBestStageZoneForDoor(
      warehouseMap,
      door,
      requiredCubicFeet,
      stageUsageByZoneId,
    );

    if (stageZone) {
      return { door, stageZoneId: stageZone.id };
    }
  }

  return null;
}

export function findAvailableOutboundStageZone(
  warehouseMap: WarehouseMap,
  freightFlow: FreightFlowState,
  requiredCubicFeet: number,
): Zone | null {
  const stageUsageByZoneId = buildStageUsageByZoneId(freightFlow);

  return (
    warehouseMap.zones
      .filter(
        (zone) =>
          zone.zoneType === TileZoneType.Stage &&
          zone.validForStorage &&
          zone.capacityCubicFeet - (stageUsageByZoneId.get(zone.id) ?? 0) >= requiredCubicFeet &&
          freightFlow.doors.some(
            (door) =>
              (door.mode === "outbound" || door.mode === "flex") &&
              doesDoorSupportZone(warehouseMap, door, zone),
          ),
      )
      .sort((first, second) => {
        const firstDistance = first.nearestDoorDistance ?? Number.MAX_SAFE_INTEGER;
        const secondDistance = second.nearestDoorDistance ?? Number.MAX_SAFE_INTEGER;

        if (firstDistance !== secondDistance) {
          return firstDistance - secondDistance;
        }

        return first.tileIndexes.length - second.tileIndexes.length;
      })[0] ?? null
  );
}

export function findAvailableOutboundDoorForStageZone(
  freightFlow: FreightFlowState,
  warehouseMap: WarehouseMap,
  stageZoneId: string,
): DoorNode | null {
  const zone = warehouseMap.zones.find((candidateZone) => candidateZone.id === stageZoneId);

  if (!zone) {
    return null;
  }

  return (
    freightFlow.doors.find(
      (door) =>
        door.state === "idle" &&
        (door.mode === "outbound" || door.mode === "flex") &&
        doesDoorSupportZone(warehouseMap, door, zone),
    ) ?? null
  );
}

export function countAvailableInboundDoorAssignments(state: GameState): number {
  const waitingInboundTrailer = state.freightFlow.trailers
    .filter((trailer) => trailer.direction === "inbound" && trailer.state === "yard")
    .sort((first, second) => first.arrivalTick - second.arrivalTick)[0];

  if (!waitingInboundTrailer) {
    return 0;
  }

  const stageUsageByZoneId = buildStageUsageByZoneId(state.freightFlow);
  const requiredCubicFeet = getTrailerReservedDockCubicFeet(state.freightFlow, waitingInboundTrailer);

  return state.freightFlow.doors.filter((door) => {
    if (door.state !== "idle" || (door.mode !== "inbound" && door.mode !== "flex")) {
      return false;
    }

    return Boolean(
      getBestStageZoneForDoor(state.warehouseMap, door, requiredCubicFeet, stageUsageByZoneId),
    );
  }).length;
}

export function wouldDoorRemovalOrphanDockCapacity(
  warehouseMap: WarehouseMap,
  freightFlow: FreightFlowState,
  doorToRemove: DoorNode,
): boolean {
  const stageUsageByZoneId = buildStageUsageByZoneId(freightFlow);

  return warehouseMap.zones
    .filter((zone) => zone.zoneType === TileZoneType.Stage)
    .some((zone) => {
      if (
        !doesDoorSupportZone(warehouseMap, doorToRemove, zone) ||
        (stageUsageByZoneId.get(zone.id) ?? 0) <= 0
      ) {
        return false;
      }

      return !freightFlow.doors.some(
        (door) =>
          door.id !== doorToRemove.id && doesDoorSupportZone(warehouseMap, door, zone),
      );
    });
}

function getBestStageZoneForDoor(
  warehouseMap: WarehouseMap,
  door: DoorNode,
  requiredCubicFeet: number,
  stageUsageByZoneId: Map<string, number>,
): Zone | null {
  return (
    warehouseMap.zones
      .filter(
        (zone) =>
          zone.zoneType === TileZoneType.Stage &&
          zone.validForStorage &&
          doesDoorSupportZone(warehouseMap, door, zone) &&
          zone.capacityCubicFeet - (stageUsageByZoneId.get(zone.id) ?? 0) >= requiredCubicFeet,
      )
      .sort((first, second) => {
        const firstDistance = first.nearestDoorDistance ?? Number.MAX_SAFE_INTEGER;
        const secondDistance = second.nearestDoorDistance ?? Number.MAX_SAFE_INTEGER;

        if (firstDistance !== secondDistance) {
          return firstDistance - secondDistance;
        }

        return (stageUsageByZoneId.get(first.id) ?? 0) - (stageUsageByZoneId.get(second.id) ?? 0);
      })[0] ?? null
  );
}

function buildStageUsageByZoneId(freightFlow: FreightFlowState): Map<string, number> {
  const usageByZoneId = new Map<string, number>();

  for (const batch of freightFlow.freightBatches) {
    if (
      !batch.stageZoneId ||
      (batch.state !== "in-stage" &&
        batch.state !== "storing" &&
        batch.state !== "picked" &&
        batch.state !== "loading")
    ) {
      continue;
    }

    usageByZoneId.set(
      batch.stageZoneId,
      (usageByZoneId.get(batch.stageZoneId) ?? 0) + batch.cubicFeet,
    );
  }

  for (const trailer of freightFlow.trailers) {
    if (
      !trailer.stageZoneId ||
      (trailer.state !== "switching-to-door" &&
        trailer.state !== "at-door" &&
        trailer.state !== "unloading")
    ) {
      continue;
    }

    usageByZoneId.set(
      trailer.stageZoneId,
      (usageByZoneId.get(trailer.stageZoneId) ?? 0) +
        getTrailerReservedDockCubicFeet(freightFlow, trailer),
    );
  }

  return usageByZoneId;
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

function doesDoorSupportZone(
  warehouseMap: WarehouseMap,
  door: DoorNode,
  zone: Zone,
): boolean {
  return zone.tileIndexes.some((tileIndex) => {
    const tile = warehouseMap.tiles[tileIndex];

    if (!tile) {
      return false;
    }

    return Math.abs(tile.x - door.x) + Math.abs(tile.y - door.y) === 1;
  });
}
