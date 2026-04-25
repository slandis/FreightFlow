import type { DifficultyModeConfig } from "../config/difficulty";
import type { ActiveContract, ContractDifficultyTag, ContractOffer, GameState } from "../core/GameState";
import type { RandomService } from "../core/RandomService";

const OUTBOUND_RETRY_MIN_TICKS = 15;
const OUTBOUND_RETRY_MAX_TICKS = 40;

interface ContractTimingBand {
  inboundMinTicks: number;
  inboundMaxTicks: number;
  outboundMinTicks: number;
  outboundMaxTicks: number;
}

const timingBandsByDifficultyTag: Record<ContractDifficultyTag, ContractTimingBand> = {
  capacity: {
    inboundMinTicks: 60,
    inboundMaxTicks: 120,
    outboundMinTicks: 120,
    outboundMaxTicks: 205,
  },
  speed: {
    inboundMinTicks: 45,
    inboundMaxTicks: 110,
    outboundMinTicks: 75,
    outboundMaxTicks: 155,
  },
  specialization: {
    inboundMinTicks: 90,
    inboundMaxTicks: 150,
    outboundMinTicks: 130,
    outboundMaxTicks: 215,
  },
  margin: {
    inboundMinTicks: 90,
    inboundMaxTicks: 150,
    outboundMinTicks: 130,
    outboundMaxTicks: 215,
  },
  consistency: {
    inboundMinTicks: 75,
    inboundMaxTicks: 135,
    outboundMinTicks: 100,
    outboundMaxTicks: 185,
  },
};

export function getContractTimingBand(
  difficultyTag: ContractDifficultyTag,
): ContractTimingBand {
  return timingBandsByDifficultyTag[difficultyTag];
}

export function createOfferScheduleFields(
  difficultyTag: ContractDifficultyTag,
): Pick<
  ContractOffer,
  | "inboundIntervalMinTicks"
  | "inboundIntervalMaxTicks"
  | "outboundIntervalMinTicks"
  | "outboundIntervalMaxTicks"
> {
  const band = getContractTimingBand(difficultyTag);

  return {
    inboundIntervalMinTicks: band.inboundMinTicks,
    inboundIntervalMaxTicks: band.inboundMaxTicks,
    outboundIntervalMinTicks: band.outboundMinTicks,
    outboundIntervalMaxTicks: band.outboundMaxTicks,
  };
}

export function rollNextInboundEligibleTick(
  currentTick: number,
  contract: Pick<ActiveContract, "inboundIntervalMinTicks" | "inboundIntervalMaxTicks">,
  difficultyMode: DifficultyModeConfig,
  random: RandomService,
): number {
  return currentTick + rollDifficultyScaledInterval(
    contract.inboundIntervalMinTicks,
    contract.inboundIntervalMaxTicks,
    difficultyMode.inboundIntervalMultiplier,
    random,
  );
}

export function rollNextOutboundEligibleTick(
  currentTick: number,
  contract: Pick<ActiveContract, "outboundIntervalMinTicks" | "outboundIntervalMaxTicks">,
  difficultyMode: DifficultyModeConfig,
  random: RandomService,
): number {
  return currentTick + rollDifficultyScaledInterval(
    contract.outboundIntervalMinTicks,
    contract.outboundIntervalMaxTicks,
    difficultyMode.outboundIntervalMultiplier,
    random,
  );
}

export function rollOutboundRetryTick(
  currentTick: number,
  random: RandomService,
): number {
  return currentTick + random.nextInt(OUTBOUND_RETRY_MIN_TICKS, OUTBOUND_RETRY_MAX_TICKS);
}

export function normalizeActiveContractSchedules(
  state: GameState,
  difficultyMode: DifficultyModeConfig,
  random: RandomService,
): void {
  for (const contract of state.contracts.activeContracts) {
    const timing = createOfferScheduleFields(contract.difficultyTag);
    contract.inboundIntervalMinTicks ??= timing.inboundIntervalMinTicks;
    contract.inboundIntervalMaxTicks ??= timing.inboundIntervalMaxTicks;
    contract.outboundIntervalMinTicks ??= timing.outboundIntervalMinTicks;
    contract.outboundIntervalMaxTicks ??= timing.outboundIntervalMaxTicks;
    if (
      !Number.isFinite(contract.nextInboundEligibleTick) ||
      contract.nextInboundEligibleTick <= 0
    ) {
      contract.nextInboundEligibleTick = rollNextInboundEligibleTick(
        state.currentTick,
        contract,
        difficultyMode,
        random,
      );
    }

    if (
      !Number.isFinite(contract.nextOutboundEligibleTick) ||
      contract.nextOutboundEligibleTick <= 0
    ) {
      contract.nextOutboundEligibleTick = rollNextOutboundEligibleTick(
        state.currentTick,
        contract,
        difficultyMode,
        random,
      );
    }
  }
}

function rollDifficultyScaledInterval(
  minTicks: number,
  maxTicks: number,
  multiplier: number,
  random: RandomService,
): number {
  const rolledTicks = random.nextInt(minTicks, maxTicks);
  return Math.max(1, Math.round(rolledTicks * multiplier));
}
