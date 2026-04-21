import type { DoorNode } from "../world/DoorNode";
import {
  formatCurrencyAmount,
  getDoorPlacementCost,
  trySpendCapitalCost,
} from "../economy/buildCosts";
import type { Command, CommandContext } from "./Command";
import { commandFailed, commandSucceeded } from "./Command";

const validDoorModes = new Set<DoorNode["mode"]>(["inbound", "outbound", "flex"]);

export class PlaceDoorCommand implements Command<"place-door"> {
  readonly type = "place-door";

  constructor(
    private readonly x: number,
    private readonly y: number,
    private readonly mode: DoorNode["mode"],
  ) {}

  execute(context: CommandContext) {
    if (context.state.planning.isPlanningActive) {
      return commandFailed("Door editing is locked during monthly planning");
    }

    if (!validDoorModes.has(this.mode)) {
      return commandFailed(`Invalid door mode: ${this.mode}`);
    }

    const tile = context.state.warehouseMap.getTile(this.x, this.y);

    if (!tile) {
      return commandFailed("Door placement is out of bounds");
    }

    if (!tile.isDockEdge) {
      return commandFailed("Doors can only be placed on dock-edge tiles");
    }

    const existingDoor = context.state.freightFlow.doors.find(
      (door) => door.x === this.x && door.y === this.y,
    );

    if (existingDoor) {
      return commandFailed("A door already exists on this tile");
    }

    const cost = getDoorPlacementCost(this.mode);

    if (!trySpendCapitalCost(context.state, cost)) {
      return commandFailed(`Not enough cash to place a door (${formatCurrencyAmount(cost)})`);
    }

    const doorId = `door-${context.state.freightFlow.nextDoorSequence
      .toString()
      .padStart(3, "0")}`;

    context.state.freightFlow.nextDoorSequence += 1;
    tile.isActiveDoor = true;
    context.state.freightFlow.doors.push({
      id: doorId,
      x: this.x,
      y: this.y,
      mode: this.mode,
      trailerId: null,
      state: "idle",
    });

    const event = {
      ...context.createEvent("door-placed"),
      doorId,
      x: this.x,
      y: this.y,
      mode: this.mode,
    };

    return commandSucceeded([event]);
  }
}
