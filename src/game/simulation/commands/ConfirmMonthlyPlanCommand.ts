import type { Command, CommandContext } from "./Command";
import { activateAcceptedContractOffers } from "../contracts/contractOffers";
import { LaborManager } from "../labor/LaborManager";
import { cloneBudgetPlan } from "../planning/BudgetPlan";
import { validateMonthlyPlan } from "../systems/PlanningSystem";
import { commandFailed, commandSucceeded } from "./Command";

const laborManager = new LaborManager();

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

    for (const pool of context.state.labor.pools) {
      pool.assignedHeadcount = pendingPlan.laborAssignments[pool.roleId] ?? 0;
      pool.availableHeadcount = pool.assignedHeadcount;
    }

    laborManager.recalculate(
      context.state.labor,
      laborManager.calculateWorkloads(context.state.freightFlow),
      pendingPlan.budget,
    );

    activateAcceptedContractOffers(context.state);

    context.state.planning.currentPlan = {
      monthKey: pendingPlan.monthKey,
      budget: cloneBudgetPlan(pendingPlan.budget),
      laborAssignments: { ...pendingPlan.laborAssignments },
    };
    context.state.planning.lastConfirmedMonthKey = pendingPlan.monthKey;
    context.state.planning.isPlanningActive = false;
    context.state.planning.activePlanId = null;
    context.state.planning.pendingPlan = null;

    const event = {
      ...context.createEvent("monthly-plan-confirmed"),
      monthKey: context.state.planning.currentPlan.monthKey,
      budget: cloneBudgetPlan(context.state.planning.currentPlan.budget),
      laborAssignments: { ...context.state.planning.currentPlan.laborAssignments },
    };

    return commandSucceeded([event]);
  }
}
