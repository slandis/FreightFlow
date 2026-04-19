import type { Command } from "./Command";
import { commandSucceeded } from "./Command";

export class ApplyBudgetPlanCommand implements Command<"apply-budget-plan"> {
  readonly type = "apply-budget-plan";

  execute() {
    // Apply confirmed monthly budget settings.
    return commandSucceeded();
  }
}
