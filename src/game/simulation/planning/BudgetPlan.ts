import type { BudgetPlan } from "../core/GameState";

export const BUDGET_COST_PER_POINT_PER_TICK = 0.01;

const MAX_MAINTENANCE_SUPPORT = 0.35;
const MAX_SAFETY_SUPPORT = 0.3;
const MAX_TRAINING_PRODUCTIVITY_BONUS = 0.15;
const MAX_OPERATIONS_SUPPORT = 0.16;

export function createDefaultBudgetPlan(): BudgetPlan {
  return {
    maintenance: 5,
    training: 5,
    safety: 5,
    operationsSupport: 5,
    contingency: 0,
  };
}

export function cloneBudgetPlan(budget: BudgetPlan): BudgetPlan {
  return { ...budget };
}

export function validateBudgetPlan(budget: BudgetPlan): string | null {
  for (const [category, value] of Object.entries(budget)) {
    if (!Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
      return `${category} budget must be a non-negative integer`;
    }
  }

  return null;
}

export function getTotalBudgetPoints(budget: BudgetPlan): number {
  return (
    budget.maintenance +
    budget.training +
    budget.safety +
    budget.operationsSupport +
    budget.contingency
  );
}

export function getBudgetCostPerTick(budget: BudgetPlan): number {
  return getTotalBudgetPoints(budget) * BUDGET_COST_PER_POINT_PER_TICK;
}

export function getMaintenanceSupport(budget: BudgetPlan): number {
  return Math.min(MAX_MAINTENANCE_SUPPORT, budget.maintenance * 0.02);
}

export function getSafetySupport(budget: BudgetPlan): number {
  return Math.min(MAX_SAFETY_SUPPORT, budget.safety * 0.02);
}

export function getTrainingProductivityBonus(budget: BudgetPlan): number {
  return Math.min(MAX_TRAINING_PRODUCTIVITY_BONUS, Math.max(0, budget.training - 5) * 0.01);
}

export function getOperationsSupport(budget: BudgetPlan): number {
  return Math.min(MAX_OPERATIONS_SUPPORT, budget.operationsSupport * 0.008);
}
