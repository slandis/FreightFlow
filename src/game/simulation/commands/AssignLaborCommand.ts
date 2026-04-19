import type { Command } from "./Command";
import { commandSucceeded } from "./Command";

export class AssignLaborCommand implements Command<"assign-labor"> {
  readonly type = "assign-labor";

  execute() {
    // Assign labor to a functional role.
    return commandSucceeded();
  }
}
