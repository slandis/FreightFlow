import type { Command, CommandContext } from "./Command";
import type { PlannedTotalHeadcountUpdatedEvent } from "../events/PlannedTotalHeadcountUpdatedEvent";
import { commandFailed, commandSucceeded } from "./Command";

export class SetPlannedTotalHeadcountCommand
  implements Command<"set-planned-total-headcount">
{
  readonly type = "set-planned-total-headcount";

  constructor(private readonly totalHeadcount: number) {}

  execute(context: CommandContext) {
    const pendingPlan = context.state.planning.pendingPlan;

    if (!context.state.planning.isPlanningActive || !pendingPlan) {
      return commandFailed("Planned total headcount can only be updated during monthly planning");
    }

    if (
      !Number.isFinite(this.totalHeadcount) ||
      !Number.isInteger(this.totalHeadcount) ||
      this.totalHeadcount < 0
    ) {
      return commandFailed("Planned total headcount must be a non-negative integer");
    }

    const totalAssignedHeadcount = Object.values(pendingPlan.laborAssignments).reduce(
      (total, assignedHeadcount) => total + assignedHeadcount,
      0,
    );

    if (this.totalHeadcount < totalAssignedHeadcount) {
      return commandFailed("Planned total headcount cannot be lower than assigned labor");
    }

    pendingPlan.totalHeadcount = this.totalHeadcount;

    const event: PlannedTotalHeadcountUpdatedEvent = {
      ...context.createEvent("planned-total-headcount-updated"),
      monthKey: pendingPlan.monthKey,
      totalHeadcount: pendingPlan.totalHeadcount,
      unassignedHeadcount: Math.max(0, pendingPlan.totalHeadcount - totalAssignedHeadcount),
    };

    return commandSucceeded([event]);
  }
}
