import type { WarehouseMap } from "../world/WarehouseMap";
import type { FreightFlowState } from "../freight/FreightFlowState";
import type { LaborState } from "../labor/LaborPool";
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
  revenue: number;
  laborCost: number;
  operatingCost: number;
  netOperatingResult: number;
  moraleScore: number;
  conditionScore: number;
  safetyScore: number;
  clientSatisfactionScore: number;
  customerSatisfactionScore: number;
}

export interface DebugState {
  lastCommandType: string | null;
  lastEventType: string | null;
}

export type ScoreTrend = "rising" | "stable" | "falling";
export type AlertSeverity = "info" | "warning" | "critical";

export interface EconomyState {
  lifetimeRevenue: number;
  lifetimeLaborCost: number;
  lifetimeOperatingCost: number;
  lifetimeNet: number;
  currentMonthRevenue: number;
  currentMonthLaborCost: number;
  currentMonthOperatingCost: number;
  currentMonthNet: number;
  revenuePerTick: number;
  laborCostPerTick: number;
  operatingCostPerTick: number;
  lastRevenueTick: number | null;
}

export interface ScoreDriver {
  label: string;
  impact: number;
}

export interface ScoreMetric {
  value: number;
  trend: ScoreTrend;
  drivers: ScoreDriver[];
}

export interface ScoreState {
  morale: ScoreMetric;
  condition: ScoreMetric;
  safety: ScoreMetric;
  clientSatisfaction: ScoreMetric;
  customerSatisfaction: ScoreMetric;
}

export interface ContractSummary {
  id: string;
  name: string;
  targetThroughputCubicFeetPerDay: number;
  minimumServiceLevel: number;
  health: "healthy" | "stable" | "at-risk" | "critical";
}

export interface ContractState {
  activeContracts: ContractSummary[];
  serviceLevel: number;
  missedDemandCubicFeet: number;
  fulfilledDemandCubicFeet: number;
}

export interface Alert {
  id: string;
  key: string;
  severity: AlertSeverity;
  message: string;
  active: boolean;
  raisedTick: number;
  resolvedTick: number | null;
}

export interface AlertState {
  alerts: Alert[];
  nextAlertSequence: number;
}

export interface GameState {
  currentTick: number;
  calendar: SimulationCalendar;
  speed: GameSpeed;
  cash: number;
  kpis: KpiState;
  debug: DebugState;
  warehouseMap: WarehouseMap;
  freightFlow: FreightFlowState;
  labor: LaborState;
  economy: EconomyState;
  scores: ScoreState;
  contracts: ContractState;
  alerts: AlertState;
}

export function createInitialEconomyState(): EconomyState {
  return {
    lifetimeRevenue: 0,
    lifetimeLaborCost: 0,
    lifetimeOperatingCost: 0,
    lifetimeNet: 0,
    currentMonthRevenue: 0,
    currentMonthLaborCost: 0,
    currentMonthOperatingCost: 0,
    currentMonthNet: 0,
    revenuePerTick: 0,
    laborCostPerTick: 0,
    operatingCostPerTick: 0,
    lastRevenueTick: null,
  };
}

export function createInitialScoreState(): ScoreState {
  return {
    morale: createScoreMetric(80),
    condition: createScoreMetric(85),
    safety: createScoreMetric(90),
    clientSatisfaction: createScoreMetric(82),
    customerSatisfaction: createScoreMetric(82),
  };
}

export function createInitialContractState(): ContractState {
  return {
    activeContracts: [
      {
        id: "baseline-general-freight",
        name: "Baseline General Freight",
        targetThroughputCubicFeetPerDay: 9000,
        minimumServiceLevel: 80,
        health: "stable",
      },
    ],
    serviceLevel: 100,
    missedDemandCubicFeet: 0,
    fulfilledDemandCubicFeet: 0,
  };
}

export function createInitialAlertState(): AlertState {
  return {
    alerts: [],
    nextAlertSequence: 1,
  };
}

function createScoreMetric(value: number): ScoreMetric {
  return {
    value,
    trend: "stable",
    drivers: [],
  };
}
