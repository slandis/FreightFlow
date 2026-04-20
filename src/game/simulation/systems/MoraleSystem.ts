import type { GameState, ScoreDriver } from "../core/GameState";
import { updateScore } from "./ScoreUtils";

export class MoraleSystem {
  update(state: GameState): void {
    const criticalBottlenecks = state.labor.pressure.bottlenecks.filter(
      (bottleneck) => bottleneck.pressure === "critical",
    ).length;
    const strainedBottlenecks = state.labor.pressure.bottlenecks.filter(
      (bottleneck) => bottleneck.pressure === "strained",
    ).length;
    const drivers: ScoreDriver[] = [];
    let delta = 0;

    if (state.labor.modifiers.managementPressure === "healthy") {
      drivers.push({ label: "Management support", impact: 0.08 });
      delta += 0.08;
    } else {
      const impact = state.labor.modifiers.managementPressure === "critical" ? -0.8 : -0.35;
      drivers.push({ label: "Management understaffed", impact });
      delta += impact;
    }

    if (criticalBottlenecks > 0) {
      const impact = -criticalBottlenecks * 0.45;
      drivers.push({ label: "Critical labor bottlenecks", impact });
      delta += impact;
    }

    if (strainedBottlenecks > 0) {
      const impact = -strainedBottlenecks * 0.15;
      drivers.push({ label: "Strained workload", impact });
      delta += impact;
    }

    if (state.scores.condition.value < 60) {
      const impact = -((60 - state.scores.condition.value) / 60) * 0.35;
      drivers.push({ label: "Warehouse condition", impact });
      delta += impact;
    }

    if (state.scores.safety.value < 70) {
      const impact = -((70 - state.scores.safety.value) / 70) * 0.3;
      drivers.push({ label: "Safety concerns", impact });
      delta += impact;
    }

    if (state.cash < 25000) {
      drivers.push({ label: "Cash stress", impact: -0.25 });
      delta -= 0.25;
    }

    updateScore(state.scores.morale, delta, drivers);
  }
}
