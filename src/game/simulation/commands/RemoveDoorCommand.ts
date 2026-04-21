import type { Command, CommandContext } from "./Command";
import { commandFailed, commandSucceeded } from "./Command";
import { wouldDoorRemovalOrphanDockCapacity } from "../dock/dockCapacity";

export class RemoveDoorCommand implements Command<"remove-door"> {
  readonly type = "remove-door";

  constructor(
    private readonly x: number,
    private readonly y: number,
  ) {}

  execute(context: CommandContext) {
    if (context.state.planning.isPlanningActive) {
      return commandFailed("Door editing is locked during monthly planning");
    }

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

    if (
      wouldDoorRemovalOrphanDockCapacity(
        context.state.warehouseMap,
        context.state.freightFlow,
        door,
      )
    ) {
      return commandFailed("Cannot remove a door that is supporting occupied dock space");
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
