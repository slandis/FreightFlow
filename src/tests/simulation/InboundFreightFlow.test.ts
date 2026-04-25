import { describe, expect, it } from "vitest";
import freightClasses from "../../data/config/freightClasses.json";
import { PaintZoneCommand } from "../../game/simulation/commands/PaintZoneCommand";
import { PlaceDoorCommand } from "../../game/simulation/commands/PlaceDoorCommand";
import { getDifficultyModeById } from "../../game/simulation/config/difficulty";
import { SimulationRunner } from "../../game/simulation/core/SimulationRunner";
import { getInboundCubeBandForContract } from "../../game/simulation/contracts/contractVolume";
import type { FreightFlowState } from "../../game/simulation/freight/FreightFlowState";
import { TileZoneType } from "../../game/simulation/types/enums";
import type { Trailer } from "../../game/simulation/freight/Trailer";

function runTicks(runner: SimulationRunner, ticks: number): void {
  for (let index = 0; index < ticks; index += 1) {
    runner.tick();
  }
}

function paintStageNearDoor(runner: SimulationRunner, x: number): string {
  runner.dispatch(new PaintZoneCommand(x, 1, TileZoneType.Stage));
  runner.dispatch(new PaintZoneCommand(x - 1, 1, TileZoneType.Stage));
  runner.dispatch(new PaintZoneCommand(x + 1, 1, TileZoneType.Stage));
  runner.dispatch(new PaintZoneCommand(x, 2, TileZoneType.Stage));

  return runner.getState().warehouseMap.getTile(x, 1)?.zoneId ?? "";
}

function createYardTrailer(id: string, arrivalTick: number): Trailer {
  return {
    id,
    contractId: "baseline-general-freight",
    direction: "inbound",
    state: "yard",
    doorId: null,
    freightBatchIds: [],
    arrivalTick,
    readyForDoorAssignmentTick: arrivalTick,
    doorAssignedTick: null,
    unloadStartedTick: null,
    completedTick: null,
    remainingSwitchTicks: 0,
    remainingUnloadCubicFeet: 1000,
    remainingLoadCubicFeet: 0,
    dockTileIndex: null,
  };
}

