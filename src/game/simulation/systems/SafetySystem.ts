import type { GameState, ScoreDriver } from "../core/GameState";
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

    if (state.labor.modifiers.managementPressure === "healthy") {
      drivers.push({ label: "Management coordination", impact: 0.05 });
      delta += 0.05;
    } else {
      const impact = state.labor.modifiers.managementPressure === "critical" ? -0.45 : -0.2;
      drivers.push({ label: "Management pressure", impact });
      delta += impact;
    }

    if (state.scores.condition.value < 70) {
      const impact = -((70 - state.scores.condition.value) / 70) * 0.5;
      drivers.push({ label: "Warehouse condition", impact });
      delta += impact;
    }

    if (state.labor.modifiers.sanitationPressure !== "healthy") {
      const impact = state.labor.modifiers.sanitationPressure === "critical" ? -0.5 : -0.2;
      drivers.push({ label: "Sanitation pressure", impact });
      delta += impact;
    }

    if (criticalBottlenecks > 0) {
      const impact = -criticalBottlenecks * 0.25;
      drivers.push({ label: "Critical labor pressure", impact });
      delta += impact;
    }

    if (queuePressure > 0) {
      const impact = -Math.min(0.4, queuePressure * 0.12);
      drivers.push({ label: "Congestion risk", impact });
      delta += impact;
    }

    updateScore(state.scores.safety, delta, drivers);
  }
}
