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
    inboundMinTicks: 72,
    inboundMaxTicks: 144,
    outboundMinTicks: 102,
    outboundMaxTicks: 174,
  },
  speed: {
    inboundMinTicks: 54,
    inboundMaxTicks: 132,
    outboundMinTicks: 64,
    outboundMaxTicks: 132,
  },
  specialization: {
    inboundMinTicks: 108,
    inboundMaxTicks: 180,
    outboundMinTicks: 111,
    outboundMaxTicks: 183,
  },
  margin: {
    inboundMinTicks: 108,
    inboundMaxTicks: 180,
    outboundMinTicks: 111,
    outboundMaxTicks: 183,
  },
  consistency: {
    inboundMinTicks: 90,
    inboundMaxTicks: 162,
    outboundMinTicks: 85,
    outboundMaxTicks: 157,
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
