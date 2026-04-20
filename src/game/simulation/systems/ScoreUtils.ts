import type { ScoreDriver, ScoreMetric, ScoreTrend } from "../core/GameState";
import { clamp } from "../../shared/utils/clamp";

export function updateScore(
  metric: ScoreMetric,
  delta: number,
  drivers: ScoreDriver[],
): void {
  const previousValue = metric.value;
  metric.value = clamp(previousValue + delta, 0, 100);
  metric.trend = calculateTrend(previousValue, metric.value);
  metric.drivers = drivers.filter((driver) => driver.impact !== 0);
}

function calculateTrend(previousValue: number, nextValue: number): ScoreTrend {
  const difference = nextValue - previousValue;

  if (Math.abs(difference) < 0.01) {
    return "stable";
  }

  return difference > 0 ? "rising" : "falling";
}
