import type { WarehouseMap } from "../world/WarehouseMap";
import { GameSpeed } from "../types/enums";

export interface SimulationCalendar {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export interface KpiState {
  inboundCubicFeet: number;
  outboundCubicFeet: number;
  throughputCubicFeet: number;
  safetyScore: number;
}

export interface DebugState {
  lastCommandType: string | null;
  lastEventType: string | null;
}

export interface GameState {
  currentTick: number;
  calendar: SimulationCalendar;
  speed: GameSpeed;
  cash: number;
  kpis: KpiState;
  debug: DebugState;
  warehouseMap: WarehouseMap;
}
