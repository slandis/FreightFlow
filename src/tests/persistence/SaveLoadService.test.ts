import { describe, expect, it } from "vitest";
import { PaintZoneCommand } from "../../game/simulation/commands/PaintZoneCommand";
import { PlaceDoorCommand } from "../../game/simulation/commands/PlaceDoorCommand";
import { SimulationRunner } from "../../game/simulation/core/SimulationRunner";
import { GameSpeed, TileZoneType } from "../../game/simulation/types/enums";
import {
  SAVE_SCHEMA_VERSION,
  type SaveGamePayload,
} from "../../persistence/SaveGameSchema";
import { LocalSaveRepository, type StorageAdapter } from "../../persistence/LocalSaveRepository";
import { SaveLoadService } from "../../persistence/SaveLoadService";

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

function createService(runner: SimulationRunner, storage = new MemoryStorage()) {
  const repository = new LocalSaveRepository(storage);
  const service = new SaveLoadService(
    repository,
    () => runner.getState(),
    (state) => runner.replaceState(state),
    () => new Date("2026-04-20T12:00:00.000Z"),
  );

  return { repository, service, storage };
}

describe("SaveLoadService", () => {
  it("saves a versioned payload with useful metadata", () => {
    const runner = new SimulationRunner();
    const { repository, service } = createService(runner);

    const result = service.save("slot-1");
    const payload = JSON.parse(repository.read("slot-1") ?? "") as SaveGamePayload;

    expect(result.success).toBe(true);
    expect(payload.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    expect(payload.savedAt).toBe("2026-04-20T12:00:00.000Z");
    expect(payload.metadata.currentTick).toBe(0);
    expect(payload.metadata.cash).toBe(100000);
    expect(payload.metadata.difficultyLabel).toBe("Standard");
  });

  it("loads a reconstructed state and resumes paused", () => {
    const runner = new SimulationRunner();
    const { service } = createService(runner);

    runner.dispatch(new PaintZoneCommand(5, 5, TileZoneType.Travel));
    runner.dispatch(new PaintZoneCommand(7, 5, TileZoneType.StandardStorage));
    runner.dispatch(new PlaceDoorCommand(4, 0, "inbound"));
    runner.getState().speed = GameSpeed.Hyper;
    service.save("slot-1");

    runner.dispatch(new PaintZoneCommand(7, 5, TileZoneType.BulkStorage));
    runner.getState().cash = 42;

    const result = service.load("slot-1");
    const state = runner.getState();

    expect(result.success).toBe(true);
    expect(state.speed).toBe(GameSpeed.Paused);
    expect(state.cash).toBe(100000);
    expect(state.warehouseMap.getTile(7, 5)?.zoneType).toBe(TileZoneType.StandardStorage);
    expect(state.warehouseMap.getTile(7, 5)?.validForStorage).toBe(true);
    expect(state.freightFlow.doors.some((door) => door.x === 4 && door.mode === "inbound")).toBe(
      true,
    );

    expect(() => runner.tick()).not.toThrow();
  });

  it("fails cleanly for missing, malformed, and unsupported saves", () => {
    const runner = new SimulationRunner();
    const { repository, service } = createService(runner);

    expect(service.load("missing")).toMatchObject({
      success: false,
      errors: ["No save found in missing"],
    });

    repository.write("bad-json", "{bad");
    expect(service.load("bad-json").success).toBe(false);

    repository.write(
      "future",
      JSON.stringify({
        schemaVersion: 999,
        savedAt: "2026-04-20T12:00:00.000Z",
        slotId: "future",
        metadata: {},
        gameState: {},
      }),
    );
    expect(service.load("future")).toMatchObject({
      success: false,
      errors: expect.arrayContaining(["Unsupported save schema version: 999"]),
    });
  });

  it("lists and deletes local save slots without crashing on malformed metadata", () => {
    const runner = new SimulationRunner();
    const { repository, service } = createService(runner);

    service.save("slot-1");
    repository.write("custom", "{bad");

    const slots = service.listSlots();
    expect(slots.find((slot) => slot.slotId === "slot-1")?.isEmpty).toBe(false);
    expect(slots.find((slot) => slot.slotId === "custom")?.error).toBe(
      "Save payload is malformed",
    );

    service.delete("slot-1");
    expect(service.hasSave("slot-1")).toBe(false);
  });

  it("notifies subscribers once when state is replaced", () => {
    const runner = new SimulationRunner();
    const { service } = createService(runner);
    let changeCount = 0;

    service.save("slot-1");
    const unsubscribe = runner.subscribeToChanges(() => {
      changeCount += 1;
    });

    service.load("slot-1");
    unsubscribe();

    expect(changeCount).toBe(1);
  });

  it("round-trips a save during monthly planning", () => {
    const runner = new SimulationRunner({ openInitialPlanning: true });
    const { service } = createService(runner);

    expect(runner.getState().planning.isPlanningActive).toBe(true);
    service.save("slot-1");
    runner.getState().planning.isPlanningActive = false;

    service.load("slot-1");

    expect(runner.getState().planning.isPlanningActive).toBe(true);
    expect(runner.getState().planning.pendingPlan).not.toBeNull();
  });

  it("round-trips an active freight lifecycle and can continue ticking", () => {
    const runner = new SimulationRunner({ seed: 10 });
    const { service } = createService(runner);

    for (let tick = 0; tick < 70; tick += 1) {
      runner.tick();
    }

    expect(runner.getState().freightFlow.trailers.length).toBeGreaterThan(0);
    service.save("slot-1");
    runner.getState().freightFlow.trailers = [];

    service.load("slot-1");

    expect(runner.getState().freightFlow.trailers.length).toBeGreaterThan(0);
    expect(() => runner.tick()).not.toThrow();
  });
});
