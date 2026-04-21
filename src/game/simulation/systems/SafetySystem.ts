import type { GameState, ScoreDriver } from "../core/GameState";
import { scaleNegativeScoreImpact } from "../config/difficulty";
import { getSafetySupport } from "../planning/BudgetPlan";
import { updateScore } from "./ScoreUtils";

export class SafetySystem {
  update(state: GameState): void {
    const criticalBottlenecks = state.labor.pressure.bottlenecks.filter(
      (bottleneck) => bottleneck.pressure === "critical",
    ).length;
    const queuePressure =
      state.freightFlow.queues.yardTrailers * 0.08 +
      state.freightFlow.queues.unloadTrailers * 0.08 +
      state.freightFlow.queues.storageQueueCubicFeet / 5000 +
      state.freightFlow.queues.pickQueueCubicFeet / 5000 +
      state.freightFlow.queues.loadQueueCubicFeet / 5000;
    const drivers: ScoreDriver[] = [];
    let delta = 0;
    const safetySupport = getSafetySupport(state.planning.currentPlan.budget);

    if (safetySupport > 0) {
      drivers.push({ label: "Safety budget", impact: safetySupport });
      delta += safetySupport;
    }

    if (state.labor.modifiers.managementPressure === "healthy") {
      drivers.push({ label: "Management coordination", impact: 0.05 });
      delta += 0.05;
    } else {
      const impact = scaleNegativeScoreImpact(
        state.labor.modifiers.managementPressure === "critical" ? -0.45 : -0.2,
        state.difficultyModeId,
      );
      drivers.push({ label: "Management pressure", impact });
      delta += impact;
    }

    if (state.scores.condition.value < 70) {
      const impact = scaleNegativeScoreImpact(
        -((70 - state.scores.condition.value) / 70) * 0.5,
        state.difficultyModeId,
      );
      drivers.push({ label: "Warehouse condition", impact });
      delta += impact;
    }

    if (state.labor.modifiers.sanitationPressure !== "healthy") {
      const impact = scaleNegativeScoreImpact(
        state.labor.modifiers.sanitationPressure === "critical" ? -0.5 : -0.2,
        state.difficultyModeId,
      );
      drivers.push({ label: "Sanitation pressure", impact });
      delta += impact;
    }

    if (criticalBottlenecks > 0) {
      const impact = scaleNegativeScoreImpact(
        -criticalBottlenecks * 0.25,
        state.difficultyModeId,
      );
      drivers.push({ label: "Critical labor pressure", impact });
      delta += impact;
    }

    if (queuePressure > 0) {
      const impact = scaleNegativeScoreImpact(
        -Math.min(0.4, queuePressure * 0.12),
        state.difficultyModeId,
      );
      drivers.push({ label: "Congestion risk", impact });
      delta += impact;
    }

    updateScore(state.scores.safety, delta, drivers);
  }
}
