import { clamp } from "../../shared/utils/clamp";
import type { ActiveContract, GameState } from "../core/GameState";
import { getDifficultyModeById } from "../config/difficulty";
import { getMonthIndex } from "../core/GameState";

const TICKS_PER_DAY = 1440;

export class ContractSystem {
  update(state: GameState): void {
    this.expireCompletedContracts(state);

    if (state.contracts.activeContracts.length === 0) {
      state.contracts.fulfilledDemandCubicFeet = 0;
      state.contracts.missedDemandCubicFeet = 0;
      state.contracts.serviceLevel = 100;
      return;
    }

    const difficultyMultiplier = getDifficultyModeById(
      state.difficultyModeId,
    ).serviceTargetMultiplier;
    let totalExpectedThroughput = 0;
    let totalActualThroughput = 0;

    for (const contract of state.contracts.activeContracts) {
      const expectedThroughput =
        contract.targetThroughputCubicFeetPerDay *
        getElapsedContractDays(state, contract) *
        difficultyMultiplier;
      const actualThroughput = getActualContractThroughput(state, contract);
      const serviceLevel =
        expectedThroughput <= 0
          ? 100
          : clamp((actualThroughput / expectedThroughput) * 100, 0, 100);

      contract.serviceLevel = serviceLevel;
      contract.health = calculateContractHealth(contract, serviceLevel);
      contract.performanceScore = calculatePerformanceScore(
        contract,
        state,
        actualThroughput,
        expectedThroughput,
      );

      totalExpectedThroughput += expectedThroughput;
      totalActualThroughput += actualThroughput;
    }

    state.contracts.fulfilledDemandCubicFeet = Math.round(totalActualThroughput);
    state.contracts.missedDemandCubicFeet = Math.max(
      0,
      Math.round(totalExpectedThroughput - totalActualThroughput),
    );
    state.contracts.serviceLevel =
      totalExpectedThroughput <= 0
        ? 100
        : clamp((totalActualThroughput / totalExpectedThroughput) * 100, 0, 100);
  }

  private expireCompletedContracts(state: GameState): void {
    const currentMonthIndex = getMonthIndex(state.calendar);
    const remainingContracts: ActiveContract[] = [];

    for (const contract of state.contracts.activeContracts) {
      if (currentMonthIndex > contract.endMonthIndex) {
        state.contracts.completedContracts.push(contract);
        continue;
      }

      remainingContracts.push(contract);
    }

    state.contracts.activeContracts = remainingContracts;
  }
}

function calculateContractHealth(
  contract: ActiveContract,
  serviceLevel: number,
): ActiveContract["health"] {
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

function calculatePerformanceScore(
  contract: ActiveContract,
  state: GameState,
  actualThroughput: number,
  expectedThroughput: number,
): number {
  const throughputAchievement =
    expectedThroughput <= 0 ? 100 : clamp((actualThroughput / expectedThroughput) * 100, 0, 100);
  const dwellPenaltyAvoidance = clamp(100 - contract.penaltyCostToDate / 50, 0, 100);
  const clientSatisfactionContribution = state.scores.clientSatisfaction.value;
  const safetyModifier = state.scores.safety.value;

  return clamp(
    throughputAchievement * 0.35 +
      contract.serviceLevel * 0.25 +
      dwellPenaltyAvoidance * 0.15 +
      clientSatisfactionContribution * 0.15 +
      safetyModifier * 0.1,
    0,
    100,
  );
}

function getElapsedContractDays(state: GameState, contract: ActiveContract): number {
  return Math.max(1 / TICKS_PER_DAY, (state.currentTick - contract.acceptedTick + 1) / TICKS_PER_DAY);
}

function getActualContractThroughput(state: GameState, contract: ActiveContract): number {
  const inboundThroughput = state.freightFlow.freightBatches
    .filter(
      (batch) =>
        batch.contractId === contract.id &&
        batch.unloadedTick !== null &&
        batch.unloadedTick >= contract.acceptedTick,
    )
    .reduce((total, batch) => total + batch.cubicFeet, 0);
  const outboundThroughput = state.freightFlow.outboundOrders
    .filter(
      (order) =>
        order.contractId === contract.id &&
        order.state === "complete" &&
        order.revenueRecognizedTick !== null &&
        order.revenueRecognizedTick >= contract.acceptedTick,
    )
    .reduce((total, order) => total + order.fulfilledCubicFeet, 0);

  return (inboundThroughput + outboundThroughput) / 2;
}
