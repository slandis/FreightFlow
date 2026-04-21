import { describe, expect, it } from "vitest";
import { PaintZoneCommand } from "../../game/simulation/commands/PaintZoneCommand";
import { SimulationRunner } from "../../game/simulation/core/SimulationRunner";
import type { FreightBatch } from "../../game/simulation/freight/FreightBatch";
import { selectTutorialHintCandidates } from "../../ui/tutorial/tutorialHints";
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
    dockTileIndex: null,
  };
}

describe("tutorial hints", () => {
  it("introduces monthly planning when a new run opens in planning", () => {
    const runner = new SimulationRunner({ openInitialPlanning: true });
    const hintIds = selectTutorialHintCandidates(runner.getState()).map((hint) => hint.id);

    expect(hintIds).toContain("planning-intro");
  });

  it("flags invalid storage when no valid storage exists", () => {
    const runner = new SimulationRunner();

    runner.dispatch(new PaintZoneCommand(8, 8, TileZoneType.StandardStorage));

    const hintIds = selectTutorialHintCandidates(runner.getState()).map((hint) => hint.id);

    expect(hintIds).toContain("no-valid-storage");
  });

  it("points players at blocked dock freight that needs compatible storage", () => {
    const runner = new SimulationRunner();

    runner.getState().freightFlow.freightBatches.push(createDockBatch("special-handling"));

    const blockedHint = selectTutorialHintCandidates(runner.getState()).find(
      (hint) => hint.id === "blocked-dock-storage",
    );

    expect(blockedHint?.title).toContain("Special Handling Freight");
    expect(blockedHint?.overlayMode).toBe("storage-capacity");
  });
});
