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
  totalHeadcount: number;
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
  contractHealth: ContractHealth;
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
  activeContractCount: number;
  acceptedOfferCount: number;
}

export interface PlanningState {
  isPlanningActive: boolean;
  activePlanId: string | null;
  lastOpenedMonthKey: string | null;
  lastConfirmedMonthKey: string | null;
  pendingPlan: MonthlyPlan | null;
  queuedPlan: MonthlyPlan | null;
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

export type ContractHealth = "healthy" | "stable" | "at-risk" | "critical";
export type ContractDecision = "undecided" | "accepted" | "rejected";
export type ContractRiskLevel = "low" | "moderate" | "high";
export type ContractDifficultyTag =
  | "capacity"
  | "speed"
  | "specialization"
  | "margin"
  | "consistency";

export interface ContractOfferAnalysis {
  recommendedStorageZoneTypes: string[];
  expectedAdditionalHeadcountByRole: Partial<Record<LaborRole, number>>;
  storageCapacityRisk: ContractRiskLevel;
  laborCapacityRisk: ContractRiskLevel;
  budgetPressure: ContractRiskLevel;
  estimatedMonthlyLaborCostDelta: number;
  estimatedMonthlyOperatingCostDelta: number;
  notes: string[];
}

export interface ContractOffer {
  id: string;
  monthKey: string;
  clientName: string;
  freightClassId: string;
  lengthMonths: number;
  expectedMonthlyThroughputCubicFeet: number;
  expectedWeeklyThroughputCubicFeet: number;
  revenuePerCubicFoot: number;
  minimumServiceLevel: number;
  dwellPenaltyThresholdTicks: number;
  dwellPenaltyRatePerCubicFoot: number;
  difficultyTag: ContractDifficultyTag;
  operationalChallengeNote: string;
  forecastRange: {
    minMonthlyCubicFeet: number;
    maxMonthlyCubicFeet: number;
  };
  analysis: ContractOfferAnalysis;
  decision: ContractDecision;
}

export interface ActiveContract {
  id: string;
  name: string;
  clientName: string;
  freightClassId: string | null;
  acceptedMonthKey: string;
  acceptedTick: number;
  acceptedMonthIndex: number;
  endMonthIndex: number;
  lengthMonths: number;
  expectedMonthlyThroughputCubicFeet: number;
  revenuePerCubicFoot: number;
  targetThroughputCubicFeetPerDay: number;
  minimumServiceLevel: number;
  dwellPenaltyThresholdTicks: number;
  dwellPenaltyRatePerCubicFoot: number;
  difficultyTag: ContractDifficultyTag;
  operationalChallengeNote: string;
  health: ContractHealth;
  serviceLevel: number;
  performanceScore: number;
  penaltyCostToDate: number;
  lastPenaltyTick: number | null;
}

export interface ContractState {
  pendingOffers: ContractOffer[];
  activeContracts: ActiveContract[];
  completedContracts: ActiveContract[];
  serviceLevel: number;
  missedDemandCubicFeet: number;
  fulfilledDemandCubicFeet: number;
  nextOfferSequence: number;
  nextActiveContractSequence: number;
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
    pendingOffers: [],
    activeContracts: [
      {
        id: "baseline-general-freight",
        name: "Baseline General Freight",
        clientName: "General Freight Network",
        freightClassId: null,
        acceptedMonthKey: "Y1-M1",
        acceptedTick: 0,
        acceptedMonthIndex: 1,
        endMonthIndex: Number.MAX_SAFE_INTEGER,
        lengthMonths: 999,
        expectedMonthlyThroughputCubicFeet: 270000,
        revenuePerCubicFoot: 0.32,
        targetThroughputCubicFeetPerDay: 9000,
        minimumServiceLevel: 80,
        dwellPenaltyThresholdTicks: 1440,
        dwellPenaltyRatePerCubicFoot: 0.015,
        difficultyTag: "consistency",
        operationalChallengeNote: "Mixed freight keeps the base network moving but rewards steady service.",
        health: "stable",
        serviceLevel: 100,
        performanceScore: 100,
        penaltyCostToDate: 0,
        lastPenaltyTick: null,
      },
    ],
    completedContracts: [],
    serviceLevel: 100,
    missedDemandCubicFeet: 0,
    fulfilledDemandCubicFeet: 0,
    nextOfferSequence: 1,
    nextActiveContractSequence: 1,
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
    totalHeadcount: labor.totalHeadcount,
    budget: createDefaultBudgetPlan(),
    laborAssignments: createLaborAssignmentPlan(labor),
  };

  return {
    isPlanningActive: false,
    activePlanId: null,
    lastOpenedMonthKey: monthKey,
    lastConfirmedMonthKey: monthKey,
    pendingPlan: null,
    queuedPlan: null,
    currentPlan,
    latestSnapshot: null,
  };
}

export function getMonthKey(calendar: SimulationCalendar): string {
  return `Y${calendar.year}-M${calendar.month}`;
}

export function getMonthIndex(calendar: SimulationCalendar): number {
  return (calendar.year - 1) * 12 + calendar.month;
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
