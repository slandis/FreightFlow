import { describe, expect, it } from "vitest";
import { PaintZoneCommand } from "../../game/simulation/commands/PaintZoneCommand";
import { PlaceDoorCommand } from "../../game/simulation/commands/PlaceDoorCommand";
import { SimulationRunner } from "../../game/simulation/core/SimulationRunner";
import type { FreightBatch } from "../../game/simulation/freight/FreightBatch";
import type { OutboundOrder } from "../../game/simulation/freight/OutboundOrder";
import {
  selectDockStorageNeeds,
  selectStorageZoneSummaries,
} from "../../game/simulation/selectors/queueSelectors";
import { TileZoneType } from "../../game/simulation/types/enums";

function runTicks(runner: SimulationRunner, ticks: number): void {
  for (let index = 0; index < ticks; index += 1) {
    runner.tick();
  }
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

describe("storage and outbound freight flow", () => {
  it("stores compatible dock freight in valid storage and updates capacity and inventory", () => {
    const runner = new SimulationRunner();
    const state = runner.getState();

    paintStandardStorage(runner);
    state.freightFlow.freightBatches.push(createBatch());

    runTicks(runner, 5);

    const batch = state.freightFlow.freightBatches[0];
    const zone = state.warehouseMap.zones.find((candidateZone) => candidateZone.id === batch.storageZoneId);

    expect(batch.state).toBe("in-storage");
    expect(batch.storedTick).toBe(5);
    expect(zone?.usedCubicFeet).toBe(900);
    expect(state.freightFlow.inventoryByFreightClass.standard).toBe(900);
  });

  it("leaves incompatible freight on the dock", () => {
    const runner = new SimulationRunner();
    const state = runner.getState();

    runner.dispatch(new PaintZoneCommand(5, 5, TileZoneType.Travel));
    runner.dispatch(new PaintZoneCommand(6, 5, TileZoneType.BulkStorage));
    state.freightFlow.freightBatches.push(createBatch({ freightClassId: "standard" }));

    runner.tick();

    expect(state.freightFlow.freightBatches[0].state).toBe("on-dock");
    expect(state.freightFlow.queues.storageQueueCubicFeet).toBe(900);
  });

  it("reports the compatible storage needed for dock freight", () => {
    const runner = new SimulationRunner();
    const state = runner.getState();

    state.freightFlow.freightBatches.push(createBatch({ cubicFeet: 700 }));

    const needs = selectDockStorageNeeds(state);

    expect(needs).toHaveLength(1);
    expect(needs[0]).toMatchObject({
      freightClassId: "standard",
      freightClassName: "Standard Freight",
      cubicFeetOnDock: 700,
      largestBatchCubicFeet: 700,
      compatibleZoneNames: ["Standard Storage", "Fast-Turn Storage"],
      matchingZoneCount: 0,
      reason: "No compatible storage zone assigned",
      ready: false,
    });
  });

  it("reports invalid compatible storage for dock freight", () => {
    const runner = new SimulationRunner();
    const state = runner.getState();

    runner.dispatch(new PaintZoneCommand(6, 5, TileZoneType.StandardStorage));
    state.freightFlow.freightBatches.push(createBatch({ cubicFeet: 500 }));

    const needs = selectDockStorageNeeds(state);

    expect(needs[0]).toMatchObject({
      matchingZoneCount: 1,
      validMatchingZoneCount: 0,
      invalidMatchingZoneCount: 1,
      reason: "Compatible storage is invalid",
      ready: false,
    });
  });

  it("reports when no single compatible zone can fit a whole dock batch", () => {
    const runner = new SimulationRunner();
    const state = runner.getState();

    runner.dispatch(new PaintZoneCommand(5, 5, TileZoneType.Travel));
    runner.dispatch(new PaintZoneCommand(6, 5, TileZoneType.StandardStorage));
    runner.dispatch(new PaintZoneCommand(8, 5, TileZoneType.StandardStorage));
    state.freightFlow.freightBatches.push(createBatch({ cubicFeet: 900 }));

    const needs = selectDockStorageNeeds(state);

    expect(needs[0]).toMatchObject({
      cubicFeetOnDock: 900,
      validCompatibleCapacityCubicFeet: 1100,
      largestCompatibleAvailableCubicFeet: 550,
      missingCubicFeet: 0,
      reason: "No compatible zone can fit largest dock batch",
      ready: false,
    });
  });

  it("reports ready dock freight when compatible storage can receive it", () => {
    const runner = new SimulationRunner();
    const state = runner.getState();

    paintStandardStorage(runner);
    state.freightFlow.freightBatches.push(createBatch({ cubicFeet: 900 }));

    const needs = selectDockStorageNeeds(state);

    expect(needs[0]).toMatchObject({
      validCompatibleCapacityCubicFeet: 1100,
      largestCompatibleAvailableCubicFeet: 1100,
      missingCubicFeet: 0,
      reason: "Ready for storage",
      ready: true,
    });
  });

  it("summarizes storage zones with utilization for the operations panel", () => {
    const runner = new SimulationRunner();
    const state = runner.getState();

    paintStandardStorage(runner);
    state.freightFlow.freightBatches.push(createBatch());

    runTicks(runner, 5);

    const zones = selectStorageZoneSummaries(state);

    expect(zones).toHaveLength(1);
    expect(zones[0]).toMatchObject({
      zoneName: "Standard Storage",
      zoneType: TileZoneType.StandardStorage,
      usedCubicFeet: 900,
      capacityCubicFeet: 1100,
      tileCount: 2,
      areaCount: 1,
      invalidAreaCount: 0,
      validForStorage: true,
    });
    expect(zones[0].utilization).toBeCloseTo(900 / 1100, 6);
  });

  it("groups disconnected areas under their parent storage zone type", () => {
    const runner = new SimulationRunner();
    const state = runner.getState();

    runner.dispatch(new PaintZoneCommand(5, 5, TileZoneType.Travel));
    runner.dispatch(new PaintZoneCommand(6, 5, TileZoneType.StandardStorage));
    runner.dispatch(new PaintZoneCommand(10, 5, TileZoneType.StandardStorage));

    const zones = selectStorageZoneSummaries(state);

    expect(zones).toHaveLength(1);
    expect(zones[0]).toMatchObject({
      zoneName: "Standard Storage",
      zoneType: TileZoneType.StandardStorage,
      usedCubicFeet: 0,
      capacityCubicFeet: 1100,
      tileCount: 2,
      areaCount: 2,
      invalidAreaCount: 1,
      validForStorage: false,
      invalidReason: "1 assigned area is invalid for storage",
    });
  });

  it("leaves freight on the dock when storage is invalid or full", () => {
    const invalidRunner = new SimulationRunner();
    invalidRunner.dispatch(new PaintZoneCommand(6, 5, TileZoneType.StandardStorage));
    invalidRunner.getState().freightFlow.freightBatches.push(createBatch());

    invalidRunner.tick();

    expect(invalidRunner.getState().freightFlow.freightBatches[0].state).toBe("on-dock");

    const fullRunner = new SimulationRunner();
    fullRunner.dispatch(new PaintZoneCommand(5, 5, TileZoneType.Travel));
    fullRunner.dispatch(new PaintZoneCommand(6, 5, TileZoneType.StandardStorage));
    fullRunner.getState().freightFlow.freightBatches.push(createBatch({ cubicFeet: 600 }));

    fullRunner.tick();

    expect(fullRunner.getState().freightFlow.freightBatches[0].state).toBe("on-dock");
  });

  it("does not generate outbound orders without stored inventory", () => {
    const runner = new SimulationRunner();
    const firstOutboundTick =
      runner.getState().contracts.activeContracts[0].nextOutboundEligibleTick;

    runTicks(runner, firstOutboundTick);

    expect(runner.getState().freightFlow.outboundOrders).toHaveLength(0);
  });

  it("generates deterministic outbound orders from available stored inventory", () => {
    const first = new SimulationRunner({ seed: 11 });
    const second = new SimulationRunner({ seed: 11 });

    first.getState().freightFlow.freightBatches.push(
      createBatch({ state: "in-storage", storageZoneId: "standard-storage-001", storedTick: 1 }),
    );
    first.getState().freightFlow.freightBatches.push(
      createBatch({
        id: "freight-batch-test-2",
        trailerId: "trailer-test-2",
        cubicFeet: 600,
        state: "in-storage",
        storageZoneId: "standard-storage-001",
        storedTick: 1,
      }),
    );
    first.getState().freightFlow.freightBatches.push(
      createBatch({
        id: "freight-batch-test-3",
        trailerId: "trailer-test-3",
        cubicFeet: 500,
        state: "in-storage",
        storageZoneId: "standard-storage-001",
        storedTick: 1,
      }),
    );
    second.getState().freightFlow.freightBatches.push(
      createBatch({ state: "in-storage", storageZoneId: "standard-storage-001", storedTick: 1 }),
    );
    second.getState().freightFlow.freightBatches.push(
      createBatch({
        id: "freight-batch-test-2",
        trailerId: "trailer-test-2",
        cubicFeet: 600,
        state: "in-storage",
        storageZoneId: "standard-storage-001",
        storedTick: 1,
      }),
    );
    second.getState().freightFlow.freightBatches.push(
      createBatch({
        id: "freight-batch-test-3",
        trailerId: "trailer-test-3",
        cubicFeet: 500,
        state: "in-storage",
        storageZoneId: "standard-storage-001",
        storedTick: 1,
      }),
    );
    first.getState().contracts.activeContracts[0].nextOutboundEligibleTick = 2;
    second.getState().contracts.activeContracts[0].nextOutboundEligibleTick = 2;

    runTicks(first, 2);
    runTicks(second, 2);

    const firstOrder = first.getState().freightFlow.outboundOrders[0];
    const secondOrder = second.getState().freightFlow.outboundOrders[0];

    expect(firstOrder.requestedCubicFeet).toBeLessThanOrEqual(855);
    expect(firstOrder.requestedCubicFeet).toBeGreaterThanOrEqual(285);
    expect(firstOrder.freightClassId).toBe("standard");
    expect(firstOrder.requestedCubicFeet).toBe(secondOrder.requestedCubicFeet);
  });

  it("spawns at most one outbound order when multiple contracts are due on the same tick", () => {
    const runner = new SimulationRunner({ seed: 21 });
    const state = runner.getState();

    state.contracts.activeContracts.push({
      ...state.contracts.activeContracts[0],
      id: "secondary-outbound-contract",
      clientName: "Secondary Outbound Contract",
      freightClassId: "standard",
      nextInboundEligibleTick: 999,
      nextOutboundEligibleTick: 2,
    });
    state.contracts.activeContracts[0].nextOutboundEligibleTick = 2;
    state.freightFlow.freightBatches.push(
      createBatch({
        id: "baseline-storage-batch-1",
        state: "in-storage",
        storageZoneId: "standard-storage-001",
        storedTick: 1,
        cubicFeet: 1000,
      }),
      createBatch({
        id: "baseline-storage-batch-2",
        trailerId: "baseline-trailer-2",
        state: "in-storage",
        storageZoneId: "standard-storage-001",
        storedTick: 1,
        cubicFeet: 1000,
      }),
      createBatch({
        id: "secondary-storage-batch-1",
        trailerId: "secondary-trailer-1",
        contractId: "secondary-outbound-contract",
        state: "in-storage",
        storageZoneId: "standard-storage-001",
        storedTick: 1,
        cubicFeet: 1000,
      }),
      createBatch({
        id: "secondary-storage-batch-2",
        trailerId: "secondary-trailer-2",
        contractId: "secondary-outbound-contract",
        state: "in-storage",
        storageZoneId: "standard-storage-001",
        storedTick: 1,
        cubicFeet: 1000,
      }),
    );

    runTicks(runner, 2);

    expect(state.freightFlow.outboundOrders).toHaveLength(1);
  });

  it("retries due outbound contracts later instead of creating impossible work", () => {
    const runner = new SimulationRunner({ seed: 22 });
    const contract = runner.getState().contracts.activeContracts[0];
    const originalRetryTick = contract.nextOutboundEligibleTick;

    contract.nextOutboundEligibleTick = 2;

    runTicks(runner, 2);

    expect(runner.getState().freightFlow.outboundOrders).toHaveLength(0);
    expect(contract.nextOutboundEligibleTick).toBeGreaterThan(2);
    expect(contract.nextOutboundEligibleTick).not.toBe(originalRetryTick);
  });

  it("blocks open orders when matching inventory is unavailable", () => {
    const runner = new SimulationRunner();

    runner.getState().freightFlow.outboundOrders.push(createOrder());

    runner.tick();

    const order = runner.getState().freightFlow.outboundOrders[0];
    expect(order.state).toBe("blocked");
    expect(order.blockedReason).toBe("Inventory unavailable");
  });

  it("picks stored batches for open orders and removes them from available inventory", () => {
    const runner = new SimulationRunner();
    const state = runner.getState();

    state.freightFlow.freightBatches.push(
      createBatch({ state: "in-storage", storageZoneId: "standard-storage-001", storedTick: 1 }),
    );
    state.freightFlow.outboundOrders.push(createOrder());

    runner.tick();

    const order = state.freightFlow.outboundOrders[0];
    expect(order.state).toBe("picking");
    expect(order.fulfilledCubicFeet).toBe(900);
    expect(state.freightFlow.freightBatches[0].state).toBe("picking");
    expect(state.freightFlow.freightBatches[0].outboundOrderId).toBe(order.id);
    expect(state.freightFlow.inventoryByFreightClass.standard ?? 0).toBe(0);
  });

  it("loads picked orders into outbound trailers and completes shipments", () => {
    const runner = new SimulationRunner();
    const state = runner.getState();

    runner.dispatch(new PlaceDoorCommand(4, 0, "outbound"));

    state.freightFlow.freightBatches.push(
      createBatch({
        state: "picked",
        storageZoneId: null,
        outboundOrderId: "outbound-order-test",
        pickedTick: 1,
      }),
    );
    state.freightFlow.outboundOrders.push(
      createOrder({
        state: "picked",
        fulfilledCubicFeet: 900,
        freightBatchIds: ["freight-batch-test"],
        remainingLoadCubicFeet: 900,
      }),
    );

    runner.tick();

    const order = state.freightFlow.outboundOrders[0];
    expect(order.state).toBe("loading");
    expect(order.outboundTrailerId).not.toBeNull();

    runTicks(runner, 8);

    expect(order.state).toBe("complete");
    expect(state.freightFlow.freightBatches[0].state).toBe("complete");
    expect(state.freightFlow.metrics.totalOutboundOrdersCompleted).toBe(1);
    expect(state.freightFlow.metrics.totalOutboundCubicFeetShipped).toBe(900);
    expect(state.kpis.outboundCubicFeet).toBe(900);
    expect(state.kpis.throughputCubicFeet).toBe(450);
  });

  it("runs dock freight through storage, outbound generation, pick, load, and shipment completion", () => {
    const runner = new SimulationRunner({ seed: 3 });
    const state = runner.getState();

    runner.dispatch(new PlaceDoorCommand(4, 0, "flex"));
    paintStandardStorage(runner);
    runner.dispatch(new PaintZoneCommand(8, 4, TileZoneType.Travel));
    runner.dispatch(new PaintZoneCommand(8, 5, TileZoneType.StandardStorage));
    runner.dispatch(new PaintZoneCommand(9, 5, TileZoneType.StandardStorage));
    state.freightFlow.freightBatches.push(createBatch());
    state.freightFlow.freightBatches.push(
      createBatch({
        id: "freight-batch-test-2",
        trailerId: "trailer-test-2",
        cubicFeet: 600,
      }),
    );
    state.freightFlow.freightBatches.push(
      createBatch({
        id: "freight-batch-test-3",
        trailerId: "trailer-test-3",
        cubicFeet: 300,
      }),
    );

    runTicks(runner, 10);
    expect(state.freightFlow.freightBatches[0].state).toBe("in-storage");
    expect(state.freightFlow.freightBatches[1].state).toBe("in-storage");
    expect(state.freightFlow.freightBatches[2].state).toBe("in-storage");
    state.contracts.activeContracts[0].nextOutboundEligibleTick = state.currentTick + 2;

    runTicks(runner, 2);
    expect(state.freightFlow.outboundOrders).toHaveLength(1);

    runUntilShipmentCompletes(runner);

    expect(state.freightFlow.outboundOrders[0].state).toBe("complete");
    expect(state.kpis.outboundCubicFeet).toBeGreaterThan(0);
    expect(state.kpis.outboundCubicFeet).toBeLessThanOrEqual(1800);
  });
});

function runUntilShipmentCompletes(runner: SimulationRunner): void {
  let safetyCounter = 0;

  while (
    runner.getState().freightFlow.outboundOrders[0]?.state !== "complete" &&
    safetyCounter < 100
  ) {
    runner.tick();
    safetyCounter += 1;
  }

  if (runner.getState().freightFlow.outboundOrders[0]?.state !== "complete") {
    throw new Error("Expected outbound shipment to complete within 100 ticks");
  }
}
