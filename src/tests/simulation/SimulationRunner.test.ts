import { describe, expect, it } from "vitest";
import { TileZoneType } from "../../game/simulation/types/enums";
import { ChangeSpeedCommand } from "../../game/simulation/commands/ChangeSpeedCommand";
import { GameSpeed } from "../../game/simulation/types/enums";
import { SimulationRunner } from "../../game/simulation/core/SimulationRunner";
import { selectCash } from "../../game/simulation/selectors/kpiSelectors";
import {
  formatCalendarTime,
  selectCurrentTick,
  selectSpeed,
} from "../../game/simulation/selectors/timeSelectors";

describe("SimulationRunner", () => {
  it("advances the simulation clock", () => {
    const runner = new SimulationRunner();

    runner.tick();

    expect(runner.getState().currentTick).toBe(1);
    expect(runner.getState().calendar.minute).toBe(1);
  });

  it("advances calendar hours from accumulated minute ticks", () => {
    const runner = new SimulationRunner();

    for (let index = 0; index < 60; index += 1) {
      runner.tick();
    }

    expect(runner.getState().calendar.hour).toBe(9);
    expect(runner.getState().calendar.minute).toBe(0);
  });

  it("starts with a 64x64 warehouse map, protected dock edges, and no assigned doors", () => {
    const runner = new SimulationRunner();
    const state = runner.getState();
    const map = state.warehouseMap;

    expect(map.width).toBe(64);
    expect(map.height).toBe(64);
    expect(map.tiles).toHaveLength(4096);
    expect(map.getTile(0, 0)?.zoneType).toBe(TileZoneType.Dock);
    expect(map.getTile(1, 1)?.zoneType).toBe(TileZoneType.Unassigned);
    expect(state.freightFlow.doors).toHaveLength(0);
    expect(map.getTile(8, 0)?.isActiveDoor).toBe(false);
  });

  it("dispatches commands against the authoritative state", () => {
    const runner = new SimulationRunner();

    const result = runner.dispatch(new ChangeSpeedCommand(GameSpeed.Fast));

    expect(result.success).toBe(true);
    expect(selectSpeed(runner.getState())).toBe(GameSpeed.Fast);
    expect(runner.getState().debug.lastCommandType).toBe("change-speed");
  });

  it("emits command events through the shared event bus", () => {
    const runner = new SimulationRunner();
    const receivedTypes: string[] = [];

    runner.getEventBus().subscribe("speed-changed", (event) => {
      receivedTypes.push(event.type);
    });

    runner.dispatch(new ChangeSpeedCommand(GameSpeed.Slow));

    expect(receivedTypes).toEqual(["speed-changed"]);
    expect(runner.getState().debug.lastEventType).toBe("speed-changed");
  });

  it("notifies subscribers when state changes", () => {
    const runner = new SimulationRunner();
    const ticks: number[] = [];
    const unsubscribe = runner.subscribe((state) => {
      ticks.push(state.currentTick);
    });

    runner.tick();
    unsubscribe();
    runner.tick();

    expect(ticks).toEqual([0, 1]);
  });

  it("increments revision as ticks and commands update state", () => {
    const runner = new SimulationRunner();

    expect(runner.getRevision()).toBe(0);

    runner.tick();
    expect(runner.getRevision()).toBe(1);

    runner.dispatch(new ChangeSpeedCommand(GameSpeed.Slow));
    expect(runner.getRevision()).toBe(2);
  });

  it("notifies change subscribers without an immediate initial callback", () => {
    const runner = new SimulationRunner();
    let changeCount = 0;

    const unsubscribe = runner.subscribeToChanges(() => {
      changeCount += 1;
    });

    expect(changeCount).toBe(0);

    runner.tick();
    unsubscribe();
    runner.tick();

    expect(changeCount).toBe(1);
  });

  it("batches change notifications when multiple ticks run together", () => {
    const runner = new SimulationRunner();
    let changeCount = 0;

    const unsubscribe = runner.subscribeToChanges(() => {
      changeCount += 1;
    });

    const executedTicks = runner.tickMany(5);

    unsubscribe();

    expect(executedTicks).toBe(5);
    expect(runner.getState().currentTick).toBe(5);
    expect(changeCount).toBe(1);
    expect(runner.getRevision()).toBe(1);
  });

  it("exposes baseline state through selectors", () => {
    const runner = new SimulationRunner({ startingCash: 125000 });
    const state = runner.getState();

    expect(selectCurrentTick(state)).toBe(0);
    expect(selectCash(state)).toBe(125000);
  });

  it("formats calendar time for HUD display", () => {
    expect(
      formatCalendarTime({
        year: 1,
        month: 2,
        day: 3,
        hour: 4,
        minute: 5,
      }),
    ).toBe("Year 1, Month 2, Day 3, 04:05");
  });
});
