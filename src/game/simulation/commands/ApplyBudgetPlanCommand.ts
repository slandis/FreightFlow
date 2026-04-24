import type { Command, CommandContext } from "./Command";
import type { BudgetPlan } from "../core/GameState";
import {
  cloneBudgetPlan,
  getBudgetCostPerTick,
  getHeadcountOperatingCostPerTick,
  validateBudgetPlan,
} from "../planning/BudgetPlan";
import { createPlanningSnapshot } from "../systems/PlanningSystem";
import { commandFailed, commandSucceeded } from "./Command";

export class ApplyBudgetPlanCommand implements Command<"apply-budget-plan"> {
  readonly type = "apply-budget-plan";

  constructor(private readonly budget: BudgetPlan) {}

  execute(context: CommandContext) {
    if (!context.state.planning.isPlanningActive || !context.state.planning.pendingPlan) {
      return commandFailed("Budget plans can only be updated during monthly planning");
    }

    const budgetError = validateBudgetPlan(this.budget);

    if (budgetError) {
      return commandFailed(budgetError);
    }

    context.state.planning.pendingPlan.budget = cloneBudgetPlan(this.budget);
    context.state.planning.latestSnapshot = createPlanningSnapshot(
      context.state,
      context.state.planning.pendingPlan.monthKey,
      context.state.planning.pendingPlan,
    );

    const event = {
      ...context.createEvent("budget-plan-updated"),
      monthKey: context.state.planning.pendingPlan.monthKey,
      budget: cloneBudgetPlan(this.budget),
      projectedBudgetCostPerTick:
        getBudgetCostPerTick(this.budget) +
        getHeadcountOperatingCostPerTick(context.state.planning.pendingPlan.totalHeadcount),
    };

    return commandSucceeded([event]);
  }
}
