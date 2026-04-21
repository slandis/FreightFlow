import { describe, expect, it } from "vitest";
import { AssignLaborCommand } from "../../game/simulation/commands/AssignLaborCommand";
import { SimulationRunner } from "../../game/simulation/core/SimulationRunner";
import type { ActiveContract } from "../../game/simulation/core/GameState";
import type { FreightBatch } from "../../game/simulation/freight/FreightBatch";
import type { Trailer } from "../../game/simulation/freight/Trailer";
import {
  selectLaborAnalysisRoles,
  selectLaborAnalysisSummary,
  selectLaborAnalysisSuggestions,
  selectLaborForecastHeadcountChart,
} from "../../game/simulation/selectors/laborSelectors";
import { selectContractPortfolioCards } from "../../game/simulation/selectors/contractSelectors";
import { LABOR_COST_PER_WORKER_PER_TICK, TICKS_PER_DAY } from "../../game/simulation/labor/laborCost";
import { LaborRole } from "../../game/simulation/types/enums";
import { deserializeGameState, serializeGameState } from "../../persistence/GameStateSerializer";

const rolloverCalendar = {
  year: 1,
  month: 1,
  day: 30,
  hour: 23,
  minute: 59,
};

function createUnloadTrailer(overrides: Partial<Trailer> = {}): Trailer {
  return {
    id: "trailer-analysis",
    contractId: "baseline-general-freight",
    direction: "inbound",
    state: "unloading",
    doorId: "door-001",
    freightBatchIds: ["batch-analysis"],
    arrivalTick: 0,
    doorAssignedTick: 0,
    unloadStartedTick: 0,
    completedTick: null,
    remainingSwitchTicks: 0,
    remainingUnloadCubicFeet: 100,
    remainingLoadCubicFeet: 0,
    dockTileIndex: 0,
    ...overrides,
  };
}

function createUnloadBatch(overrides: Partial<FreightBatch> = {}): FreightBatch {
  return {
    id: "batch-analysis",
    trailerId: "trailer-analysis",
    contractId: "baseline-general-freight",
    freightClassId: "standard",
    cubicFeet: 100,
    state: "at-door",
    createdTick: 0,
    unloadedTick: null,
    storageZoneId: null,
    outboundOrderId: null,
    storedTick: null,
    remainingStorageCubicFeet: null,
    pickedTick: null,
    loadedTick: null,
    dockTileIndex: 0,
    ...overrides,
  };
}

function createAcceptedContract(
  overrides: Partial<ActiveContract> = {},
): ActiveContract {
  return {
    id: "contract-accepted-001",
    name: "High Volume Retail",
    clientName: "High Volume Retail",
    freightClassId: "standard",
    acceptedMonthKey: "Y1-M1",
    acceptedTick: 0,
    acceptedMonthIndex: 1,
    endMonthIndex: 6,
    lengthMonths: 6,
    expectedMonthlyThroughputCubicFeet: 360000,
    revenuePerCubicFoot: 0.42,
    targetThroughputCubicFeetPerDay: 12000,
    minimumServiceLevel: 85,
    dwellPenaltyThresholdTicks: 1440,
    dwellPenaltyRatePerCubicFoot: 0.02,
    difficultyTag: "capacity",
    operationalChallengeNote: "High monthly cube demands steady dock turnover.",
    health: "stable",
    serviceLevel: 100,
    performanceScore: 100,
    penaltyCostToDate: 0,
    lastPenaltyTick: null,
    ...overrides,
  };
}

