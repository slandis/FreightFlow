import type { GameState, ScoreDriver } from "../core/GameState";
import { scaleNegativeScoreImpact } from "../config/difficulty";
import {
  getAssignedInventoryTeamHeadcount,
  getInventorySupportRecommendationForActiveContracts,
} from "../planning/inventorySupport";
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
    const inventoryRecommendation = getInventorySupportRecommendationForActiveContracts(state);
    const inventoryHeadcount = getAssignedInventoryTeamHeadcount(state);
    const inventoryBudgetTarget = inventoryRecommendation.suggestedBudgetPoints;
    const inventoryBudgetCoverage =
      inventoryBudgetTarget > 0
        ? Math.min(1, state.planning.currentPlan.budget.inventorySupport / inventoryBudgetTarget)
        : 1;

    if (state.labor.modifiers.managementPressure === "healthy") {
      drivers.push({ label: "Management support", impact: 0.08 });
      delta += 0.08;
    } else {
      const impact = scaleNegativeScoreImpact(
        state.labor.modifiers.managementPressure === "critical" ? -0.8 : -0.35,
        state.difficultyModeId,
      );
      drivers.push({ label: "Management understaffed", impact });
      delta += impact;
    }

    if (inventoryRecommendation.suggestedHeadcount > 0 && inventoryHeadcount < inventoryRecommendation.suggestedHeadcount) {
      const impact = scaleNegativeScoreImpact(
        -Math.min(
          0.45,
          ((inventoryRecommendation.suggestedHeadcount - inventoryHeadcount) /
            inventoryRecommendation.suggestedHeadcount) *
            0.3,
        ),
        state.difficultyModeId,
      );
      drivers.push({ label: "Inventory team understaffed", impact });
      delta += impact;
    }

    if (inventoryRecommendation.suggestedHeadcount > 0 && inventoryBudgetCoverage < 1) {
      const impact = scaleNegativeScoreImpact(
        -(1 - inventoryBudgetCoverage) * 0.18,
        state.difficultyModeId,
      );
      drivers.push({ label: "Inventory support underfunded", impact });
      delta += impact;
    }

    if (criticalBottlenecks > 0) {
      const impact = scaleNegativeScoreImpact(
        -criticalBottlenecks * 0.45,
        state.difficultyModeId,
      );
      drivers.push({ label: "Critical labor bottlenecks", impact });
      delta += impact;
    }

    if (strainedBottlenecks > 0) {
      const impact = scaleNegativeScoreImpact(
        -strainedBottlenecks * 0.15,
        state.difficultyModeId,
      );
      drivers.push({ label: "Strained workload", impact });
      delta += impact;
    }

    if (state.scores.condition.value < 60) {
      const impact = scaleNegativeScoreImpact(
        -((60 - state.scores.condition.value) / 60) * 0.35,
        state.difficultyModeId,
      );
      drivers.push({ label: "Warehouse condition", impact });
      delta += impact;
    }

    if (state.scores.safety.value < 70) {
      const impact = scaleNegativeScoreImpact(
        -((70 - state.scores.safety.value) / 70) * 0.3,
        state.difficultyModeId,
      );
      drivers.push({ label: "Safety concerns", impact });
      delta += impact;
    }

    if (state.cash < 25000) {
      const impact = scaleNegativeScoreImpact(-0.25, state.difficultyModeId);
      drivers.push({ label: "Cash stress", impact });
      delta += impact;
    }

    updateScore(state.scores.morale, delta, drivers);
  }
}
