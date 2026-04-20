import type { BudgetPlan, LaborAssignmentPlan } from "../core/GameState";
import type { DomainEvent } from "./DomainEvent";

export interface MonthlyPlanConfirmedEvent extends DomainEvent {
  type: "monthly-plan-confirmed";
  monthKey: string;
  budget: BudgetPlan;
  laborAssignments: LaborAssignmentPlan;
}
