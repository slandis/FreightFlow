import { describe, expect, it } from "vitest";
import { LocalSaveRepository, type StorageAdapter } from "../../persistence/LocalSaveRepository";
import {
  deserializeGameState,
  validateSavePayload,
} from "../../persistence/GameStateSerializer";
import { TileZoneType } from "../../game/simulation/types/enums";
import {
  ensureTestScenarioSlots,
  resetTestScenarioSlot,
  TEST_SCENARIOS,
} from "../../persistence/testScenarios";

class MemoryStorage implements StorageAdapter {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("test scenarios", () => {
  it("seeds one valid loadable save for each run difficulty", () => {
    const repository = new LocalSaveRepository(new MemoryStorage());

    ensureTestScenarioSlots(repository, () => new Date("2026-04-24T12:00:00.000Z"));

    for (const scenario of TEST_SCENARIOS) {
      const rawPayload = repository.read(scenario.slotId);
      expect(rawPayload).not.toBeNull();

      const payload = JSON.parse(rawPayload ?? "");
      const validation = validateSavePayload(payload);

      expect(validation).toEqual({ success: true, errors: [] });
      expect(payload.slotId).toBe(scenario.slotId);
      expect(payload.metadata.difficultyLabel).toBeDefined();
    }
  });

  it("seeds the relaxed scenario with a visible painted layout", () => {
    const repository = new LocalSaveRepository(new MemoryStorage());

    ensureTestScenarioSlots(repository, () => new Date("2026-04-24T12:00:00.000Z"));

    const payload = JSON.parse(repository.read("scenario-relaxed") ?? "");
    const state = deserializeGameState(payload.gameState);

    expect(state.warehouseMap.getTile(28, 28)?.zoneType).toBe(TileZoneType.Travel);
    expect(state.warehouseMap.getTile(29, 29)?.zoneType).toBe(TileZoneType.StandardStorage);
    expect(
      state.freightFlow.doors.some((door) => door.x === 4 && door.y === 0 && door.mode === "inbound"),
    ).toBe(true);
  });

  it("can reset an overwritten scenario slot back to its seeded payload", () => {
    const repository = new LocalSaveRepository(new MemoryStorage());

    ensureTestScenarioSlots(repository, () => new Date("2026-04-24T12:00:00.000Z"));
    repository.write("scenario-standard", JSON.stringify({ bad: true }));

    resetTestScenarioSlot(
      repository,
      "scenario-standard",
      () => new Date("2026-04-24T12:30:00.000Z"),
    );

    const restored = JSON.parse(repository.read("scenario-standard") ?? "");
    const validation = validateSavePayload(restored);

    expect(validation).toEqual({ success: true, errors: [] });
    expect(restored.savedAt).toBe("2026-04-24T12:30:00.000Z");
    expect(restored.metadata.difficultyLabel).toBe("Standard");
  });
});
