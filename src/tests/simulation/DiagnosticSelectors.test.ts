import { describe, expect, it } from "vitest";
import { PaintZoneCommand } from "../../game/simulation/commands/PaintZoneCommand";
import { PlaceDoorCommand } from "../../game/simulation/commands/PlaceDoorCommand";
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
    contractId: "baseline-general-freight",
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
    dockTileIndex: null,
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

    runner.dispatch(new PlaceDoorCommand(4, 0, "flex"));
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

  it("surfaces dock-capacity blockage as a critical issue", () => {
    const runner = new SimulationRunner();
    const state = runner.getState();

    runner.dispatch(new PlaceDoorCommand(8, 0, "inbound"));
    runner.dispatch(new PlaceDoorCommand(14, 0, "inbound"));

    state.freightFlow.trailers.push({
      id: "trailer-blocked",
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
      remainingUnloadCubicFeet: 1200,
      remainingLoadCubicFeet: 0,
      dockTileIndex: null,
    });

    for (const door of state.freightFlow.doors) {
      [door.x - 1, door.x, door.x + 1]
        .map((x) => state.warehouseMap.getTile(x, 0))
        .filter((tile): tile is NonNullable<typeof tile> => Boolean(tile))
        .forEach((tile, index) => {
          state.freightFlow.freightBatches.push({
            id: `batch-${door.id}-${index}`,
            trailerId: `occupied-${door.id}-${index}`,
            contractId: "baseline-general-freight",
            freightClassId: "standard",
            cubicFeet: 5000,
            state: "on-dock",
            createdTick: 0,
            unloadedTick: 0,
            storageZoneId: null,
            outboundOrderId: null,
            storedTick: null,
            remainingStorageCubicFeet: 5000,
            pickedTick: null,
            loadedTick: null,
            dockTileIndex: state.warehouseMap.getTileIndex(tile.x, tile.y),
          });
        });
    }

    runner.tick();

    expect(
      selectOperationalIssues(state).find((issue) => issue.id === "alert-dock-capacity-blocked"),
    ).toMatchObject({
      id: "alert-dock-capacity-blocked",
      severity: "critical",
      category: "door",
    });
  });
});
