import type { Command, CommandContext } from "./Command";
import type { MonthlyPlanQueuedEvent } from "../events/MonthlyPlanQueuedEvent";
import { cloneBudgetPlan } from "../planning/BudgetPlan";
import { validateMonthlyPlan } from "../systems/PlanningSystem";
import { commandFailed, commandSucceeded } from "./Command";

export class ConfirmMonthlyPlanCommand implements Command<"confirm-monthly-plan"> {
  readonly type = "confirm-monthly-plan";

  execute(context: CommandContext) {
    const pendingPlan = context.state.planning.pendingPlan;

    if (!context.state.planning.isPlanningActive || !pendingPlan) {
      return commandFailed("No monthly plan is waiting for confirmation");
    }

    const validationError = validateMonthlyPlan(context.state, pendingPlan);

    if (validationError) {
      return commandFailed(validationError);
    }

    context.state.planning.queuedPlan = {
      monthKey: pendingPlan.monthKey,
      totalHeadcount: pendingPlan.totalHeadcount,
      budget: cloneBudgetPlan(pendingPlan.budget),
      laborAssignments: { ...pendingPlan.laborAssignments },
    };
    context.state.planning.isPlanningActive = false;
    context.state.planning.activePlanId = null;
    context.state.planning.pendingPlan = null;
    context.state.planning.latestSnapshot = null;

    const event: MonthlyPlanQueuedEvent = {
      ...context.createEvent("monthly-plan-queued"),
      monthKey: context.state.planning.queuedPlan.monthKey,
      totalHeadcount: context.state.planning.queuedPlan.totalHeadcount,
      budget: cloneBudgetPlan(context.state.planning.queuedPlan.budget),
      laborAssignments: { ...context.state.planning.queuedPlan.laborAssignments },
    };

    return commandSucceeded([event]);
  }
}
