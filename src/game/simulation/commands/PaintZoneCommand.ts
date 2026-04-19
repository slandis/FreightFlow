import type { Command } from "./Command";
import { commandSucceeded } from "./Command";

export class PaintZoneCommand implements Command<"paint-zone"> {
  readonly type = "paint-zone";

  execute() {
    // Apply zone painting to a tile range.
    return commandSucceeded();
  }
}
