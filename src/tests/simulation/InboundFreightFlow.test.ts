import { describe, expect, it } from "vitest";
import freightClasses from "../../data/config/freightClasses.json";
import { SimulationRunner } from "../../game/simulation/core/SimulationRunner";
import type { FreightFlowState } from "../../game/simulation/freight/FreightFlowState";
import type { Trailer } from "../../game/simulation/freight/Trailer";

function runTicks(runner: SimulationRunner, ticks: number): void {
  for (let index = 0; index < ticks; index += 1) {
    runner.tick();
  }
}

function createYardTrailer(id: string, arrivalTick: number): Trailer {
  return {
    id,
    direction: "inbound",
    state: "yard",
    doorId: null,
    freightBatchIds: [],
    arrivalTick,
    doorAssignedTick: null,
    unloadStartedTick: null,
    completedTick: null,
    remainingSwitchTicks: 0,
    remainingUnloadCubicFeet: 1000,
    remainingLoadCubicFeet: 0,
  };
}

describe("inbound freight flow", () => {
  it("creates initial flex doors and marks dock-edge door tiles", () => {
    const runner = new SimulationRunner();
    const state = runner.getState();

    expect(state.freightFlow.doors).toHaveLength(8);
    expect(state.freightFlow.doors.every((door) => door.mode === "flex")).toBe(true);

    for (const door of state.freightFlow.doors) {
      expect(state.warehouseMap.getTile(door.x, door.y)?.isActiveDoor).toBe(true);
    }
  });

  it("does not spawn inbound trailers before tick 60", () => {
    const runner = new SimulationRunner();

    runTicks(runner, 59);

    expect(runner.getState().freightFlow.trailers).toHaveLength(0);
  });

  it("spawns an inbound trailer and freight batch at tick 60", () => {
    const runner = new SimulationRunner({ seed: 42 });
    const freightClassIds = freightClasses.map((freightClass) => freightClass.id);

    runTicks(runner, 60);

    const { trailers, freightBatches, metrics } = runner.getState().freightFlow;
    expect(trailers).toHaveLength(1);
    expect(freightBatches).toHaveLength(1);
    expect(metrics.totalInboundTrailersArrived).toBe(1);
    expect(trailers[0].direction).toBe("inbound");
    expect(trailers[0].freightBatchIds).toEqual([freightBatches[0].id]);
    expect(freightClassIds).toContain(freightBatches[0].freightClassId);
    expect(freightBatches[0].cubicFeet).toBeGreaterThanOrEqual(800);
    expect(freightBatches[0].cubicFeet).toBeLessThanOrEqual(2500);
  });

  it("assigns the oldest yard trailers to available doors only", () => {
    const runner = new SimulationRunner();
    const freightFlow = runner.getState().freightFlow;

    freightFlow.trailers = [
      createYardTrailer("trailer-newer", 20),
      createYardTrailer("trailer-older", 10),
      createYardTrailer("trailer-extra", 30),
    ];
    freightFlow.doors[0].state = "idle";
    freightFlow.doors[1].state = "reserved";
    freightFlow.doors[1].trailerId = "existing";
    freightFlow.doors[2].state = "idle";
    freightFlow.doors[3].state = "idle";
    freightFlow.doors[4].state = "idle";
    freightFlow.doors[5].state = "idle";
    freightFlow.doors[6].state = "idle";
    freightFlow.doors[7].state = "idle";

    runner.tick();

    expect(freightFlow.doors[0].trailerId).toBe("trailer-older");
    expect(freightFlow.doors[1].trailerId).toBe("existing");
    expect(freightFlow.doors[2].trailerId).toBe("trailer-newer");
  });

  it("leaves trailers in the yard when all doors are unavailable", () => {
    const runner = new SimulationRunner();
    const freightFlow = runner.getState().freightFlow;

    freightFlow.trailers = [createYardTrailer("trailer-waiting", 0)];
    for (const door of freightFlow.doors) {
      door.state = "reserved";
      door.trailerId = "busy";
    }

    runner.tick();

    expect(freightFlow.trailers[0].state).toBe("yard");
    expect(freightFlow.queues.yardTrailers).toBe(1);
  });

  it("switch movement takes eight ticks after door assignment", () => {
    const runner = new SimulationRunner();

    runTicks(runner, 60);
    const trailer = runner.getState().freightFlow.trailers[0];

    expect(trailer.state).toBe("switching-to-door");
    expect(trailer.remainingSwitchTicks).toBe(8);

    runTicks(runner, 7);
    expect(trailer.state).toBe("switching-to-door");
    expect(trailer.remainingSwitchTicks).toBe(1);

    runner.tick();
    expect(trailer.state).toBe("unloading");
    expect(trailer.remainingSwitchTicks).toBe(0);
  });

  it("unloading reduces remaining cubic feet and completes freight to dock", () => {
    const runner = new SimulationRunner();

    runTicks(runner, 68);
    const freightFlow = runner.getState().freightFlow;
    const trailer = freightFlow.trailers[0];
    const batch = freightFlow.freightBatches[0];
    const startingRemainingCubicFeet = trailer.remainingUnloadCubicFeet;
    const unloadRate =
      runner
        .getState()
        .labor.pools.find((pool) => pool.roleId === "unload")?.effectiveRate ?? 0;

    runner.tick();

    expect(trailer.remainingUnloadCubicFeet).toBe(
      Math.max(0, startingRemainingCubicFeet - unloadRate),
    );

    runUntilDockFreightExists(runner, freightFlow);

    expect(trailer.state).toBe("complete");
    expect(batch.state).toBe("on-dock");
    expect(batch.unloadedTick).not.toBeNull();
    expect(freightFlow.doors[0].state).toBe("idle");
    expect(freightFlow.doors[0].trailerId).toBeNull();
  });

  it("recalculates queues, dwell, and inbound KPIs as freight completes", () => {
    const runner = new SimulationRunner();

    runTicks(runner, 60);
    expect(runner.getState().freightFlow.queues.switchingTrailers).toBe(1);
    expect(runner.getState().freightFlow.queues.averageDoorDwellTicks).toBe(0);

    runner.tick();
    expect(runner.getState().freightFlow.queues.averageDoorDwellTicks).toBe(1);

    const freightFlow = runner.getState().freightFlow;
    runUntilDockFreightExists(runner, freightFlow);

    expect(freightFlow.queues.dockFreightCubicFeet).toBe(freightFlow.freightBatches[0].cubicFeet);
    expect(freightFlow.queues.unloadTrailers).toBe(0);
    expect(runner.getState().kpis.inboundCubicFeet).toBe(freightFlow.freightBatches[0].cubicFeet);
    expect(runner.getState().kpis.throughputCubicFeet).toBe(
      freightFlow.freightBatches[0].cubicFeet / 2,
    );
  });

  it("keeps inbound generation deterministic for the same seed", () => {
    const first = new SimulationRunner({ seed: 7 });
    const second = new SimulationRunner({ seed: 7 });

    runTicks(first, 60);
    runTicks(second, 60);

    expect(snapshotFirstTrailer(first.getState().freightFlow)).toEqual(
      snapshotFirstTrailer(second.getState().freightFlow),
    );
  });

  it("emits trailer and unload events through the shared event bus", () => {
    const runner = new SimulationRunner();
    const eventTypes: string[] = [];

    runner.getEventBus().subscribeAll((event) => {
      if (
        event.type === "trailer-arrived" ||
        event.type === "trailer-assigned-door" ||
        event.type === "trailer-arrived-door" ||
        event.type === "freight-unloaded"
      ) {
        eventTypes.push(event.type);
      }
    });

    runTicks(runner, 60);
    runUntilDockFreightExists(runner, runner.getState().freightFlow);

    expect(eventTypes).toContain("trailer-arrived");
    expect(eventTypes).toContain("trailer-assigned-door");
    expect(eventTypes).toContain("trailer-arrived-door");
    expect(eventTypes).toContain("freight-unloaded");
  });
});

function runUntilDockFreightExists(
  runner: SimulationRunner,
  freightFlow: FreightFlowState,
): void {
  let safetyCounter = 0;

  while (freightFlow.queues.dockFreightCubicFeet === 0 && safetyCounter < 100) {
    runner.tick();
    safetyCounter += 1;
  }

  if (freightFlow.queues.dockFreightCubicFeet === 0) {
    throw new Error("Expected freight to reach the dock within 100 ticks");
  }
}

function snapshotFirstTrailer(freightFlow: FreightFlowState) {
  const trailer = freightFlow.trailers[0];
  const batch = freightFlow.freightBatches[0];

  return {
    trailerId: trailer.id,
    batchId: batch.id,
    freightClassId: batch.freightClassId,
    cubicFeet: batch.cubicFeet,
  };
}
