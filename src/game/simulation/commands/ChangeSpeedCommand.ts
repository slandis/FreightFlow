import { GameSpeed } from "../types/enums";
import type { Command, CommandContext } from "./Command";
import { commandFailed, commandSucceeded } from "./Command";

export class ChangeSpeedCommand implements Command<"change-speed"> {
  readonly type = "change-speed";

  constructor(private readonly speed: GameSpeed) {}

  execute(context: CommandContext) {
    if (context.state.planning.isPlanningActive) {
      return commandFailed("Simulation speed is locked during monthly planning");
    }

    if (!Object.values(GameSpeed).includes(this.speed)) {
      return commandFailed(`Invalid speed: ${this.speed}`);
    }

    context.state.speed = this.speed;

    const event = context.createEvent("speed-changed");

    return commandSucceeded([event]);
  }
}
