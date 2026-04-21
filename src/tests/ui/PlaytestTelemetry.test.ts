import { describe, expect, it } from "vitest";
import { SimulationRunner } from "../../game/simulation/core/SimulationRunner";
import {
  createPlaytestMonthAccumulator,
  finalizePlaytestMonth,
  formatPlaytestReview,
  samplePlaytestMonth,
} from "../../ui/playtest/playtestTelemetry";

describe("playtest telemetry", () => {
  it("captures monthly averages and peaks from sampled state", () => {
    const runner = new SimulationRunner({ difficultyModeId: "relaxed" });
    const state = runner.getState();
    const accumulator = createPlaytestMonthAccumulator("Y1-M1");

    state.freightFlow.queues.dockFreightCubicFeet = 1200;
    state.freightFlow.queues.storageQueueCubicFeet = 900;
    state.freightFlow.outboundOrders.push({
      id: "order-1",
      contractId: "baseline-general-freight",
      freightClassId: "standard",
      requestedCubicFeet: 400,
      fulfilledCubicFeet: 0,
      state: "blocked",
      createdTick: 0,
      dueTick: 200,
      freightBatchIds: [],
      outboundTrailerId: null,
      blockedReason: "No inventory",
      remainingPickCubicFeet: 400,
      remainingLoadCubicFeet: 400,
      revenueRecognizedTick: null,
      recognizedRevenue: 0,
      recognizedPenalty: 0,
    });
    samplePlaytestMonth(accumulator, state);

    state.freightFlow.queues.dockFreightCubicFeet = 2400;
    state.freightFlow.queues.storageQueueCubicFeet = 1800;
    samplePlaytestMonth(accumulator, state);

    const record = finalizePlaytestMonth(accumulator, state);

    expect(record.difficultyName).toBe("Relaxed");
    expect(record.avgDockFreightCubicFeet).toBe(1800);
    expect(record.peakDockFreightCubicFeet).toBe(2400);
    expect(record.avgBlockedOutboundOrders).toBe(1);
    expect(record.peakQueuePressure).toBeGreaterThan(record.avgQueuePressure);
  });

  it("formats a readable export summary", () => {
    const summary = formatPlaytestReview([
      {
        monthKey: "Y1-M2",
        difficultyModeId: "standard",
        difficultyName: "Standard",
        endingCash: 95000,
        monthlyNet: -1200,
        throughputCubicFeet: 5400,
        serviceLevel: 78,
        avgQueuePressure: 1.25,
        peakQueuePressure: 2.1,
        avgDockFreightCubicFeet: 1200,
        peakDockFreightCubicFeet: 2600,
        avgInvalidStorageCount: 1.2,
        peakInvalidStorageCount: 3,
        avgBlockedOutboundOrders: 0.5,
        peakBlockedOutboundOrders: 2,
        laborBottleneckFrequency: { unload: 12, storage: 7 },
        budget: {
          maintenance: 4,
          training: 4,
          safety: 4,
          operationsSupport: 4,
          contingency: 2,
        },
      },
    ]);

    expect(summary).toContain("Y1-M2 | Standard");
    expect(summary).toContain("Top bottlenecks: unload (12), storage (7)");
  });
});
