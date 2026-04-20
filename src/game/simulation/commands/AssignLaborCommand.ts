import { LaborManager } from "../labor/LaborManager";
import { LaborRole } from "../types/enums";
import type { Command, CommandContext } from "./Command";
import { commandFailed, commandSucceeded } from "./Command";

const laborManager = new LaborManager();

export class AssignLaborCommand implements Command<"assign-labor"> {
  readonly type = "assign-labor";

  constructor(
    private readonly roleId: LaborRole,
    private readonly headcount: number,
  ) {}

  execute(context: CommandContext) {
    const result = laborManager.assignLabor(context.state.labor, this.roleId, this.headcount);

    if (!result.success) {
      return commandFailed(result.error);
    }

    const event = {
      ...context.createEvent("labor-assigned"),
      roleId: this.roleId,
      assignedHeadcount: this.headcount,
      unassignedHeadcount: context.state.labor.unassignedHeadcount,
    };

    return commandSucceeded([event]);
  }
}
