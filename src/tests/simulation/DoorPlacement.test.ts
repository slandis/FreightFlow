import { describe, expect, it } from "vitest";
import { PlaceDoorCommand } from "../../game/simulation/commands/PlaceDoorCommand";
import { RemoveDoorCommand } from "../../game/simulation/commands/RemoveDoorCommand";
import { SimulationRunner } from "../../game/simulation/core/SimulationRunner";
import type { Trailer } from "../../game/simulation/freight/Trailer";

function createYardTrailer(id: string): Trailer {
  return {
    id,
    direction: "inbound",
    state: "yard",
    doorId: null,
    freightBatchIds: [],
    arrivalTick: 0,
    doorAssignedTick: null,
    unloadStartedTick: null,
    completedTick: null,
    remainingSwitchTicks: 0,
    remainingUnloadCubicFeet: 900,
    remainingLoadCubicFeet: 0,
  };
}

describe("door placement", () => {
  it("places an idle door on a dock-edge tile and marks the tile active", () => {
    const runner = new SimulationRunner();
    const result = runner.dispatch(new PlaceDoorCommand(4, 0, "inbound"));
    const door = runner.getState().freightFlow.doors.find((candidateDoor) => candidateDoor.x === 4);

    expect(result.success).toBe(true);
    expect(door).toMatchObject({
      x: 4,
      y: 0,
      mode: "inbound",
      state: "idle",
      trailerId: null,
    });
    expect(runner.getState().warehouseMap.getTile(4, 0)?.isActiveDoor).toBe(true);
    expect(runner.getState().debug.lastCommandType).toBe("place-door");
    expect(runner.getState().debug.lastEventType).toBe("door-placed");
  });

  it("rejects interior, duplicate, and invalid-mode door placement", () => {
    const runner = new SimulationRunner();

    expect(runner.dispatch(new PlaceDoorCommand(4, 4, "flex")).success).toBe(false);
    expect(runner.dispatch(new PlaceDoorCommand(8, 0, "flex")).success).toBe(false);
    expect(runner.dispatch(new PlaceDoorCommand(4, 0, "bad" as "flex")).success).toBe(false);
  });

  it("removes idle doors and clears the active tile marker", () => {
    const runner = new SimulationRunner();

    runner.dispatch(new PlaceDoorCommand(4, 0, "outbound"));
    const result = runner.dispatch(new RemoveDoorCommand(4, 0));

    expect(result.success).toBe(true);
    expect(runner.getState().freightFlow.doors.some((door) => door.x === 4 && door.y === 0)).toBe(
      false,
    );
    expect(runner.getState().warehouseMap.getTile(4, 0)?.isActiveDoor).toBe(false);
    expect(runner.getState().debug.lastCommandType).toBe("remove-door");
    expect(runner.getState().debug.lastEventType).toBe("door-removed");
  });

  it("does not remove busy doors", () => {
    const runner = new SimulationRunner();
    const door = runner.getState().freightFlow.doors[0];

    door.state = "reserved";
    door.trailerId = "trailer-test";

    const result = runner.dispatch(new RemoveDoorCommand(door.x, door.y));

    expect(result.success).toBe(false);
    expect(result.errors).toEqual(["Cannot remove a busy door"]);
    expect(runner.getState().warehouseMap.getTile(door.x, door.y)?.isActiveDoor).toBe(true);
  });

  it("uses placed inbound doors for trailer assignment", () => {
    const runner = new SimulationRunner();
    const freightFlow = runner.getState().freightFlow;

    for (const door of freightFlow.doors) {
      door.state = "reserved";
      door.trailerId = "busy";
    }

    runner.dispatch(new PlaceDoorCommand(4, 0, "inbound"));
    freightFlow.trailers.push(createYardTrailer("trailer-waiting"));

    runner.tick();

    const placedDoor = freightFlow.doors.find((door) => door.x === 4 && door.y === 0);
    expect(placedDoor?.trailerId).toBe("trailer-waiting");
    expect(freightFlow.trailers[0].doorId).toBe(placedDoor?.id);
  });
});
