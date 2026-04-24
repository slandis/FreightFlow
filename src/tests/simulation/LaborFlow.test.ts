import { describe, expect, it } from "vitest";
import { AssignLaborCommand } from "../../game/simulation/commands/AssignLaborCommand";
import { PaintZoneCommand } from "../../game/simulation/commands/PaintZoneCommand";
import { PlaceDoorCommand } from "../../game/simulation/commands/PlaceDoorCommand";
import { SimulationRunner } from "../../game/simulation/core/SimulationRunner";
import type { FreightBatch } from "../../game/simulation/freight/FreightBatch";
import type { OutboundOrder } from "../../game/simulation/freight/OutboundOrder";
import type { Trailer } from "../../game/simulation/freight/Trailer";
import {
  selectBottleneckSummary,
  selectLaborRoleDetails,
  selectLaborSummary,
} from "../../game/simulation/selectors/laborSelectors";
import { LaborRole, TileZoneType } from "../../game/simulation/types/enums";

function runTicks(runner: SimulationRunner, ticks: number): void {
  for (let index = 0; index < ticks; index += 1) {
    runner.tick();
  }
}

function createYardTrailer(overrides: Partial<Trailer> = {}): Trailer {
  return {
    id: "trailer-test",
    contractId: "baseline-general-freight",
    direction: "inbound",
    state: "yard",
    doorId: null,
    freightBatchIds: [],
    arrivalTick: 0,
    readyForDoorAssignmentTick: 0,
    doorAssignedTick: null,
    unloadStartedTick: null,
    completedTick: null,
    remainingSwitchTicks: 0,
    remainingUnloadCubicFeet: 900,
    remainingLoadCubicFeet: 0,
    dockTileIndex: null,
    ...overrides,
  };
}

function createBatch(overrides: Partial<FreightBatch> = {}): FreightBatch {
  return {
    id: "freight-batch-test",
    trailerId: "trailer-test",
    contractId: "baseline-general-freight",
    freightClassId: "standard",
    cubicFeet: 900,
    state: "on-dock",
    createdTick: 0,
    unloadedTick: 0,
    storageZoneId: null,
    outboundOrderId: null,
    storedTick: null,
    remainingStorageCubicFeet: null,
    pickedTick: null,
    loadedTick: null,
    dockTileIndex: null,
    ...overrides,
  };
}

function createOrder(overrides: Partial<OutboundOrder> = {}): OutboundOrder {
  return {
    id: "outbound-order-test",
    contractId: "baseline-general-freight",
    freightClassId: "standard",
    requestedCubicFeet: 500,
    fulfilledCubicFeet: 0,
    state: "open",
    createdTick: 0,
    dueTick: 720,
    freightBatchIds: [],
    outboundTrailerId: null,
    blockedReason: null,
    remainingPickCubicFeet: 500,
    remainingLoadCubicFeet: 500,
    revenueRecognizedTick: null,
    recognizedRevenue: 0,
    recognizedPenalty: 0,
    ...overrides,
  };
}

function paintStandardStorage(runner: SimulationRunner): void {
  runner.dispatch(new PaintZoneCommand(5, 5, TileZoneType.Travel));
  runner.dispatch(new PaintZoneCommand(6, 5, TileZoneType.StandardStorage));
  runner.dispatch(new PaintZoneCommand(7, 5, TileZoneType.StandardStorage));
}

function paintStandardStorageAtDistance(
  runner: SimulationRunner,
  travelX: number,
  travelY: number,
  storageX: number,
  storageY: number,
): void {
  runner.dispatch(new PaintZoneCommand(travelX, travelY, TileZoneType.Travel));
  runner.dispatch(new PaintZoneCommand(storageX, storageY, TileZoneType.StandardStorage));
  runner.dispatch(new PaintZoneCommand(storageX + 1, storageY, TileZoneType.StandardStorage));
}

