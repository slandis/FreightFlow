import type { Command, CommandContext } from "./Command";
import { commandFailed, commandSucceeded } from "./Command";
import { openMonthlyPlanning } from "../systems/PlanningSystem";

export class OpenMonthlyPlanningCommand implements Command<"open-monthly-planning"> {
  readonly type = "open-monthly-planning";

  execute(context: CommandContext) {
    if (context.state.planning.isPlanningActive) {
      return commandFailed("Monthly planning is already open");
    }

    const events = openMonthlyPlanning(context.state, context.random, context.createEvent);

    return commandSucceeded(events);
  }
}
