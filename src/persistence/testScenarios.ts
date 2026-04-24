import { PaintZoneCommand } from "../game/simulation/commands/PaintZoneCommand";
import { PlaceDoorCommand } from "../game/simulation/commands/PlaceDoorCommand";
import { SimulationRunner } from "../game/simulation/core/SimulationRunner";
import type { GameState } from "../game/simulation/core/GameState";
import { TileZoneType } from "../game/simulation/types/enums";
import { recalculateZoneUsage } from "../game/simulation/world/zoneUsage";
import { createSavePayload } from "./GameStateSerializer";
import type { SaveRepository } from "./LocalSaveRepository";

export interface TestScenarioDefinition {
  slotId: string;
  label: string;
  description: string;
  difficultyModeId: "relaxed" | "standard" | "demanding" | "brutal";
}

export const TEST_SCENARIOS: TestScenarioDefinition[] = [
  {
    slotId: "scenario-relaxed",
    label: "Relaxed Starter",
    description: "Stable starter layout with spare cash and light active inventory.",
    difficultyModeId: "relaxed",
  },
  {
    slotId: "scenario-standard",
    label: "Standard Starter",
    description: "Balanced starter floor with some live yard and outbound pressure.",
    difficultyModeId: "standard",
  },
  {
    slotId: "scenario-demanding",
    label: "Demanding Pressure",
    description: "Tighter cash, fuller storage, and visible inbound/outbound friction.",
    difficultyModeId: "demanding",
  },
  {
    slotId: "scenario-brutal",
    label: "Brutal Recovery",
    description: "Low cash and active flow problems that need immediate intervention.",
    difficultyModeId: "brutal",
  },
];

export function ensureTestScenarioSlots(
  repository: SaveRepository,
  clock: () => Date = () => new Date(),
): void {
  for (const scenario of TEST_SCENARIOS) {
    resetTestScenarioSlot(repository, scenario.slotId, clock);
  }
}

export function resetTestScenarioSlot(
  repository: SaveRepository,
  slotId: string,
  clock: () => Date = () => new Date(),
): void {
  const scenario = TEST_SCENARIOS.find((candidate) => candidate.slotId === slotId);

  if (!scenario) {
    return;
  }

  const state = createScenarioState(scenario);
  const payload = createSavePayload(state, scenario.slotId, clock());
  repository.write(scenario.slotId, JSON.stringify(payload));
}

function createScenarioState(scenario: TestScenarioDefinition): GameState {
  const runner = new SimulationRunner({ difficultyModeId: scenario.difficultyModeId, seed: 7 });

  paintStarterLayout(runner);
  populateScenario(runner.getState(), scenario.difficultyModeId);
  runner.tick();

  return runner.getState();
}

function paintStarterLayout(runner: SimulationRunner): void {
  const originX = 28;
  const originY = 28;

  runner.dispatch(new PlaceDoorCommand(4, 0, "inbound"));
  runner.dispatch(new PlaceDoorCommand(12, 0, "flex"));
  runner.dispatch(new PlaceDoorCommand(20, 0, "outbound"));

  const travelTiles = [
    [originX + 0, originY + 0],
    [originX + 1, originY + 0],
    [originX + 2, originY + 0],
    [originX + 3, originY + 0],
    [originX + 4, originY + 0],
    [originX + 5, originY + 0],
    [originX + 6, originY + 0],
    [originX + 7, originY + 0],
    [originX + 8, originY + 0],
    [originX + 9, originY + 0],
    [originX + 10, originY + 0],
    [originX + 11, originY + 0],
    [originX + 12, originY + 0],
    [originX + 13, originY + 0],
  ];

  for (const [x, y] of travelTiles) {
    runner.dispatch(new PaintZoneCommand(x, y, TileZoneType.Travel));
  }

  const standardTiles = [
    [originX + 1, originY + 1],
    [originX + 2, originY + 1],
    [originX + 3, originY + 1],
    [originX + 4, originY + 1],
    [originX + 5, originY + 1],
    [originX + 6, originY + 1],
  ];
  const fastTiles = [
    [originX + 8, originY + 1],
    [originX + 9, originY + 1],
    [originX + 10, originY + 1],
  ];
  const bulkTiles = [
    [originX + 1, originY + 3],
    [originX + 2, originY + 3],
    [originX + 3, originY + 3],
  ];
  const specialTiles = [
    [originX + 8, originY + 3],
    [originX + 9, originY + 3],
  ];

  for (const [x, y] of standardTiles) {
    runner.dispatch(new PaintZoneCommand(x, y, TileZoneType.StandardStorage));
  }
  for (const [x, y] of fastTiles) {
    runner.dispatch(new PaintZoneCommand(x, y, TileZoneType.FastTurnStorage));
  }
  for (const [x, y] of bulkTiles) {
    runner.dispatch(new PaintZoneCommand(x, y, TileZoneType.BulkStorage));
  }
  for (const [x, y] of specialTiles) {
    runner.dispatch(new PaintZoneCommand(x, y, TileZoneType.SpecialHandlingStorage));
  }
}

