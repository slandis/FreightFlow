import type { BudgetPlan } from "../core/GameState";
import type { DomainEvent } from "./DomainEvent";

export interface BudgetPlanUpdatedEvent extends DomainEvent {
  type: "budget-plan-updated";
  monthKey: string;
  budget: BudgetPlan;
  projectedBudgetCostPerTick: number;
}
