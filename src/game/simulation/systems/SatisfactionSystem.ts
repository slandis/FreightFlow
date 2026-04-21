import type { GameState, ScoreDriver } from "../core/GameState";
import { scaleNegativeScoreImpact } from "../config/difficulty";
import { updateScore } from "./ScoreUtils";

export class SatisfactionSystem {
  update(state: GameState): void {
    this.updateClientSatisfaction(state);
    this.updateCustomerSatisfaction(state);
  }

  private updateClientSatisfaction(state: GameState): void {
    const drivers: ScoreDriver[] = [];
    let delta = 0.03;
    drivers.push({ label: "Baseline service stability", impact: 0.03 });

    if (state.freightFlow.queues.storageQueueCubicFeet > 0) {
      const impact = scaleNegativeScoreImpact(
        -Math.min(0.7, state.freightFlow.queues.storageQueueCubicFeet / 4000),
        state.difficultyModeId,
      );
      drivers.push({ label: "Dock storage pressure", impact });
      delta += impact;
    }

    if (state.labor.pressure.topBottleneck?.pressure === "critical") {
      const impact = scaleNegativeScoreImpact(-0.25, state.difficultyModeId);
      drivers.push({ label: "Critical bottleneck", impact });
      delta += impact;
    }

    if (state.scores.condition.value < 70) {
      const impact = scaleNegativeScoreImpact(
        -((70 - state.scores.condition.value) / 70) * 0.3,
        state.difficultyModeId,
      );
      drivers.push({ label: "Warehouse condition", impact });
      delta += impact;
    }

    if (state.contracts.serviceLevel < 80) {
      const impact = scaleNegativeScoreImpact(
        -((80 - state.contracts.serviceLevel) / 80) * 0.45,
        state.difficultyModeId,
      );
      drivers.push({ label: "Service level below target", impact });
      delta += impact;
    }

    updateScore(state.scores.clientSatisfaction, delta, drivers);
  }

  private updateCustomerSatisfaction(state: GameState): void {
    const blockedOrders = state.freightFlow.outboundOrders.filter(
      (order) => order.state === "blocked",
    ).length;
    const overdueOrders = state.freightFlow.outboundOrders.filter(
      (order) => order.state !== "complete" && order.dueTick < state.currentTick,
    ).length;
    const drivers: ScoreDriver[] = [];
    let delta = 0.03;
    drivers.push({ label: "Baseline shipment service", impact: 0.03 });

    if (blockedOrders > 0) {
      const impact = scaleNegativeScoreImpact(
        -Math.min(0.8, blockedOrders * 0.25),
        state.difficultyModeId,
      );
      drivers.push({ label: "Blocked outbound orders", impact });
      delta += impact;
    }

    if (overdueOrders > 0) {
      const impact = scaleNegativeScoreImpact(
        -Math.min(0.8, overdueOrders * 0.25),
        state.difficultyModeId,
      );
      drivers.push({ label: "Overdue outbound orders", impact });
      delta += impact;
    }

    if (state.freightFlow.queues.loadQueueCubicFeet > 0) {
      const impact = scaleNegativeScoreImpact(
        -Math.min(0.4, state.freightFlow.queues.loadQueueCubicFeet / 5000),
        state.difficultyModeId,
      );
      drivers.push({ label: "Load queue pressure", impact });
      delta += impact;
    }

    if (state.scores.safety.value < 75) {
      const impact = scaleNegativeScoreImpact(
        -((75 - state.scores.safety.value) / 75) * 0.35,
        state.difficultyModeId,
      );
      drivers.push({ label: "Safety score", impact });
      delta += impact;
    }

    if (state.scores.condition.value < 70) {
      const impact = scaleNegativeScoreImpact(
        -((70 - state.scores.condition.value) / 70) * 0.25,
        state.difficultyModeId,
      );
      drivers.push({ label: "Warehouse condition", impact });
      delta += impact;
    }

    updateScore(state.scores.customerSatisfaction, delta, drivers);
  }
}
