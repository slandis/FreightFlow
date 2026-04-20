import { describe, expect, it } from "vitest";
import {
  calculateTicksForElapsed,
  HYPER_TARGET_SECONDS_PER_MONTH,
  HYPER_TICKS_PER_SECOND,
  getTicksPerSecondForSpeed,
  MAX_HYPER_TICKS_PER_FRAME,
  MAX_TICKS_PER_FRAME,
  TICKS_PER_MONTH,
} from "../../game/simulation/core/SimulationTiming";
import { GameSpeed } from "../../game/simulation/types/enums";

describe("SimulationTiming", () => {
  it("maps simulation speeds to ticks per second", () => {
    expect(getTicksPerSecondForSpeed(GameSpeed.Paused)).toBe(0);
    expect(getTicksPerSecondForSpeed(GameSpeed.Slow)).toBe(1);
    expect(getTicksPerSecondForSpeed(GameSpeed.Medium)).toBe(4);
    expect(getTicksPerSecondForSpeed(GameSpeed.Fast)).toBe(12);
    expect(getTicksPerSecondForSpeed(GameSpeed.Hyper)).toBe(HYPER_TICKS_PER_SECOND);
  });

  it("does not accumulate ticks while paused", () => {
    expect(calculateTicksForElapsed(10000, GameSpeed.Paused, 500)).toEqual({
      ticksToRun: 0,
      accumulatedMs: 0,
    });
  });

  it("calculates slow, medium, fast, and hyper ticks from elapsed time", () => {
    expect(calculateTicksForElapsed(1000, GameSpeed.Slow, 0).ticksToRun).toBe(1);
    expect(calculateTicksForElapsed(1000, GameSpeed.Medium, 0).ticksToRun).toBe(4);
    expect(calculateTicksForElapsed(1000, GameSpeed.Fast, 0).ticksToRun).toBe(12);
    expect(calculateTicksForElapsed(1000, GameSpeed.Hyper, 0).ticksToRun).toBe(
      MAX_HYPER_TICKS_PER_FRAME,
    );
  });

  it("targets a month of hyper ticks in six seconds", () => {
    expect(HYPER_TARGET_SECONDS_PER_MONTH).toBeGreaterThanOrEqual(5);
    expect(HYPER_TARGET_SECONDS_PER_MONTH).toBeLessThanOrEqual(10);
    expect(HYPER_TICKS_PER_SECOND * HYPER_TARGET_SECONDS_PER_MONTH).toBe(TICKS_PER_MONTH);
  });

  it("carries partial elapsed time between frames", () => {
    const firstFrame = calculateTicksForElapsed(400, GameSpeed.Slow, 0);
    const secondFrame = calculateTicksForElapsed(600, GameSpeed.Slow, firstFrame.accumulatedMs);

    expect(firstFrame.ticksToRun).toBe(0);
    expect(firstFrame.accumulatedMs).toBe(400);
    expect(secondFrame.ticksToRun).toBe(1);
    expect(secondFrame.accumulatedMs).toBe(0);
  });

  it("caps catch-up ticks after large elapsed times", () => {
    const result = calculateTicksForElapsed(100000, GameSpeed.Fast, 0);

    expect(result.ticksToRun).toBe(MAX_TICKS_PER_FRAME);
    expect(result.accumulatedMs).toBe(0);
  });
});
