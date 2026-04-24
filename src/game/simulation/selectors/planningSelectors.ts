import type { GameState } from "../core/GameState";
import { getBudgetCostPerTick, getTotalBudgetPoints } from "../planning/BudgetPlan";
import { getInventorySupportRecommendationForPlanning } from "../planning/inventorySupport";

export function selectPlanningState(state: GameState) {
  return state.planning;
}

export function selectIsPlanningActive(state: GameState): boolean {
  return state.planning.isPlanningActive;
}

export function selectPendingPlan(state: GameState) {
  return state.planning.pendingPlan;
}

export function selectPlanningSnapshot(state: GameState) {
  return state.planning.latestSnapshot;
}

export function selectPlanningBudgetSummary(state: GameState) {
  const budget = state.planning.pendingPlan?.budget ?? state.planning.currentPlan.budget;

  return {
    budget,
    totalBudgetPoints: getTotalBudgetPoints(budget),
    projectedBudgetCostPerTick: getBudgetCostPerTick(budget),
  };
}

export function selectPlanningInventorySupportRecommendation(state: GameState) {
  return getInventorySupportRecommendationForPlanning(state);
}