describe("labor pools and queue processing", () => {
  it("initializes all configured labor roles with default headcount", () => {
    const runner = new SimulationRunner();
    const summary = selectLaborSummary(runner.getState());
    const roles = selectLaborRoleDetails(runner.getState());

    expect(summary.totalHeadcount).toBe(12);
    expect(summary.unassignedHeadcount).toBe(0);
    expect(roles).toHaveLength(8);
    expect(
      roles.reduce((total, role) => total + role.assignedHeadcount, 0),
    ).toBe(12);
  });

  it("assigns labor in real time and fails loudly above total headcount", () => {
    const runner = new SimulationRunner();
    const assignedEvents: string[] = [];

    runner.getEventBus().subscribeAll((event) => {
      if (event.type === "labor-assigned") {
        assignedEvents.push(event.type);
      }
    });

    const success = runner.dispatch(new AssignLaborCommand(LaborRole.Load, 1));
    const failure = runner.dispatch(new AssignLaborCommand(LaborRole.Load, 5));

    expect(success.success).toBe(true);
    expect(failure.success).toBe(false);
    expect(failure.errors).toEqual(["Assignment exceeds total headcount"]);
    expect(selectLaborSummary(runner.getState()).unassignedHeadcount).toBe(1);
    expect(runner.getState().debug.lastCommandType).toBe("assign-labor");
    expect(runner.getState().debug.lastEventType).toBe("labor-assigned");
    expect(assignedEvents).toEqual(["labor-assigned"]);
  });

  it("rejects invalid labor assignments", () => {
    const runner = new SimulationRunner();

    expect(runner.dispatch(new AssignLaborCommand("unknown" as LaborRole, 1)).success).toBe(false);
    expect(runner.dispatch(new AssignLaborCommand(LaborRole.Load, -1)).success).toBe(false);
    expect(runner.dispatch(new AssignLaborCommand(LaborRole.Load, 1.5)).success).toBe(false);
  });

  it("stops yard trailer movement when switch drivers are unassigned", () => {
    const runner = new SimulationRunner();
    const state = runner.getState();

    runner.dispatch(new PlaceDoorCommand(4, 0, "inbound"));
    runner.dispatch(new AssignLaborCommand(LaborRole.SwitchDriver, 0));
    state.freightFlow.trailers.push(createYardTrailer());

    runner.tick();

    expect(state.freightFlow.trailers[0].state).toBe("yard");
    expect(selectBottleneckSummary(state)?.roleId).toBe(LaborRole.SwitchDriver);
    expect(selectBottleneckSummary(state)?.pressure).toBe("critical");
  });

  it("scales unload progress with unload headcount", () => {
    const oneWorker = new SimulationRunner();
    const twoWorkers = new SimulationRunner();

    oneWorker.dispatch(new AssignLaborCommand(LaborRole.Unload, 1));
    twoWorkers.dispatch(new AssignLaborCommand(LaborRole.Unload, 2));
    oneWorker.getState().freightFlow.trailers.push(
      createYardTrailer({ state: "unloading", unloadStartedTick: 0 }),
    );
    twoWorkers.getState().freightFlow.trailers.push(
      createYardTrailer({ state: "unloading", unloadStartedTick: 0 }),
    );

    oneWorker.tick();
    twoWorkers.tick();

    const oneWorkerRate =
      oneWorker
        .getState()
        .labor.pools.find((pool) => pool.roleId === LaborRole.Unload)?.effectiveRate ?? 0;
    const twoWorkerRate =
      twoWorkers
        .getState()
        .labor.pools.find((pool) => pool.roleId === LaborRole.Unload)?.effectiveRate ?? 0;

    expect(oneWorker.getState().freightFlow.trailers[0].remainingUnloadCubicFeet).toBe(
      900 - oneWorkerRate,
    );
    expect(twoWorkers.getState().freightFlow.trailers[0].remainingUnloadCubicFeet).toBe(
      900 - twoWorkerRate,
    );
  });

  it("stops dock putaway when storage labor is unassigned", () => {
    const runner = new SimulationRunner();
    const state = runner.getState();

    paintStandardStorage(runner);
    runner.dispatch(new AssignLaborCommand(LaborRole.Storage, 0));
    state.freightFlow.freightBatches.push(createBatch());

    runner.tick();

    expect(state.freightFlow.freightBatches[0].state).toBe("on-dock");
    expect(selectBottleneckSummary(state)?.roleId).toBe(LaborRole.Storage);
  });

  it("uses storage labor to move dock freight into valid compatible storage", () => {
    const runner = new SimulationRunner();
    const state = runner.getState();

    paintStandardStorage(runner);
    state.freightFlow.freightBatches.push(createBatch());

    runTicks(runner, 5);

    expect(state.freightFlow.freightBatches[0].state).toBe("in-storage");
    expect(state.freightFlow.inventoryByFreightClass.standard).toBe(900);
  });

  it("stores freight faster into closer storage than farther valid storage", () => {
    const nearRunner = new SimulationRunner();
    const farRunner = new SimulationRunner();

    paintStandardStorageAtDistance(nearRunner, 5, 5, 6, 5);
    paintStandardStorageAtDistance(farRunner, 5, 5, 7, 5);

    nearRunner.getState().freightFlow.freightBatches.push(createBatch());
    farRunner.getState().freightFlow.freightBatches.push(createBatch());

    runTicks(nearRunner, 2);
    runTicks(farRunner, 2);

    const nearBatch = nearRunner.getState().freightFlow.freightBatches[0];
    const farBatch = farRunner.getState().freightFlow.freightBatches[0];

    expect(nearBatch.state).toBe("storing");
    expect(farBatch.state).toBe("storing");
    expect((nearBatch.remainingStorageCubicFeet ?? Number.MAX_SAFE_INTEGER)).toBeLessThan(
      farBatch.remainingStorageCubicFeet ?? Number.MAX_SAFE_INTEGER,
    );
  });

  it("stops picking and loading when matching labor is unassigned", () => {
    const pickRunner = new SimulationRunner();
    pickRunner.dispatch(new AssignLaborCommand(LaborRole.Pick, 0));
    pickRunner.getState().freightFlow.freightBatches.push(
      createBatch({ state: "in-storage", storageZoneId: "standard-storage-001", storedTick: 1 }),
    );
    pickRunner.getState().freightFlow.outboundOrders.push(createOrder());

    pickRunner.tick();

    expect(pickRunner.getState().freightFlow.outboundOrders[0].state).toBe("open");

    const loadRunner = new SimulationRunner();
    loadRunner.dispatch(new PlaceDoorCommand(4, 0, "outbound"));
    loadRunner.dispatch(new AssignLaborCommand(LaborRole.Load, 0));
    loadRunner.getState().freightFlow.freightBatches.push(
      createBatch({
        state: "picked",
        storageZoneId: null,
        outboundOrderId: "outbound-order-test",
        pickedTick: 1,
      }),
    );
    loadRunner.getState().freightFlow.outboundOrders.push(
      createOrder({
        state: "picked",
        fulfilledCubicFeet: 900,
        freightBatchIds: ["freight-batch-test"],
        remainingLoadCubicFeet: 900,
      }),
    );

    loadRunner.tick();

    expect(loadRunner.getState().freightFlow.outboundOrders[0].state).toBe("picked");
  });

  it("picks freight faster from closer storage than farther storage", () => {
    const nearRunner = new SimulationRunner();
    const farRunner = new SimulationRunner();

    paintStandardStorageAtDistance(nearRunner, 5, 5, 6, 5);
    paintStandardStorageAtDistance(farRunner, 5, 5, 7, 5);

    const nearZoneId =
      nearRunner
        .getState()
        .warehouseMap.zones.find((zone) => zone.zoneType === TileZoneType.StandardStorage)?.id ?? null;
    const farZoneId =
      farRunner
        .getState()
        .warehouseMap.zones.find((zone) => zone.zoneType === TileZoneType.StandardStorage)?.id ?? null;

    nearRunner.getState().freightFlow.freightBatches.push(
      createBatch({ state: "in-storage", storageZoneId: nearZoneId, storedTick: 1 }),
    );
    farRunner.getState().freightFlow.freightBatches.push(
      createBatch({ state: "in-storage", storageZoneId: farZoneId, storedTick: 1 }),
    );
    nearRunner.getState().freightFlow.outboundOrders.push(
      createOrder({ requestedCubicFeet: 900, remainingPickCubicFeet: 900 }),
    );
    farRunner.getState().freightFlow.outboundOrders.push(
      createOrder({ requestedCubicFeet: 900, remainingPickCubicFeet: 900 }),
    );

    runTicks(nearRunner, 2);
    runTicks(farRunner, 2);

    const nearOrder = nearRunner.getState().freightFlow.outboundOrders[0];
    const farOrder = farRunner.getState().freightFlow.outboundOrders[0];

    expect(nearOrder.state).toBe("picking");
    expect(farOrder.state).toBe("picking");
    expect(nearOrder.remainingPickCubicFeet).toBeLessThan(farOrder.remainingPickCubicFeet);
  });

  it("reports support-role penalties for sanitation and management understaffing", () => {
    const runner = new SimulationRunner();

    runner.dispatch(new AssignLaborCommand(LaborRole.Sanitation, 0));
    runner.dispatch(new AssignLaborCommand(LaborRole.Management, 1));

    const sanitation = runner
      .getState()
      .labor.pools.find((pool) => pool.roleId === LaborRole.Sanitation);
    const management = runner
      .getState()
      .labor.pools.find((pool) => pool.roleId === LaborRole.Management);

    expect(sanitation?.pressure).toBe("critical");
    expect(management?.pressure).toBe("strained");
    expect(runner.getState().labor.modifiers.conditionPressure).toBeGreaterThan(0);
    expect(runner.getState().labor.pressure.bottlenecks.map((bottleneck) => bottleneck.roleId))
      .toContain(LaborRole.Sanitation);
  });
});
