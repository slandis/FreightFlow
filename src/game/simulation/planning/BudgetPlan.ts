import type { BudgetPlan } from "../core/GameState";

export const BUDGET_COST_PER_POINT_PER_TICK = 0.01;
export const WORKFORCE_OPERATING_COST_PER_HEAD_PER_TICK = 0.09;
export const HEADCOUNT_ADDITION_COST = 5000;
export const HEADCOUNT_REMOVAL_COST = 2500;

const MAX_MAINTENANCE_SUPPORT = 0.35;
const MAX_SAFETY_SUPPORT = 0.3;
const MAX_TRAINING_PRODUCTIVITY_BONUS = 0.15;
const MAX_OPERATIONS_SUPPORT = 0.16;
const MAX_INVENTORY_SUPPORT = 0.2;

export function createDefaultBudgetPlan(): BudgetPlan {
  return {
    maintenance: 5,
    training: 5,
    safety: 5,
    operationsSupport: 5,
    inventorySupport: 5,
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
    budget.inventorySupport +
    budget.contingency
  );
}

export function getBudgetCostPerTick(budget: BudgetPlan): number {
  return getTotalBudgetPoints(budget) * BUDGET_COST_PER_POINT_PER_TICK;
}

export function getHeadcountOperatingCostPerTick(totalHeadcount: number): number {
  return Math.max(0, totalHeadcount) * WORKFORCE_OPERATING_COST_PER_HEAD_PER_TICK;
}

export function getHeadcountChangeCost(
  currentHeadcount: number,
  plannedHeadcount: number,
): number {
  const sanitizedCurrent = Math.max(0, currentHeadcount);
  const sanitizedPlanned = Math.max(0, plannedHeadcount);

  if (sanitizedPlanned > sanitizedCurrent) {
    return (sanitizedPlanned - sanitizedCurrent) * HEADCOUNT_ADDITION_COST;
  }

  if (sanitizedPlanned < sanitizedCurrent) {
    return (sanitizedCurrent - sanitizedPlanned) * HEADCOUNT_REMOVAL_COST;
  }

  return 0;
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

export function getInventorySupport(budget: BudgetPlan): number {
  return Math.min(MAX_INVENTORY_SUPPORT, budget.inventorySupport * 0.01);
}
