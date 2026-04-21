import type {
  AlertState,
  ContractState,
  DebugState,
  EconomyState,
  GameState,
  KpiState,
  PlanningState,
  ScoreState,
  SimulationCalendar,
} from "../game/simulation/core/GameState";
import type { FreightFlowState } from "../game/simulation/freight/FreightFlowState";
import type { LaborState } from "../game/simulation/labor/LaborPool";
import type { GameSpeed, TileZoneType } from "../game/simulation/types/enums";
import type { Zone } from "../game/simulation/world/Zone";

export const SAVE_SCHEMA_VERSION = 2;
export const SAVE_SLOT_IDS = ["slot-1", "slot-2", "slot-3"] as const;

export type SaveSchemaVersion = typeof SAVE_SCHEMA_VERSION;
export type SaveSlotId = (typeof SAVE_SLOT_IDS)[number] | string;

export interface SaveMetadata {
  activeAlertCount: number;
  calendarLabel: string;
  cash: number;
  currentTick: number;
  difficultyLabel?: string;
}

export interface SerializedTile {
  x: number;
  y: number;
  zoneType: TileZoneType;
  isActiveDoor: boolean;
}

export interface SerializedWarehouseMap {
  width: number;
  height: number;
  tiles: SerializedTile[];
  zones: Zone[];
}

export interface SerializedGameState
  extends Omit<GameState, "warehouseMap" | "speed"> {
  speed: GameSpeed;
  warehouseMap: SerializedWarehouseMap;
  freightFlow: FreightFlowState;
  labor: LaborState;
  economy: EconomyState;
  scores: ScoreState;
  contracts: ContractState;
  alerts: AlertState;
  planning: PlanningState;
  kpis: KpiState;
  debug: DebugState;
  calendar: SimulationCalendar;
}

export interface SaveGamePayload {
  schemaVersion: SaveSchemaVersion;
  savedAt: string;
  slotId: string;
  metadata: SaveMetadata;
  gameState: SerializedGameState;
}

export interface ValidationResult {
  success: boolean;
  errors: string[];
}

export interface SaveSlotSummary {
  slotId: string;
  isEmpty: boolean;
  savedAt: string | null;
  metadata: SaveMetadata | null;
  error: string | null;
}

export function createEmptySlotSummary(slotId: string): SaveSlotSummary {
  return {
    slotId,
    isEmpty: true,
    savedAt: null,
    metadata: null,
    error: null,
  };
}
