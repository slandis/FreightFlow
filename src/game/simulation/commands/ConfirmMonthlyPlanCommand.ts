import type { Command } from "./Command";
import { commandSucceeded } from "./Command";

export class ConfirmMonthlyPlanCommand implements Command<"confirm-monthly-plan"> {
  readonly type = "confirm-monthly-plan";

  execute() {
    // Commit monthly planning changes to authoritative state.
    return commandSucceeded();
  }
}
