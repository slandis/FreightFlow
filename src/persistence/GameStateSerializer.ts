import { MAP_HEIGHT, MAP_WIDTH } from "../game/shared/constants/map";
import { getDifficultyModeById } from "../game/simulation/config/difficulty";
import type { GameState } from "../game/simulation/core/GameState";
import { GameSpeed, TileZoneType } from "../game/simulation/types/enums";
import { WarehouseMap } from "../game/simulation/world/WarehouseMap";
import type { Zone } from "../game/simulation/world/Zone";
import {
  SAVE_SCHEMA_VERSION,
  type SaveGamePayload,
  type SaveMetadata,
  type SerializedGameState,
  type SerializedTile,
  type ValidationResult,
} from "./SaveGameSchema";

export function serializeGameState(state: GameState): SerializedGameState {
  return cloneJson({
    ...state,
    warehouseMap: {
      width: state.warehouseMap.width,
      height: state.warehouseMap.height,
      tiles: state.warehouseMap.tiles.map<SerializedTile>((tile) => ({
        x: tile.x,
        y: tile.y,
        zoneType: tile.zoneType,
        isActiveDoor: tile.isActiveDoor,
      })),
      zones: state.warehouseMap.zones,
    },
  });
}

export function deserializeGameState(serialized: SerializedGameState): GameState {
  const map = new WarehouseMap(serialized.warehouseMap.width, serialized.warehouseMap.height);

  for (const serializedTile of serialized.warehouseMap.tiles) {
    const tile = map.getTile(serializedTile.x, serializedTile.y);

    if (!tile) {
      continue;
    }

    tile.zoneType = tile.isDockEdge ? TileZoneType.Dock : serializedTile.zoneType;
    tile.isActiveDoor = serializedTile.isActiveDoor;
  }

  map.rebuildZones();
  restoreZoneUsage(map.zones, serialized.warehouseMap.zones);

  const state = cloneJson({
    ...serialized,
    difficultyModeId: serialized.difficultyModeId ?? getDifficultyModeById().id,
    planning: {
      ...serialized.planning,
      skipMonthlyReviews: serialized.planning?.skipMonthlyReviews ?? false,
    },
    speed: GameSpeed.Paused,
  }) as Omit<GameState, "warehouseMap">;

  return {
    ...state,
    warehouseMap: map,
  };
}

export function createSavePayload(
  state: GameState,
  slotId: string,
  savedAt: Date,
): SaveGamePayload {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    savedAt: savedAt.toISOString(),
    slotId,
    metadata: createSaveMetadata(state),
    gameState: serializeGameState(state),
  };
}

export function createSaveMetadata(state: GameState): SaveMetadata {
  return {
    activeAlertCount: state.alerts.alerts.filter((alert) => alert.active).length,
    calendarLabel: `Y${state.calendar.year} M${state.calendar.month} D${state.calendar.day} ${state.calendar.hour
      .toString()
      .padStart(2, "0")}:${state.calendar.minute.toString().padStart(2, "0")}`,
    cash: state.cash,
    currentTick: state.currentTick,
    difficultyLabel: getDifficultyModeById(state.difficultyModeId).name,
  };
}

export function validateSavePayload(input: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return { success: false, errors: ["Save payload must be an object"] };
  }

  if (input.schemaVersion !== SAVE_SCHEMA_VERSION) {
    errors.push(`Unsupported save schema version: ${String(input.schemaVersion)}`);
  }

  if (typeof input.slotId !== "string" || input.slotId.length === 0) {
    errors.push("Save payload is missing a slot id");
  }

  if (typeof input.savedAt !== "string" || Number.isNaN(Date.parse(input.savedAt))) {
    errors.push("Save payload has an invalid savedAt value");
  }

  if (!isRecord(input.metadata)) {
    errors.push("Save payload is missing metadata");
  }

  if (!isRecord(input.gameState)) {
    errors.push("Save payload is missing game state");
    return { success: false, errors };
  }

  validateSerializedGameState(input.gameState, errors);

  return { success: errors.length === 0, errors };
}

function validateSerializedGameState(input: Record<string, unknown>, errors: string[]): void {
  if (!isFiniteNumber(input.currentTick)) {
    errors.push("Game state is missing currentTick");
  }

  if (!isRecord(input.calendar)) {
    errors.push("Game state is missing calendar");
  }

  if (!isRecord(input.warehouseMap)) {
    errors.push("Game state is missing warehouse map");
    return;
  }

  const map = input.warehouseMap;
  if (map.width !== MAP_WIDTH || map.height !== MAP_HEIGHT) {
    errors.push("Saved warehouse dimensions do not match this build");
  }

  if (!Array.isArray(map.tiles) || map.tiles.length !== MAP_WIDTH * MAP_HEIGHT) {
    errors.push("Saved warehouse tile count is invalid");
  }

  for (const field of [
    "freightFlow",
    "labor",
    "economy",
    "scores",
    "contracts",
    "alerts",
    "planning",
    "kpis",
  ]) {
    if (!isRecord(input[field])) {
      errors.push(`Game state is missing ${field}`);
    }
  }
}

function restoreZoneUsage(rebuiltZones: Zone[], serializedZones: Zone[]): void {
  const usedCapacityByZoneId = new Map(
    serializedZones.map((zone) => [zone.id, zone.usedCubicFeet]),
  );

  for (const zone of rebuiltZones) {
    zone.usedCubicFeet = usedCapacityByZoneId.get(zone.id) ?? 0;
  }
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
