import { LaborRole } from "../types/enums";
import type { Command, CommandContext } from "./Command";
import { commandFailed, commandSucceeded } from "./Command";

export class AssignPlannedLaborCommand implements Command<"assign-planned-labor"> {
  readonly type = "assign-planned-labor";

  constructor(
    private readonly roleId: LaborRole,
    private readonly headcount: number,
  ) {}

  execute(context: CommandContext) {
    const pendingPlan = context.state.planning.pendingPlan;

    if (!context.state.planning.isPlanningActive || !pendingPlan) {
      return commandFailed("Planned labor can only be updated during monthly planning");
    }

    if (!Object.values(LaborRole).includes(this.roleId)) {
      return commandFailed(`Unknown labor role: ${this.roleId}`);
    }

    if (!Number.isFinite(this.headcount) || !Number.isInteger(this.headcount) || this.headcount < 0) {
      return commandFailed("Headcount must be a non-negative integer");
    }

    const assignedOtherHeadcount = Object.entries(pendingPlan.laborAssignments)
      .filter(([roleId]) => roleId !== this.roleId)
      .reduce((total, [, assignedHeadcount]) => total + assignedHeadcount, 0);

    if (assignedOtherHeadcount + this.headcount > context.state.labor.totalHeadcount) {
      return commandFailed("Planned labor assignments exceed total headcount");
    }

    pendingPlan.laborAssignments[this.roleId] = this.headcount;

    const event = {
      ...context.createEvent("planned-labor-updated"),
      monthKey: pendingPlan.monthKey,
      roleId: this.roleId,
      assignedHeadcount: this.headcount,
      unassignedHeadcount: Math.max(
        0,
        context.state.labor.totalHeadcount -
          Object.values(pendingPlan.laborAssignments).reduce(
            (total, assignedHeadcount) => total + assignedHeadcount,
            0,
          ),
      ),
    };

    return commandSucceeded([event]);
  }
}
