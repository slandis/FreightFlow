import type { WarehouseMap } from "../world/WarehouseMap";
import type { FreightFlowState } from "../freight/FreightFlowState";
import type { LaborState } from "../labor/LaborPool";
import { GameSpeed, LaborRole } from "../types/enums";
import { createDefaultBudgetPlan } from "../planning/BudgetPlan";

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

export interface BudgetPlan {
  maintenance: number;
  training: number;
  safety: number;
  operationsSupport: number;
  contingency: number;
}

export type LaborAssignmentPlan = Record<LaborRole, number>;

export interface MonthlyPlan {
  monthKey: string;
  budget: BudgetPlan;
  laborAssignments: LaborAssignmentPlan;
}

export interface PlanningSnapshot {
  monthKey: string;
  year: number;
  month: number;
  openedTick: number;
  cash: number;
  currentMonthRevenue: number;
  currentMonthLaborCost: number;
  currentMonthOperatingCost: number;
  currentMonthNet: number;
  inboundCubicFeet: number;
  outboundCubicFeet: number;
  throughputCubicFeet: number;
  yardTrailers: number;
  dockFreightCubicFeet: number;
  storageQueueCubicFeet: number;
  pickQueueCubicFeet: number;
  loadQueueCubicFeet: number;
  moraleScore: number;
  conditionScore: number;
  safetyScore: number;
  clientSatisfactionScore: number;
  customerSatisfactionScore: number;
  serviceLevel: number;
  contractHealth: ContractSummary["health"];
  totalHeadcount: number;
  unassignedHeadcount: number;
  topBottleneckLabel: string | null;
  topBottleneckPressure: string | null;
  storageUsedCubicFeet: number;
  storageCapacityCubicFeet: number;
  dockStorageNeedCount: number;
  activeAlertCount: number;
  criticalAlertCount: number;
  projectedBudgetCostPerTick: number;
}

export interface PlanningState {
  isPlanningActive: boolean;
  activePlanId: string | null;
  lastOpenedMonthKey: string | null;
  lastConfirmedMonthKey: string | null;
  pendingPlan: MonthlyPlan | null;
  currentPlan: MonthlyPlan;
  latestSnapshot: PlanningSnapshot | null;
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
  difficultyModeId: string;
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
  planning: PlanningState;
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

export function createInitialPlanningState(
  calendar: SimulationCalendar,
  labor: LaborState,
): PlanningState {
  const monthKey = getMonthKey(calendar);
  const currentPlan = {
    monthKey,
    budget: createDefaultBudgetPlan(),
    laborAssignments: createLaborAssignmentPlan(labor),
  };

  return {
    isPlanningActive: false,
    activePlanId: null,
    lastOpenedMonthKey: monthKey,
    lastConfirmedMonthKey: monthKey,
    pendingPlan: null,
    currentPlan,
    latestSnapshot: null,
  };
}

export function getMonthKey(calendar: SimulationCalendar): string {
  return `Y${calendar.year}-M${calendar.month}`;
}

export function createLaborAssignmentPlan(labor: LaborState): LaborAssignmentPlan {
  return Object.values(LaborRole).reduce((assignments, roleId) => {
    const pool = labor.pools.find((candidatePool) => candidatePool.roleId === roleId);

    assignments[roleId] = pool?.assignedHeadcount ?? 0;
    return assignments;
  }, {} as LaborAssignmentPlan);
}

function createScoreMetric(value: number): ScoreMetric {
  return {
    value,
    trend: "stable",
    drivers: [],
  };
}
