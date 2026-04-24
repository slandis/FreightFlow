import difficultyModes from "../../../data/config/difficultyModes.json";
import { clamp } from "../../shared/utils/clamp";

export interface DifficultyModeConfig {
  id: string;
  name: string;
  startingCash: number;
  initialHeadcount: number;
  forecastAccuracy: number;
  demandVolatility: number;
  inboundIntervalMultiplier: number;
  inboundYardDwellMinTicks: number;
  inboundYardDwellMaxTicks: number;
  inboundVolumeMultiplier: number;
  outboundIntervalMultiplier: number;
  outboundVolumeMultiplier: number;
  scoreDecayMultiplier: number;
  serviceTargetMultiplier: number;
}

const configuredModes = difficultyModes as DifficultyModeConfig[];
const difficultyModeById = new Map(
  configuredModes.map((mode) => [mode.id, mode] as const),
);

export const DEFAULT_DIFFICULTY_MODE_ID = "standard";
export const APP_DEFAULT_DIFFICULTY_MODE_ID = "relaxed";

export function getDifficultyModes(): readonly DifficultyModeConfig[] {
  return configuredModes;
}

export function getDifficultyModeById(
  difficultyModeId?: string | null,
): DifficultyModeConfig {
  return (
    difficultyModeById.get(difficultyModeId ?? "") ??
    difficultyModeById.get(DEFAULT_DIFFICULTY_MODE_ID) ??
    configuredModes[0]
  );
}

export function scaleNegativeScoreImpact(
  impact: number,
  difficultyModeId?: string | null,
): number {
  if (impact >= 0) {
    return impact;
  }

  return impact * getDifficultyModeById(difficultyModeId).scoreDecayMultiplier;
}

export function applyDemandVolatility(
  baseValue: number,
  difficultyModeId: string | null | undefined,
  randomValue: number,
  minimum: number,
  maximum: number,
): number {
  const volatility = getDifficultyModeById(difficultyModeId).demandVolatility;
  const multiplier = 1 + (randomValue * 2 - 1) * volatility;

  return clamp(Math.round(baseValue * multiplier), minimum, maximum);
}