describe("inbound freight flow", () => {
  it("starts with no doors or active dock-edge door tiles", () => {
    const runner = new SimulationRunner();
    const state = runner.getState();

    expect(state.freightFlow.doors).toHaveLength(0);
    expect(state.warehouseMap.getTile(8, 0)?.isActiveDoor).toBe(false);
  });

  it("does not spawn inbound trailers before the first eligible contract timer", () => {
    const runner = new SimulationRunner();
    const firstInboundTick = runner.getState().contracts.activeContracts[0].nextInboundEligibleTick;

    runTicks(runner, firstInboundTick - 1);

    expect(runner.getState().freightFlow.trailers).toHaveLength(0);
  });

  it("spawns an inbound trailer and freight batch when the first contract timer comes due", () => {
    const runner = new SimulationRunner({ seed: 42 });
    const freightClassIds = freightClasses.map((freightClass) => freightClass.id);
    const activeContract = runner.getState().contracts.activeContracts[0];
    const firstInboundTick = activeContract.nextInboundEligibleTick;
    const inboundCubeBand = getInboundCubeBandForContract(
      activeContract,
      getDifficultyModeById(runner.getState().difficultyModeId),
    );

    runTicks(runner, firstInboundTick);

    const { trailers, freightBatches, metrics } = runner.getState().freightFlow;
    expect(trailers).toHaveLength(1);
    expect(freightBatches).toHaveLength(1);
    expect(metrics.totalInboundTrailersArrived).toBe(1);
    expect(trailers[0].direction).toBe("inbound");
    expect(trailers[0].state).toBe("yard");
    expect((trailers[0].readyForDoorAssignmentTick ?? 0) - firstInboundTick).toBeGreaterThanOrEqual(2);
    expect((trailers[0].readyForDoorAssignmentTick ?? 0) - firstInboundTick).toBeLessThanOrEqual(5);
    expect(trailers[0].freightBatchIds).toEqual([freightBatches[0].id]);
    expect(freightClassIds).toContain(freightBatches[0].freightClassId);
    expect(freightBatches[0].cubicFeet).toBeGreaterThanOrEqual(inboundCubeBand.minCubicFeet);
    expect(freightBatches[0].cubicFeet).toBeLessThanOrEqual(inboundCubeBand.maxCubicFeet);
  });

  it("spawns at most one inbound trailer when multiple contracts are due on the same tick", () => {
    const runner = new SimulationRunner({ seed: 9 });
    const state = runner.getState();

    state.contracts.activeContracts.push({
      ...state.contracts.activeContracts[0],
      id: "second-inbound-contract",
      clientName: "Second Inbound Contract",
      nextInboundEligibleTick: 1,
      nextOutboundEligibleTick: 999,
    });
    state.contracts.activeContracts[0].nextInboundEligibleTick = 1;

    runner.tick();

    expect(state.freightFlow.trailers).toHaveLength(1);
  });

  it("assigns the oldest yard trailers to available doors only", () => {
    const runner = new SimulationRunner();
    const freightFlow = runner.getState().freightFlow;

    runner.dispatch(new PlaceDoorCommand(4, 0, "inbound"));
    runner.dispatch(new PlaceDoorCommand(8, 0, "inbound"));
    runner.dispatch(new PlaceDoorCommand(12, 0, "inbound"));
    paintStageNearDoor(runner, 4);
    paintStageNearDoor(runner, 8);
    paintStageNearDoor(runner, 12);

    freightFlow.trailers = [
      { ...createYardTrailer("trailer-newer", 20), readyForDoorAssignmentTick: 0 },
      { ...createYardTrailer("trailer-older", 10), readyForDoorAssignmentTick: 0 },
      { ...createYardTrailer("trailer-extra", 30), readyForDoorAssignmentTick: 0 },
    ];
    freightFlow.doors[1].state = "reserved";
    freightFlow.doors[1].trailerId = "existing";

    runner.tick();

    expect(freightFlow.doors[0].trailerId).toBe("trailer-older");
    expect(freightFlow.doors[1].trailerId).toBe("existing");
    expect(freightFlow.doors[2].trailerId).toBe("trailer-newer");
  });

  it("leaves trailers in the yard when all doors are unavailable", () => {
    const runner = new SimulationRunner();
    const freightFlow = runner.getState().freightFlow;

    runner.dispatch(new PlaceDoorCommand(4, 0, "inbound"));
    paintStageNearDoor(runner, 4);
    freightFlow.trailers = [createYardTrailer("trailer-waiting", 0)];
    for (const door of freightFlow.doors) {
      door.state = "reserved";
      door.trailerId = "busy";
    }

    runner.tick();

    expect(freightFlow.trailers[0].state).toBe("yard");
    expect(freightFlow.queues.yardTrailers).toBe(1);
  });

  it("uses another door when one dock area is out of capacity", () => {
    const runner = new SimulationRunner();
    const freightFlow = runner.getState().freightFlow;
    runner.dispatch(new PlaceDoorCommand(8, 0, "inbound"));
    runner.dispatch(new PlaceDoorCommand(12, 0, "inbound"));
    const firstStageZoneId = paintStageNearDoor(runner, 8);
    paintStageNearDoor(runner, 12);

    freightFlow.freightBatches.push({
        id: "stage-batch-1",
        trailerId: "occupied-1",
        contractId: "baseline-general-freight",
        freightClassId: "standard",
        cubicFeet: 5000,
        state: "in-stage",
        createdTick: 0,
        unloadedTick: 0,
        storageZoneId: null,
        stageZoneId: firstStageZoneId,
        outboundOrderId: null,
        storedTick: null,
        remainingStorageCubicFeet: 5000,
        pickedTick: null,
        loadedTick: null,
        dockTileIndex: null,
      });

    freightFlow.trailers = [createYardTrailer("trailer-waiting", 0)];

    runner.tick();

    expect(freightFlow.trailers[0].doorId).toBe(freightFlow.doors[1].id);
    expect(freightFlow.doors[0].trailerId).toBeNull();
    expect(freightFlow.doors[1].trailerId).toBe("trailer-waiting");
  });

  it("keeps inbound trailers in the yard and raises a critical alert when dock capacity is full", () => {
    const runner = new SimulationRunner();
    const freightFlow = runner.getState().freightFlow;
    const eventTypes: string[] = [];

    runner.dispatch(new PlaceDoorCommand(8, 0, "inbound"));
    runner.dispatch(new PlaceDoorCommand(14, 0, "inbound"));
    const firstStageZoneId = paintStageNearDoor(runner, 8);
    const secondStageZoneId = paintStageNearDoor(runner, 14);

    runner.getEventBus().subscribe("alert-raised", (event) => {
      eventTypes.push(event.type);
    });

    for (const [index, stageZoneId] of [firstStageZoneId, secondStageZoneId].entries()) {
      freightFlow.freightBatches.push({
          id: `full-stage-${index}`,
          trailerId: `occupied-${index}`,
          contractId: "baseline-general-freight",
          freightClassId: "standard",
          cubicFeet: 5000,
          state: "in-stage",
          createdTick: 0,
          unloadedTick: 0,
          storageZoneId: null,
          stageZoneId,
          outboundOrderId: null,
          storedTick: null,
          remainingStorageCubicFeet: 5000,
          pickedTick: null,
          loadedTick: null,
          dockTileIndex: null,
        });
    }

    freightFlow.trailers = [createYardTrailer("trailer-blocked", 0)];

    runner.tick();

    expect(freightFlow.trailers[0].state).toBe("yard");
    expect(
      runner
        .getState()
        .alerts.alerts.some(
          (alert) => alert.key === "dock-capacity-blocked" && alert.severity === "critical",
        ),
    ).toBe(true);
    expect(eventTypes).toContain("alert-raised");
  });

  it("switch movement takes eight ticks after door assignment", () => {
    const runner = new SimulationRunner();

    runner.dispatch(new PlaceDoorCommand(4, 0, "inbound"));
    paintStageNearDoor(runner, 4);

    runTicks(runner, runner.getState().contracts.activeContracts[0].nextInboundEligibleTick);
    const trailer = runner.getState().freightFlow.trailers[0];

    expect(trailer.state).toBe("yard");
    expect(trailer.readyForDoorAssignmentTick).not.toBeNull();

    const delayUntilDoorAssignment =
      (trailer.readyForDoorAssignmentTick ?? runner.getState().currentTick) -
      runner.getState().currentTick;

    runTicks(runner, delayUntilDoorAssignment);
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

    runner.dispatch(new PlaceDoorCommand(4, 0, "inbound"));
    paintStageNearDoor(runner, 4);

    runTicks(runner, runner.getState().contracts.activeContracts[0].nextInboundEligibleTick);
    const freightFlow = runner.getState().freightFlow;
    const trailer = freightFlow.trailers[0];
    const batch = freightFlow.freightBatches[0];
    runUntil(() => trailer.state === "unloading", runner);
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
    expect(batch.state).toBe("in-stage");
    expect(batch.unloadedTick).not.toBeNull();
    expect(freightFlow.doors[0].state).toBe("idle");
    expect(freightFlow.doors[0].trailerId).toBeNull();
  });

  it("recalculates queues, dwell, and inbound KPIs as freight completes", () => {
    const runner = new SimulationRunner();
    runner.dispatch(new PlaceDoorCommand(4, 0, "inbound"));
    paintStageNearDoor(runner, 4);

    runTicks(runner, runner.getState().contracts.activeContracts[0].nextInboundEligibleTick);
    expect(runner.getState().freightFlow.queues.yardTrailers).toBe(1);
    runUntil(() => runner.getState().freightFlow.queues.switchingTrailers === 1, runner);
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
    const firstInboundTick = first.getState().contracts.activeContracts[0].nextInboundEligibleTick;
    const secondInboundTick =
      second.getState().contracts.activeContracts[0].nextInboundEligibleTick;

    runTicks(first, firstInboundTick);
    runTicks(second, secondInboundTick);

    expect(snapshotFirstTrailer(first.getState().freightFlow)).toEqual(
      snapshotFirstTrailer(second.getState().freightFlow),
    );
  });

  it("emits trailer and unload events through the shared event bus", () => {
    const runner = new SimulationRunner();
    const eventTypes: string[] = [];

    runner.dispatch(new PlaceDoorCommand(4, 0, "inbound"));
    paintStageNearDoor(runner, 4);

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

    runTicks(runner, runner.getState().contracts.activeContracts[0].nextInboundEligibleTick);
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

function runUntil(
  predicate: () => boolean,
  runner: SimulationRunner,
  maxTicks: number = 200,
): void {
  let safetyCounter = 0;

  while (!predicate() && safetyCounter < maxTicks) {
    runner.tick();
    safetyCounter += 1;
  }

  if (!predicate()) {
    throw new Error("Expected inbound freight state within allotted ticks");
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
    readyForDoorAssignmentTick: trailer.readyForDoorAssignmentTick,
  };
}
