import type { DifficultyModeConfig } from "../config/difficulty";
import type { ActiveContract } from "../core/GameState";

const MONTH_TICKS = 30 * 24;
const INBOUND_TARGET_MIN_FACTOR = 0.7;
const INBOUND_TARGET_MAX_FACTOR = 1.3;
const MIN_INBOUND_CUBIC_FEET = 400;
const MAX_INBOUND_CUBIC_FEET = 5000;

export interface ContractInboundCubeBand {
  minCubicFeet: number;
  maxCubicFeet: number;
  targetCubicFeet: number;
  expectedSpawnsPerMonth: number;
}

export function getAverageInboundIntervalForContract(
  contract: Pick<ActiveContract, "inboundIntervalMinTicks" | "inboundIntervalMaxTicks">,
  difficultyMode: DifficultyModeConfig,
): number {
  const averageBaseInterval =
    (contract.inboundIntervalMinTicks + contract.inboundIntervalMaxTicks) / 2;

  return Math.max(1, averageBaseInterval * difficultyMode.inboundIntervalMultiplier);
}

export function getInboundCubeBandForContract(
  contract: Pick<
    ActiveContract,
    | "expectedMonthlyThroughputCubicFeet"
    | "inboundIntervalMinTicks"
    | "inboundIntervalMaxTicks"
  >,
  difficultyMode: DifficultyModeConfig,
): ContractInboundCubeBand {
  const averageInterval = getAverageInboundIntervalForContract(contract, difficultyMode);
  const expectedSpawnsPerMonth = Math.max(1, MONTH_TICKS / averageInterval);
  const rawTargetCubicFeet =
    contract.expectedMonthlyThroughputCubicFeet / expectedSpawnsPerMonth;
  const difficultyScaledTarget = Math.round(
    rawTargetCubicFeet * difficultyMode.inboundVolumeMultiplier,
  );
  const targetCubicFeet = clampInboundCubicFeet(difficultyScaledTarget);

  return {
    minCubicFeet: clampInboundCubicFeet(
      Math.round(targetCubicFeet * INBOUND_TARGET_MIN_FACTOR),
    ),
    maxCubicFeet: clampInboundCubicFeet(
      Math.round(targetCubicFeet * INBOUND_TARGET_MAX_FACTOR),
    ),
    targetCubicFeet,
    expectedSpawnsPerMonth,
  };
}

function clampInboundCubicFeet(value: number): number {
  return Math.max(MIN_INBOUND_CUBIC_FEET, Math.min(MAX_INBOUND_CUBIC_FEET, value));
}
