import type { GameState } from "../core/GameState";

export function selectCash(state: GameState): number {
  return state.cash;
}

export function selectKpis(state: GameState) {
  return state.kpis;
}

export function selectThroughputCubicFeet(state: GameState): number {
  return state.kpis.throughputCubicFeet;
}

export function selectEconomySummary(state: GameState) {
  return {
    cash: state.cash,
    currentMonthRevenue: state.economy.currentMonthRevenue,
    currentMonthLaborCost: state.economy.currentMonthLaborCost,
    currentMonthOperatingCost: state.economy.currentMonthOperatingCost,
    currentMonthNet: state.economy.currentMonthNet,
    lifetimeRevenue: state.economy.lifetimeRevenue,
    lifetimeLaborCost: state.economy.lifetimeLaborCost,
    lifetimeOperatingCost: state.economy.lifetimeOperatingCost,
    lifetimeNet: state.economy.lifetimeNet,
    revenuePerTick: state.economy.revenuePerTick,
    laborCostPerTick: state.economy.laborCostPerTick,
    operatingCostPerTick: state.economy.operatingCostPerTick,
  };
}

export function selectScoreSummary(state: GameState) {
  return state.scores;
}

export function selectFinanceBreakdown(state: GameState) {
  return {
    revenue: state.economy.currentMonthRevenue,
    laborCost: state.economy.currentMonthLaborCost,
    operatingCost: state.economy.currentMonthOperatingCost,
    net: state.economy.currentMonthNet,
    revenuePerTick: state.economy.revenuePerTick,
    laborCostPerTick: state.economy.laborCostPerTick,
    operatingCostPerTick: state.economy.operatingCostPerTick,
  };
}

export function selectConditionDetails(state: GameState) {
  return state.scores.condition;
}

export function selectSatisfactionSummary(state: GameState) {
  return {
    client: state.scores.clientSatisfaction,
    customer: state.scores.customerSatisfaction,
  };
}

export function selectContractSummary(state: GameState) {
  return state.contracts;
}

export function selectActiveAlerts(state: GameState) {
  return state.alerts.alerts.filter((alert) => alert.active);
}

export function selectCriticalAlertCount(state: GameState): number {
  return state.alerts.alerts.filter((alert) => alert.active && alert.severity === "critical")
    .length;
}
