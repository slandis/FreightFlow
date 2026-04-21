import type { BudgetPlan, LaborAssignmentPlan } from "../core/GameState";
import type { DomainEvent } from "./DomainEvent";

export interface MonthlyPlanQueuedEvent extends DomainEvent {
  type: "monthly-plan-queued";
  monthKey: string;
  totalHeadcount: number;
  budget: BudgetPlan;
  laborAssignments: LaborAssignmentPlan;
}