function populateScenario(
  state: GameState,
  difficultyModeId: TestScenarioDefinition["difficultyModeId"],
): void {
  const standardZoneId =
    state.warehouseMap.zones.find((zone) => zone.zoneType === TileZoneType.StandardStorage)?.id ??
    null;
  const fastZoneId =
    state.warehouseMap.zones.find((zone) => zone.zoneType === TileZoneType.FastTurnStorage)?.id ??
    null;
  const bulkZoneId =
    state.warehouseMap.zones.find((zone) => zone.zoneType === TileZoneType.BulkStorage)?.id ??
    null;

  const standardDoorId = state.freightFlow.doors.find((door) => door.x === 12)?.id ?? null;

  state.freightFlow.freightBatches.push(
    {
      id: `${difficultyModeId}-stored-standard-a`,
      trailerId: `${difficultyModeId}-trailer-a`,
      contractId: "baseline-general-freight",
      freightClassId: "standard",
      cubicFeet: difficultyModeId === "relaxed" ? 700 : 900,
      state: "in-storage",
      createdTick: 0,
      unloadedTick: 0,
      storageStartedTick: 0,
      storageZoneId: standardZoneId,
      outboundOrderId: null,
      storedTick: 0,
      remainingStorageCubicFeet: null,
      pickedTick: null,
      loadedTick: null,
      dockTileIndex: null,
      stageZoneId: null,
    },
    {
      id: `${difficultyModeId}-stored-fast-a`,
      trailerId: `${difficultyModeId}-trailer-b`,
      contractId: "baseline-general-freight",
      freightClassId: "fast-turn",
      cubicFeet: difficultyModeId === "brutal" ? 800 : 500,
      state: "in-storage",
      createdTick: 0,
      unloadedTick: 0,
      storageStartedTick: 0,
      storageZoneId: fastZoneId,
      outboundOrderId: null,
      storedTick: 0,
      remainingStorageCubicFeet: null,
      pickedTick: null,
      loadedTick: null,
      dockTileIndex: null,
      stageZoneId: null,
    },
  );

  if (bulkZoneId && difficultyModeId !== "relaxed") {
    state.freightFlow.freightBatches.push({
      id: `${difficultyModeId}-stored-bulk-a`,
      trailerId: `${difficultyModeId}-trailer-c`,
      contractId: "baseline-general-freight",
      freightClassId: "bulk",
      cubicFeet: difficultyModeId === "brutal" ? 1200 : 900,
      state: "in-storage",
      createdTick: 0,
      unloadedTick: 0,
      storageStartedTick: 0,
      storageZoneId: bulkZoneId,
      outboundOrderId: null,
      storedTick: 0,
      remainingStorageCubicFeet: null,
      pickedTick: null,
      loadedTick: null,
      dockTileIndex: null,
      stageZoneId: null,
    });
  }

  if (difficultyModeId !== "relaxed") {
    state.freightFlow.trailers.push({
      id: `${difficultyModeId}-yard-trailer`,
      contractId: "baseline-general-freight",
      direction: "inbound",
      state: "yard",
      doorId: null,
      freightBatchIds: [],
      arrivalTick: 0,
      readyForDoorAssignmentTick: difficultyModeId === "standard" ? 2 : 4,
      doorAssignedTick: null,
      unloadStartedTick: null,
      completedTick: null,
      remainingSwitchTicks: 0,
      remainingUnloadCubicFeet: difficultyModeId === "standard" ? 900 : 1200,
      remainingLoadCubicFeet: 0,
      dockTileIndex: null,
      stageZoneId: null,
    });
  }

  if (difficultyModeId === "demanding" || difficultyModeId === "brutal") {
    const dockTileIndex = state.warehouseMap.getTileIndex(12, 0);
    state.freightFlow.freightBatches.push({
      id: `${difficultyModeId}-dock-batch`,
      trailerId: `${difficultyModeId}-yard-trailer`,
      contractId: "baseline-general-freight",
      freightClassId: "standard",
      cubicFeet: difficultyModeId === "demanding" ? 950 : 1200,
      state: "in-stage",
      createdTick: 0,
      unloadedTick: 0,
      storageStartedTick: null,
      storageZoneId: null,
      outboundOrderId: null,
      storedTick: null,
      remainingStorageCubicFeet: difficultyModeId === "demanding" ? 950 : 1200,
      pickedTick: null,
      loadedTick: null,
      dockTileIndex,
      stageZoneId: null,
    });
  }

  if (difficultyModeId === "standard" || difficultyModeId === "demanding" || difficultyModeId === "brutal") {
    state.freightFlow.outboundOrders.push({
      id: `${difficultyModeId}-open-order`,
      contractId: "baseline-general-freight",
      freightClassId: "standard",
      requestedCubicFeet: difficultyModeId === "standard" ? 600 : 900,
      fulfilledCubicFeet: 0,
      state: difficultyModeId === "standard" ? "open" : "blocked",
      createdTick: 0,
      dueTick: difficultyModeId === "brutal" ? -10 : 720,
      freightBatchIds: [],
      outboundTrailerId: null,
      blockedReason: difficultyModeId === "standard" ? null : "Inventory unavailable",
      remainingPickCubicFeet: difficultyModeId === "standard" ? 600 : 900,
      pickStartedTick: null,
      remainingLoadCubicFeet: difficultyModeId === "standard" ? 600 : 900,
      loadStartedTick: null,
      revenueRecognizedTick: null,
      recognizedRevenue: 0,
      recognizedPenalty: 0,
    });
  }

  if (difficultyModeId === "brutal" && standardDoorId) {
    const door = state.freightFlow.doors.find((candidate) => candidate.id === standardDoorId);

    if (door) {
      door.state = "reserved";
      door.trailerId = `${difficultyModeId}-yard-trailer`;
    }
  }

  state.cash = getScenarioCash(difficultyModeId);
  recalculateZoneUsage(state.freightFlow, state.warehouseMap);
}

function getScenarioCash(difficultyModeId: TestScenarioDefinition["difficultyModeId"]): number {
  switch (difficultyModeId) {
    case "relaxed":
      return 180000;
    case "standard":
      return 60000;
    case "demanding":
      return 28000;
    case "brutal":
      return 12000;
  }
}
