import { describe, expect, it } from "vitest";
import { AssignLaborCommand } from "../../game/simulation/commands/AssignLaborCommand";
import { SimulationRunner } from "../../game/simulation/core/SimulationRunner";
import type { FreightBatch } from "../../game/simulation/freight/FreightBatch";
import type { OutboundOrder } from "../../game/simulation/freight/OutboundOrder";
import type { Trailer } from "../../game/simulation/freight/Trailer";
import {
  selectActiveAlerts,
  selectEconomySummary,
  selectScoreSummary,
} from "../../game/simulation/selectors/kpiSelectors";
import { ContractSystem } from "../../game/simulation/systems/ContractSystem";
import {
  LABOR_COST_PER_WORKER_PER_TICK,
} from "../../game/simulation/labor/laborCost";
import { LaborRole } from "../../game/simulation/types/enums";

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
    state: "complete",
    createdTick: 0,
    unloadedTick: 0,
    storageZoneId: null,
    outboundOrderId: "outbound-order-test",
    storedTick: 1,
    remainingStorageCubicFeet: null,
    pickedTick: 2,
    loadedTick: 3,
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
    fulfilledCubicFeet: 900,
    state: "complete",
    createdTick: 0,
    dueTick: 720,
    freightBatchIds: ["freight-batch-test"],
    outboundTrailerId: "trailer-test",
    blockedReason: null,
    remainingPickCubicFeet: 0,
    remainingLoadCubicFeet: 0,
    revenueRecognizedTick: null,
    recognizedRevenue: 0,
    recognizedPenalty: 0,
    ...overrides,
  };
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

describe("core scores and economy", () => {
  it("recognizes shipment revenue once from freight class value", () => {
    const runner = new SimulationRunner({ startingCash: 100000 });
    const state = runner.getState();

    state.freightFlow.freightBatches.push(createBatch());
    state.freightFlow.outboundOrders.push(createOrder());

    runner.tick();

    expect(state.freightFlow.outboundOrders[0].revenueRecognizedTick).toBe(1);
    expect(state.freightFlow.outboundOrders[0].recognizedRevenue).toBeCloseTo(252, 6);
    expect(state.economy.currentMonthRevenue).toBeCloseTo(252, 6);
    expect(state.cash).toBeGreaterThan(100000);

    runner.tick();

    expect(state.economy.currentMonthRevenue).toBeCloseTo(252, 6);
  });

  it("accrues labor and operating costs over time", () => {
    const runner = new SimulationRunner({ startingCash: 100000 });

    runner.tick();

    const economy = selectEconomySummary(runner.getState());
    expect(economy.currentMonthLaborCost).toBeCloseTo(12 * LABOR_COST_PER_WORKER_PER_TICK, 6);
    expect(economy.currentMonthOperatingCost).toBeGreaterThan(0);
    expect(runner.getState().cash).toBeLessThan(100000);
  });

  it("bases payroll on total employed headcount, not only assigned roles", () => {
    const runner = new SimulationRunner({ startingCash: 100000 });

    runner.getState().labor.totalHeadcount = 20;
    runner.getState().labor.unassignedHeadcount = 2;

    runner.tick();

    expect(runner.getState().economy.currentMonthLaborCost).toBeCloseTo(
      20 * LABOR_COST_PER_WORKER_PER_TICK,
      6,
    );
  });

  it("keeps baseline fixed costs in scale with baseline monthly contract revenue", () => {
    const runner = new SimulationRunner();
    const baselineContract = runner.getState().contracts.activeContracts[0];
    const monthlyRevenueCapacity =
      (baselineContract?.expectedMonthlyThroughputCubicFeet ?? 0) *
      (baselineContract?.revenuePerCubicFoot ?? 0);
    const monthlyLaborCost =
      runner.getState().labor.totalHeadcount * LABOR_COST_PER_WORKER_PER_TICK * 1440 * 30;

    runner.tick();

    const monthlyOperatingFloor =
      runner.getState().economy.operatingCostPerTick * 1440 * 30;

    expect(monthlyLaborCost + monthlyOperatingFloor).toBeLessThan(monthlyRevenueCapacity * 1.1);
  });

  it("updates KPI fields from economy and score state", () => {
    const runner = new SimulationRunner();

    runner.tick();

    const state = runner.getState();
    expect(state.kpis.laborCost).toBe(state.economy.currentMonthLaborCost);
    expect(state.kpis.netOperatingResult).toBe(state.economy.currentMonthNet);
    expect(state.kpis.moraleScore).toBe(state.scores.morale.value);
    expect(state.kpis.conditionScore).toBe(state.scores.condition.value);
  });

  it("condition declines under sanitation pressure", () => {
    const runner = new SimulationRunner();
    const startingCondition = runner.getState().scores.condition.value;

    runner.dispatch(new AssignLaborCommand(LaborRole.Sanitation, 0));
    runTicks(runner, 5);

    expect(runner.getState().scores.condition.value).toBeLessThan(startingCondition);
    expect(runner.getState().scores.condition.drivers.map((driver) => driver.label)).toContain(
      "Sanitation understaffed",
    );
  });

  it("morale and safety respond to critical labor pressure", () => {
    const runner = new SimulationRunner();
    const state = runner.getState();
    const startingScores = selectScoreSummary(state);
    const startingMorale = startingScores.morale.value;
    const startingSafety = startingScores.safety.value;

    runner.dispatch(new AssignLaborCommand(LaborRole.SwitchDriver, 0));
    state.freightFlow.trailers.push(createYardTrailer());
    runTicks(runner, 3);

    expect(state.scores.morale.value).toBeLessThan(startingMorale);
    expect(state.scores.safety.value).toBeLessThan(startingSafety);
  });

  it("customer satisfaction responds to blocked outbound orders", () => {
    const runner = new SimulationRunner();
    const state = runner.getState();
    const startingCustomerSatisfaction = state.scores.customerSatisfaction.value;

    state.freightFlow.outboundOrders.push(
      createOrder({
        state: "blocked",
        blockedReason: "Inventory unavailable",
        freightBatchIds: [],
        fulfilledCubicFeet: 0,
      }),
    );
    runTicks(runner, 5);

    expect(state.scores.customerSatisfaction.value).toBeLessThan(startingCustomerSatisfaction);
  });

  it("calculates baseline contract service level from throughput target", () => {
    const runner = new SimulationRunner();
    const contractSystem = new ContractSystem();
    const state = runner.getState();

    state.currentTick = 1440;
    contractSystem.update(state);

    expect(state.contracts.serviceLevel).toBe(0);
    expect(state.contracts.missedDemandCubicFeet).toBeGreaterThan(8900);
    expect(state.contracts.activeContracts[0].health).toBe("critical");
  });

  it("raises active alerts without duplicating the same alert every tick", () => {
    const runner = new SimulationRunner({ startingCash: 1000 });
    const alertEvents: string[] = [];

    runner.getEventBus().subscribe("alert-raised", (event) => {
      alertEvents.push(event.type);
    });

    runner.tick();
    runner.tick();

    const alerts = selectActiveAlerts(runner.getState());
    expect(alerts.map((alert) => alert.key)).toContain("cash-low");
    expect(
      runner
        .getState()
        .alerts.alerts.filter((alert) => alert.key === "cash-low" && alert.active),
    ).toHaveLength(1);
    expect(alertEvents.filter((eventType) => eventType === "alert-raised").length).toBeGreaterThanOrEqual(1);
  });
});
