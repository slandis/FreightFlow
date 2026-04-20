import type { Command, CommandContext } from "./Command";
import { commandFailed, commandSucceeded } from "./Command";

export class RemoveDoorCommand implements Command<"remove-door"> {
  readonly type = "remove-door";

  constructor(
    private readonly x: number,
    private readonly y: number,
  ) {}

  execute(context: CommandContext) {
    const doorIndex = context.state.freightFlow.doors.findIndex(
      (door) => door.x === this.x && door.y === this.y,
    );

    if (doorIndex === -1) {
      return commandFailed("No door exists on this tile");
    }

    const door = context.state.freightFlow.doors[doorIndex];

    if (door.state !== "idle" || door.trailerId !== null) {
      return commandFailed("Cannot remove a busy door");
    }

    context.state.freightFlow.doors.splice(doorIndex, 1);

    const tile = context.state.warehouseMap.getTile(this.x, this.y);

    if (tile) {
      tile.isActiveDoor = false;
    }

    const event = {
      ...context.createEvent("door-removed"),
      doorId: door.id,
      x: this.x,
      y: this.y,
    };

    return commandSucceeded([event]);
  }
}
