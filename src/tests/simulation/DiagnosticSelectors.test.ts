import { describe, expect, it } from "vitest";
import { PaintZoneCommand } from "../../game/simulation/commands/PaintZoneCommand";
import { SimulationRunner } from "../../game/simulation/core/SimulationRunner";
import type { FreightBatch } from "../../game/simulation/freight/FreightBatch";
import {
  selectDoorUtilizationSummary,
  selectInvalidStorageIssueCount,
  selectOperationalIssues,
  selectQueuePressureSummary,
} from "../../game/simulation/selectors/diagnosticSelectors";
import { TileZoneType } from "../../game/simulation/types/enums";

function createDockBatch(freightClassId = "standard"): FreightBatch {
  return {
    id: "batch-test",
    trailerId: "trailer-test",
    freightClassId,
    cubicFeet: 600,
    state: "on-dock",
    createdTick: 0,
    unloadedTick: 0,
    storageZoneId: null,
    outboundOrderId: null,
    storedTick: null,
    remainingStorageCubicFeet: 600,
    pickedTick: null,
    loadedTick: null,
  };
}

describe("diagnostic selectors", () => {
  it("reports invalid storage as a focusable operational issue", () => {
    const runner = new SimulationRunner();

    runner.dispatch(new PaintZoneCommand(8, 8, TileZoneType.StandardStorage));

    const issues = selectOperationalIssues(runner.getState());
    const invalidStorageIssue = issues.find((issue) => issue.id === "invalid-storage");

    expect(selectInvalidStorageIssueCount(runner.getState())).toBe(1);
    expect(invalidStorageIssue).toMatchObject({
      severity: "warning",
      category: "storage",
      focusTarget: { x: 8, y: 8 },
    });
  });

  it("promotes blocked dock storage needs above warning-level issues", () => {
    const runner = new SimulationRunner();
    const state = runner.getState();

    runner.dispatch(new PaintZoneCommand(8, 8, TileZoneType.StandardStorage));
    state.freightFlow.freightBatches.push(createDockBatch());

    const issues = selectOperationalIssues(state);

    expect(issues[0]).toMatchObject({
      id: "dock-storage-standard",
      severity: "critical",
      category: "storage",
    });
    expect(issues[0].recommendedAction).toContain("Paint valid");
  });

  it("summarizes door utilization and queue pressure", () => {
    const runner = new SimulationRunner();
    const state = runner.getState();

    state.freightFlow.doors[0].state = "loading";
    state.freightFlow.queues.yardTrailers = 5;
    state.freightFlow.queues.dockFreightCubicFeet = 4500;

    const doors = selectDoorUtilizationSummary(state);
    const queues = selectQueuePressureSummary(state);

    expect(doors.activeDoors).toBeGreaterThan(0);
    expect(doors.busyDoors).toBe(1);
    expect(doors.loadingDoors).toBe(1);
    expect(queues.severity).toBe("critical");
  });
});