describe("labor analysis", () => {
  it("records direct and support-role analytics when unload work completes", () => {
    const runner = new SimulationRunner();
    const state = runner.getState();

    state.freightFlow.trailers.push(createUnloadTrailer());
    state.freightFlow.freightBatches.push(createUnloadBatch());

    runner.tick();

    const roles = selectLaborAnalysisRoles(state);
    const unload = roles.find((role) => role.roleId === LaborRole.Unload);
    const sanitation = roles.find((role) => role.roleId === LaborRole.Sanitation);

    expect(unload?.totalCubicFeetProcessed).toBe(100);
    expect(unload?.averageTaskTicks).toBe(1);
    expect(unload?.costPerThroughputCube).not.toBeNull();
    expect(sanitation?.isEstimated).toBe(true);
    expect(sanitation?.totalCubicFeetProcessed).toBe(100);
  });

  it("resets labor analytics when monthly planning opens for a new month", () => {
    const runner = new SimulationRunner({ initialCalendar: rolloverCalendar });
    const state = runner.getState();

    state.labor.analytics.roles.find((role) => role.roleId === LaborRole.Unload)!.directCubicFeetProcessed = 999;

    runner.tick();

    const unloadAnalytics = state.labor.analytics.roles.find(
      (role) => role.roleId === LaborRole.Unload,
    );

    expect(state.planning.isPlanningActive).toBe(true);
    expect(state.labor.analytics.monthKey).toBe("Y1-M2");
    expect(unloadAnalytics?.directCubicFeetProcessed).toBe(0);
  });

  it("suggests adding unload labor when inbound work is backing up", () => {
    const runner = new SimulationRunner();
    const state = runner.getState();

    runner.dispatch(new AssignLaborCommand(LaborRole.Unload, 0));
    state.freightFlow.trailers.push(createUnloadTrailer({ remainingUnloadCubicFeet: 400 }));
    state.freightFlow.freightBatches.push(createUnloadBatch({ cubicFeet: 400 }));

    runner.tick();

    const suggestions = selectLaborAnalysisSuggestions(state).map((suggestion) => suggestion.message);

    expect(suggestions).toContain("Look into adding more unloader labor.");
  });

  it("matches labor analysis summary cost to employed-headcount payroll", () => {
    const runner = new SimulationRunner();
    const state = runner.getState();

    state.labor.totalHeadcount = 20;
    state.labor.unassignedHeadcount = 2;

    runner.tick();

    const summary = selectLaborAnalysisSummary(state);

    expect(summary.totalLaborCost).toBe(state.economy.currentMonthLaborCost);
    expect(summary.totalLaborCost).toBeCloseTo(20 * LABOR_COST_PER_WORKER_PER_TICK, 6);
  });

  it("builds a positive forecast headcount for accepted contracts", () => {
    const runner = new SimulationRunner();
    const state = runner.getState();

    state.contracts.activeContracts.push(createAcceptedContract());

    const forecast = selectLaborForecastHeadcountChart(state);
    const unload = forecast.find((role) => role.roleId === LaborRole.Unload);
    const sanitation = forecast.find((role) => role.roleId === LaborRole.Sanitation);

    expect(unload?.idealHeadcount).toBeGreaterThan(0);
    expect(sanitation?.idealHeadcount).toBeGreaterThan(0);
  });

  it("uses employed headcount for contract portfolio labor estimates", () => {
    const runner = new SimulationRunner();
    const state = runner.getState();

    state.labor.totalHeadcount = 20;
    state.labor.unassignedHeadcount = 2;
    state.contracts.activeContracts.push(createAcceptedContract());

    const cards = selectContractPortfolioCards(state);
    const totalEstimatedDailyLaborCost = cards.reduce(
      (total, card) => total + card.estimatedDailyLaborCost,
      0,
    );
    const totalEstimatedDailyHeadcount = cards.reduce(
      (total, card) => total + card.estimatedDailyHeadcount,
      0,
    );

    expect(totalEstimatedDailyLaborCost).toBeCloseTo(
      20 * LABOR_COST_PER_WORKER_PER_TICK * TICKS_PER_DAY,
      6,
    );
    expect(totalEstimatedDailyHeadcount).toBeCloseTo(20, 6);
  });

  it("preserves labor analytics through serialization", () => {
    const runner = new SimulationRunner();
    const state = runner.getState();
    const unloadAnalytics = state.labor.analytics.roles.find(
      (role) => role.roleId === LaborRole.Unload,
    );

    expect(unloadAnalytics).toBeTruthy();
    unloadAnalytics!.directCubicFeetProcessed = 321;
    unloadAnalytics!.totalLaborCost = 77;

    const restored = deserializeGameState(serializeGameState(state));
    const restoredAnalytics = restored.labor.analytics.roles.find(
      (role) => role.roleId === LaborRole.Unload,
    );

    expect(restored.labor.analytics.monthKey).toBe(state.labor.analytics.monthKey);
    expect(restoredAnalytics?.directCubicFeetProcessed).toBe(321);
    expect(restoredAnalytics?.totalLaborCost).toBe(77);
  });
});
