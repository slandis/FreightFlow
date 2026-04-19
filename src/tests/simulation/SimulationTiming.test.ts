import { describe, expect, it } from "vitest";
import {
  calculateTicksForElapsed,
  getTicksPerSecondForSpeed,
  MAX_TICKS_PER_FRAME,
} from "../../game/simulation/core/SimulationTiming";
import { GameSpeed } from "../../game/simulation/types/enums";

describe("SimulationTiming", () => {
  it("maps simulation speeds to ticks per second", () => {
    expect(getTicksPerSecondForSpeed(GameSpeed.Paused)).toBe(0);
    expect(getTicksPerSecondForSpeed(GameSpeed.Slow)).toBe(1);
    expect(getTicksPerSecondForSpeed(GameSpeed.Medium)).toBe(4);
    expect(getTicksPerSecondForSpeed(GameSpeed.Fast)).toBe(12);
  });

  it("does not accumulate ticks while paused", () => {
    expect(calculateTicksForElapsed(10000, GameSpeed.Paused, 500)).toEqual({
      ticksToRun: 0,
      accumulatedMs: 0,
    });
  });

  it("calculates slow, medium, and fast ticks from elapsed time", () => {
    expect(calculateTicksForElapsed(1000, GameSpeed.Slow, 0).ticksToRun).toBe(1);
    expect(calculateTicksForElapsed(1000, GameSpeed.Medium, 0).ticksToRun).toBe(4);
    expect(calculateTicksForElapsed(1000, GameSpeed.Fast, 0).ticksToRun).toBe(12);
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
