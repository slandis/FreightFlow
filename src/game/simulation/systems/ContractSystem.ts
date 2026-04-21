import type { ContractSummary, GameState } from "../core/GameState";
import { getDifficultyModeById } from "../config/difficulty";
import { clamp } from "../../shared/utils/clamp";

const TICKS_PER_DAY = 1440;

export class ContractSystem {
  update(state: GameState): void {
    const contract = state.contracts.activeContracts[0];

    if (!contract) {
      return;
    }

    const completedDays = Math.max(0, state.calendar.day - 1);
    const elapsedDayFraction = state.currentTick / TICKS_PER_DAY;
    const targetDays = Math.max(completedDays, elapsedDayFraction >= 1 ? elapsedDayFraction : 0);
    const expectedThroughput =
      contract.targetThroughputCubicFeetPerDay *
      targetDays *
      getDifficultyModeById(state.difficultyModeId).serviceTargetMultiplier;
    const fulfilledDemandCubicFeet =
      (state.freightFlow.metrics.totalUnloadedCubicFeet +
        state.freightFlow.metrics.totalOutboundCubicFeetShipped) /
      2;
    const serviceLevel =
      expectedThroughput <= 0
        ? 100
        : clamp((fulfilledDemandCubicFeet / expectedThroughput) * 100, 0, 100);

    state.contracts.fulfilledDemandCubicFeet = fulfilledDemandCubicFeet;
    state.contracts.missedDemandCubicFeet = Math.max(0, expectedThroughput - fulfilledDemandCubicFeet);
    state.contracts.serviceLevel = serviceLevel;
    contract.health = calculateContractHealth(contract, serviceLevel);
  }
}

function calculateContractHealth(
  contract: ContractSummary,
  serviceLevel: number,
): ContractSummary["health"] {
  if (serviceLevel < contract.minimumServiceLevel * 0.65) {
    return "critical";
  }

  if (serviceLevel < contract.minimumServiceLevel) {
    return "at-risk";
  }

  if (serviceLevel < 95) {
    return "stable";
  }

  return "healthy";
}
