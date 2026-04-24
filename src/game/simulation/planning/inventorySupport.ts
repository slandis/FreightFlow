import type { GameState } from "../core/GameState";
import { LaborRole } from "../types/enums";

export const INVENTORY_SUPPORT_CUBIC_FEET_PER_HEADCOUNT = 30_000_000;
export const INVENTORY_SUPPORT_BUDGET_POINTS_PER_HEADCOUNT = 5;

export interface InventorySupportRecommendation {
  forecastMonthlyVolumeCubicFeet: number;
  suggestedHeadcount: number;
  suggestedBudgetPoints: number;
}

export function getSuggestedInventorySupportHeadcount(
  forecastMonthlyVolumeCubicFeet: number,
): number {
  if (forecastMonthlyVolumeCubicFeet <= 0) {
    return 0;
  }

  return Math.max(
    1,
    Math.ceil(
      Math.max(0, forecastMonthlyVolumeCubicFeet) / INVENTORY_SUPPORT_CUBIC_FEET_PER_HEADCOUNT,
    ),
  );
}

export function getSuggestedInventorySupportBudgetPoints(suggestedHeadcount: number): number {
  return Math.max(0, suggestedHeadcount) * INVENTORY_SUPPORT_BUDGET_POINTS_PER_HEADCOUNT;
}

export function getActiveForecastMonthlyVolumeCubicFeet(state: GameState): number {
  return state.contracts.activeContracts.reduce(
    (total, contract) =>
      total +
      (contract.id === "baseline-general-freight" ? 0 : contract.expectedMonthlyThroughputCubicFeet),
    0,
  );
}

export function getPlannedForecastMonthlyVolumeCubicFeet(state: GameState): number {
  return (
    getActiveForecastMonthlyVolumeCubicFeet(state) +
    state.contracts.pendingOffers
      .filter((offer) => offer.decision === "accepted")
      .reduce((total, offer) => total + offer.expectedMonthlyThroughputCubicFeet, 0)
  );
}

export function getInventorySupportRecommendationForActiveContracts(
  state: GameState,
): InventorySupportRecommendation {
  const forecastMonthlyVolumeCubicFeet = getActiveForecastMonthlyVolumeCubicFeet(state);
  const suggestedHeadcount = getSuggestedInventorySupportHeadcount(forecastMonthlyVolumeCubicFeet);

  return {
    forecastMonthlyVolumeCubicFeet,
    suggestedHeadcount,
    suggestedBudgetPoints: getSuggestedInventorySupportBudgetPoints(suggestedHeadcount),
  };
}

export function getInventorySupportRecommendationForPlanning(
  state: GameState,
): InventorySupportRecommendation {
  const forecastMonthlyVolumeCubicFeet = getPlannedForecastMonthlyVolumeCubicFeet(state);
  const suggestedHeadcount = getSuggestedInventorySupportHeadcount(forecastMonthlyVolumeCubicFeet);

  return {
    forecastMonthlyVolumeCubicFeet,
    suggestedHeadcount,
    suggestedBudgetPoints: getSuggestedInventorySupportBudgetPoints(suggestedHeadcount),
  };
}

export function getAssignedInventoryTeamHeadcount(state: GameState): number {
  return (
    state.labor.pools.find((pool) => pool.roleId === LaborRole.InventoryTeam)?.assignedHeadcount ?? 0
  );
}
