import { GameSpeed } from "../types/enums";

export const MAX_TICKS_PER_FRAME = 30;

const ticksPerSecondBySpeed: Record<GameSpeed, number> = {
  [GameSpeed.Paused]: 0,
  [GameSpeed.Slow]: 1,
  [GameSpeed.Medium]: 4,
  [GameSpeed.Fast]: 12,
};

export interface TickCalculationResult {
  ticksToRun: number;
  accumulatedMs: number;
}

export function getTicksPerSecondForSpeed(speed: GameSpeed): number {
  return ticksPerSecondBySpeed[speed];
}

export function calculateTicksForElapsed(
  elapsedMs: number,
  speed: GameSpeed,
  accumulatedMs: number,
): TickCalculationResult {
  const ticksPerSecond = getTicksPerSecondForSpeed(speed);

  if (ticksPerSecond <= 0) {
    return {
      ticksToRun: 0,
      accumulatedMs: 0,
    };
  }

  const tickIntervalMs = 1000 / ticksPerSecond;
  const totalElapsedMs = Math.max(0, elapsedMs) + accumulatedMs;
  const uncappedTicksToRun = Math.floor(totalElapsedMs / tickIntervalMs);
  const ticksToRun = Math.min(uncappedTicksToRun, MAX_TICKS_PER_FRAME);
  const nextAccumulatedMs =
    uncappedTicksToRun > MAX_TICKS_PER_FRAME
      ? 0
      : totalElapsedMs - ticksToRun * tickIntervalMs;

  return {
    ticksToRun,
    accumulatedMs: nextAccumulatedMs,
  };
}
