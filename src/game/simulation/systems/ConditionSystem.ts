import type { GameState, ScoreDriver } from "../core/GameState";
import { scaleNegativeScoreImpact } from "../config/difficulty";
import { getMaintenanceSupport } from "../planning/BudgetPlan";
import {
  getAssignedInventoryTeamHeadcount,
  getInventorySupportRecommendationForActiveContracts,
} from "../planning/inventorySupport";
import { updateScore } from "./ScoreUtils";

export class ConditionSystem {
  update(state: GameState): void {
    const storageCapacity = state.warehouseMap.zones
      .filter((zone) => zone.capacityCubicFeet > 0)
      .reduce((total, zone) => total + zone.capacityCubicFeet, 0);
    const storageUsed = state.warehouseMap.zones
      .filter((zone) => zone.capacityCubicFeet > 0)
      .reduce((total, zone) => total + zone.usedCubicFeet, 0);
    const storageUtilization = storageCapacity > 0 ? storageUsed / storageCapacity : 0;
    const invalidStorageZones = state.warehouseMap.zones.filter(
      (zone) => zone.capacityCubicFeet > 0 && !zone.validForStorage,
    ).length;
    const queuePressure =
      state.freightFlow.queues.storageQueueCubicFeet / 3000 +
      state.freightFlow.queues.pickQueueCubicFeet / 3000 +
      state.freightFlow.queues.loadQueueCubicFeet / 3000;
    const drivers: ScoreDriver[] = [];
    let delta = 0;
    const maintenanceSupport = getMaintenanceSupport(state.planning.currentPlan.budget);
    const inventoryRecommendation = getInventorySupportRecommendationForActiveContracts(state);
    const inventoryHeadcount = getAssignedInventoryTeamHeadcount(state);
    const inventoryBudgetTarget = inventoryRecommendation.suggestedBudgetPoints;
    const inventoryBudgetCoverage =
      inventoryBudgetTarget > 0
        ? Math.min(1, state.planning.currentPlan.budget.inventorySupport / inventoryBudgetTarget)
        : 1;

    if (maintenanceSupport > 0) {
      drivers.push({ label: "Maintenance budget", impact: maintenanceSupport });
      delta += maintenanceSupport;
    }

    if (inventoryRecommendation.suggestedHeadcount > 0 && inventoryHeadcount >= inventoryRecommendation.suggestedHeadcount) {
      drivers.push({ label: "Inventory team coverage", impact: 0.05 });
      delta += 0.05;
    } else if (inventoryRecommendation.suggestedHeadcount > 0) {
      const impact = scaleNegativeScoreImpact(
        -Math.min(
          0.75,
          ((inventoryRecommendation.suggestedHeadcount - inventoryHeadcount) /
            inventoryRecommendation.suggestedHeadcount) *
            0.55,
        ),
        state.difficultyModeId,
      );
      drivers.push({ label: "Inventory team understaffed", impact });
      delta += impact;
    }

    if (inventoryRecommendation.suggestedHeadcount > 0 && inventoryBudgetCoverage >= 1) {
      drivers.push({ label: "Inventory support budget", impact: 0.04 });
      delta += 0.04;
    } else if (inventoryRecommendation.suggestedHeadcount > 0) {
      const impact = scaleNegativeScoreImpact(
        -(1 - inventoryBudgetCoverage) * 0.28,
        state.difficultyModeId,
      );
      drivers.push({ label: "Inventory support underfunded", impact });
      delta += impact;
    }

    if (state.labor.modifiers.sanitationPressure === "healthy") {
      drivers.push({ label: "Sanitation coverage", impact: 0.08 });
      delta += 0.08;
    } else {
      const impact = scaleNegativeScoreImpact(
        state.labor.modifiers.sanitationPressure === "critical" ? -1.4 : -0.55,
        state.difficultyModeId,
      );
      drivers.push({ label: "Sanitation understaffed", impact });
      delta += impact;
    }

    if (state.labor.modifiers.congestionPenalty > 0) {
      const impact = scaleNegativeScoreImpact(
        -state.labor.modifiers.congestionPenalty * 1.8,
        state.difficultyModeId,
      );
      drivers.push({ label: "Congestion pressure", impact });
      delta += impact;
    }

    if (invalidStorageZones > 0) {
      const impact = scaleNegativeScoreImpact(
        -Math.min(0.8, invalidStorageZones * 0.12),
        state.difficultyModeId,
      );
      drivers.push({ label: "Invalid storage zones", impact });
      delta += impact;
    }

    if (storageUtilization > 0.85) {
      const impact = scaleNegativeScoreImpact(
        -(storageUtilization - 0.85) * 2,
        state.difficultyModeId,
      );
      drivers.push({ label: "High storage utilization", impact });
      delta += impact;
    }

    if (queuePressure > 0) {
      const impact = scaleNegativeScoreImpact(
        -Math.min(0.6, queuePressure * 0.15),
        state.difficultyModeId,
      );
      drivers.push({ label: "Queue pressure", impact });
      delta += impact;
    }

    updateScore(state.scores.condition, delta, drivers);
  }
}
