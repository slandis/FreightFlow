import freightClasses from "../../../data/config/freightClasses.json";
import type {
  ActiveContract,
  ContractDifficultyTag,
  ContractOffer,
  ContractOfferAnalysis,
  ContractRiskLevel,
  GameState,
} from "../core/GameState";
import { getMonthIndex } from "../core/GameState";
import type { RandomService } from "../core/RandomService";
import { LaborRole } from "../types/enums";
import { createId } from "../types/ids";

const OFFER_COUNT = 4;
const MONTHS_PER_CONTRACT = [2, 3, 4, 6] as const;
const CLIENT_PREFIXES = [
  "Northline",
  "Blue River",
  "Mercury",
  "Atlas",
  "Summit",
  "Harbor",
  "Keystone",
  "Crescent",
];
const CLIENT_SUFFIXES = [
  "Logistics",
  "Distribution",
  "Supply",
  "Retail Group",
  "Freight Co.",
  "Partners",
];
const CONTRACT_DIFFICULTIES: ContractDifficultyTag[] = [
  "capacity",
  "speed",
  "specialization",
  "margin",
  "consistency",
];
const ROLE_ORDER: LaborRole[] = [
  LaborRole.SwitchDriver,
  LaborRole.Unload,
  LaborRole.Storage,
  LaborRole.Pick,
  LaborRole.Load,
];
const ESTIMATED_LABOR_COST_PER_HEADCOUNT_PER_MONTH = 2 * 1440 * 30;

type FreightClassConfig = (typeof freightClasses)[number];

export function generateMonthlyContractOffers(
  state: GameState,
  monthKey: string,
  random: RandomService,
): ContractOffer[] {
  const offers: ContractOffer[] = [];

  for (let offerIndex = 0; offerIndex < OFFER_COUNT; offerIndex += 1) {
    const freightClass = freightClasses[random.nextInt(0, freightClasses.length - 1)];
    const difficultyTag =
      CONTRACT_DIFFICULTIES[random.nextInt(0, CONTRACT_DIFFICULTIES.length - 1)];
    const expectedMonthlyThroughputCubicFeet = calculateOfferThroughput(
      state,
      freightClass,
      difficultyTag,
      random,
    );
    const lengthMonths =
      MONTHS_PER_CONTRACT[random.nextInt(0, MONTHS_PER_CONTRACT.length - 1)];
    const analysis = buildOfferAnalysis(
      state,
      freightClass,
      expectedMonthlyThroughputCubicFeet,
      difficultyTag,
    );

    offers.push({
      id: createId("contract-offer", state.contracts.nextOfferSequence + offerIndex),
      monthKey,
      clientName: createClientName(random, offerIndex),
      freightClassId: freightClass.id,
      lengthMonths,
      expectedMonthlyThroughputCubicFeet,
      expectedWeeklyThroughputCubicFeet: Math.round(expectedMonthlyThroughputCubicFeet / 4),
      revenuePerCubicFoot: calculateOfferRevenueRate(freightClass, difficultyTag, random),
      minimumServiceLevel: calculateMinimumServiceLevel(difficultyTag, random),
      dwellPenaltyThresholdTicks: calculateDwellPenaltyThreshold(difficultyTag),
      dwellPenaltyRatePerCubicFoot: calculateDwellPenaltyRate(freightClass, difficultyTag),
      difficultyTag,
      operationalChallengeNote: buildOperationalChallengeNote(
        freightClass,
        difficultyTag,
      ),
      forecastRange: {
        minMonthlyCubicFeet: Math.round(expectedMonthlyThroughputCubicFeet * 0.84),
        maxMonthlyCubicFeet: Math.round(expectedMonthlyThroughputCubicFeet * 1.18),
      },
      analysis,
      decision: "undecided",
    });
  }

  state.contracts.nextOfferSequence += offers.length;

  return offers;
}

export function activateAcceptedContractOffers(state: GameState): void {
  const acceptedOffers = state.contracts.pendingOffers.filter(
    (offer) => offer.decision === "accepted",
  );

  if (acceptedOffers.length === 0) {
    state.contracts.pendingOffers = [];
    return;
  }

  const acceptedMonthIndex = getMonthIndex(state.calendar);

  for (const offer of acceptedOffers) {
    const activeContract: ActiveContract = {
      id: createId("contract", state.contracts.nextActiveContractSequence),
      name: `${offer.clientName} ${getFreightClassName(offer.freightClassId)}`,
      clientName: offer.clientName,
      freightClassId: offer.freightClassId,
      acceptedMonthKey: offer.monthKey,
      acceptedTick: state.currentTick,
      acceptedMonthIndex,
      endMonthIndex: acceptedMonthIndex + offer.lengthMonths - 1,
      lengthMonths: offer.lengthMonths,
      expectedMonthlyThroughputCubicFeet: offer.expectedMonthlyThroughputCubicFeet,
      revenuePerCubicFoot: offer.revenuePerCubicFoot,
      targetThroughputCubicFeetPerDay: Math.max(
        1,
        Math.round(offer.expectedMonthlyThroughputCubicFeet / 30),
      ),
      minimumServiceLevel: offer.minimumServiceLevel,
      dwellPenaltyThresholdTicks: offer.dwellPenaltyThresholdTicks,
      dwellPenaltyRatePerCubicFoot: offer.dwellPenaltyRatePerCubicFoot,
      difficultyTag: offer.difficultyTag,
      operationalChallengeNote: offer.operationalChallengeNote,
      health: "stable",
      serviceLevel: 100,
      performanceScore: 100,
      penaltyCostToDate: 0,
      lastPenaltyTick: null,
    };

    state.contracts.nextActiveContractSequence += 1;
    state.contracts.activeContracts.push(activeContract);
  }

  state.contracts.pendingOffers = [];
}

function calculateOfferThroughput(
  state: GameState,
  freightClass: FreightClassConfig,
  difficultyTag: ContractDifficultyTag,
  random: RandomService,
): number {
  const currentPortfolioMonthly = state.contracts.activeContracts.reduce(
    (total, contract) => total + contract.expectedMonthlyThroughputCubicFeet,
    0,
  );
  const compatibleCapacity = getCompatibleStorageCapacity(state, freightClass);
  const capacityBound = Math.max(90000, compatibleCapacity * 6);
  const portfolioAnchor = currentPortfolioMonthly <= 0 ? 180000 : currentPortfolioMonthly * 0.38;
  const difficultyMultiplier = getDifficultyThroughputMultiplier(difficultyTag);
  const variance = 0.88 + random.next() * 0.26;

  return Math.max(
    45000,
    Math.min(
      Math.round(portfolioAnchor * difficultyMultiplier * variance),
      Math.round(capacityBound),
    ),
  );
}

function calculateOfferRevenueRate(
  freightClass: FreightClassConfig,
  difficultyTag: ContractDifficultyTag,
  random: RandomService,
): number {
  const rateMultiplier =
    {
      capacity: 0.95,
      speed: 1.12,
      specialization: 1.2,
      margin: 0.84,
      consistency: 1,
    }[difficultyTag] ?? 1;

  return roundCurrency(
    freightClass.baseRevenuePerCubicFoot * rateMultiplier * (0.94 + random.next() * 0.14),
  );
}

function calculateMinimumServiceLevel(
  difficultyTag: ContractDifficultyTag,
  random: RandomService,
): number {
  const baseline =
    {
      capacity: 78,
      speed: 88,
      specialization: 84,
      margin: 82,
      consistency: 90,
    }[difficultyTag] ?? 82;

  return Math.min(97, Math.max(72, Math.round(baseline + random.nextInt(-2, 3))));
}

function calculateDwellPenaltyThreshold(difficultyTag: ContractDifficultyTag): number {
  switch (difficultyTag) {
    case "speed":
      return 720;
    case "consistency":
      return 960;
    case "specialization":
      return 1080;
    case "capacity":
      return 1440;
    case "margin":
      return 1320;
  }
}

function calculateDwellPenaltyRate(
  freightClass: FreightClassConfig,
  difficultyTag: ContractDifficultyTag,
): number {
  const difficultyRate =
    {
      capacity: 0.012,
      speed: 0.05,
      specialization: 0.032,
      margin: 0.018,
      consistency: 0.038,
    }[difficultyTag] ?? 0.02;

  return roundCurrency(difficultyRate + freightClass.baseRevenuePerCubicFoot * 0.03);
}

function buildOperationalChallengeNote(
  freightClass: FreightClassConfig,
  difficultyTag: ContractDifficultyTag,
): string {
  switch (difficultyTag) {
    case "capacity":
      return `${freightClass.name} volume is attractive, but compatible storage will stay busy all month.`;
    case "speed":
      return `${freightClass.name} pays for fast turns and punishes slow yard-to-door movement.`;
    case "specialization":
      return `${freightClass.name} is profitable, but it leans on a narrower storage footprint.`;
    case "margin":
      return `${freightClass.name} is a thinner-margin account that rewards disciplined labor usage.`;
    case "consistency":
      return `${freightClass.name} needs reliable weekly performance more than dramatic peak output.`;
  }
}

function buildOfferAnalysis(
  state: GameState,
  freightClass: FreightClassConfig,
  expectedMonthlyThroughputCubicFeet: number,
  difficultyTag: ContractDifficultyTag,
): ContractOfferAnalysis {
  const compatibleCapacity = getCompatibleStorageCapacity(state, freightClass);
  const expectedAdditionalHeadcountByRole = estimateAdditionalHeadcount(
    expectedMonthlyThroughputCubicFeet,
    difficultyTag,
  );
  const totalExpectedHeadcount = Object.values(expectedAdditionalHeadcountByRole).reduce(
    (total, headcount) => total + headcount,
    0,
  );
  const storageCapacityRisk = classifyRisk(
    compatibleCapacity <= 0 ? 1 : expectedMonthlyThroughputCubicFeet / compatibleCapacity,
    0.9,
    1.6,
  );
  const laborCapacityRisk = classifyRisk(
    totalExpectedHeadcount / Math.max(1, state.labor.unassignedHeadcount + 1),
    0.7,
    1.15,
  );
  const budgetPressure = classifyRisk(
    totalExpectedHeadcount / Math.max(2, state.labor.totalHeadcount / 5),
    0.8,
    1.4,
  );
  const recommendedStorageZoneTypes = [...freightClass.compatibleZoneTypes];
  const estimatedMonthlyLaborCostDelta =
    totalExpectedHeadcount * ESTIMATED_LABOR_COST_PER_HEADCOUNT_PER_MONTH;
  const estimatedMonthlyOperatingCostDelta = roundCurrency(
    expectedMonthlyThroughputCubicFeet *
      {
        capacity: 0.008,
        speed: 0.014,
        specialization: 0.018,
        margin: 0.006,
        consistency: 0.01,
      }[difficultyTag],
  );
  const notes = [
    buildHeadcountNote(expectedAdditionalHeadcountByRole),
    buildStorageRiskNote(storageCapacityRisk, freightClass),
    buildBudgetRiskNote(budgetPressure),
  ];

  return {
    recommendedStorageZoneTypes,
    expectedAdditionalHeadcountByRole,
    storageCapacityRisk,
    laborCapacityRisk,
    budgetPressure,
    estimatedMonthlyLaborCostDelta,
    estimatedMonthlyOperatingCostDelta,
    notes,
  };
}

function estimateAdditionalHeadcount(
  expectedMonthlyThroughputCubicFeet: number,
  difficultyTag: ContractDifficultyTag,
): Partial<Record<LaborRole, number>> {
  const throughputFactor = expectedMonthlyThroughputCubicFeet / 120000;
  const rolePressureBias =
    {
      capacity: { storage: 1.2, unload: 1, pick: 0.8, load: 0.8, switch: 0.8 },
      speed: { storage: 0.9, unload: 1.2, pick: 1.1, load: 1.2, switch: 1 },
      specialization: { storage: 1.1, unload: 1, pick: 1, load: 1, switch: 0.8 },
      margin: { storage: 0.8, unload: 0.8, pick: 0.8, load: 0.8, switch: 0.7 },
      consistency: { storage: 1, unload: 1, pick: 1, load: 1, switch: 0.9 },
    }[difficultyTag];
  const labor: Partial<Record<LaborRole, number>> = {};

  for (const roleId of ROLE_ORDER) {
    const roleKey = mapRoleToBiasKey(roleId);
    const bias = rolePressureBias[roleKey];
    const estimate = Math.max(0, Math.round(throughputFactor * bias - 0.35));

    if (estimate > 0) {
      labor[roleId] = estimate;
    }
  }

  return labor;
}

function mapRoleToBiasKey(roleId: LaborRole): "switch" | "unload" | "storage" | "pick" | "load" {
  switch (roleId) {
    case LaborRole.SwitchDriver:
      return "switch";
    case LaborRole.Unload:
      return "unload";
    case LaborRole.Storage:
      return "storage";
    case LaborRole.Pick:
      return "pick";
    case LaborRole.Load:
      return "load";
    case LaborRole.Sanitation:
    case LaborRole.Management:
      return "storage";
  }
}

function getDifficultyThroughputMultiplier(difficultyTag: ContractDifficultyTag): number {
  switch (difficultyTag) {
    case "capacity":
      return 1.24;
    case "speed":
      return 0.86;
    case "specialization":
      return 0.94;
    case "margin":
      return 1.1;
    case "consistency":
      return 0.92;
  }
}

function createClientName(random: RandomService, offerIndex: number): string {
  const prefix = CLIENT_PREFIXES[random.nextInt(0, CLIENT_PREFIXES.length - 1)];
  const suffix = CLIENT_SUFFIXES[(offerIndex + random.nextInt(0, CLIENT_SUFFIXES.length - 1)) % CLIENT_SUFFIXES.length];

  return `${prefix} ${suffix}`;
}

function getCompatibleStorageCapacity(
  state: GameState,
  freightClass: FreightClassConfig,
): number {
  const compatibleZoneTypes = new Set(freightClass.compatibleZoneTypes);

  return state.warehouseMap.zones
    .filter((zone) => zone.validForStorage && compatibleZoneTypes.has(zone.zoneType))
    .reduce((total, zone) => total + Math.max(0, zone.capacityCubicFeet - zone.usedCubicFeet), 0);
}

function getFreightClassName(freightClassId: string): string {
  return freightClasses.find((freightClass) => freightClass.id === freightClassId)?.name ??
    "Freight Contract";
}

function classifyRisk(
  ratio: number,
  moderateThreshold: number,
  highThreshold: number,
): ContractRiskLevel {
  if (ratio >= highThreshold) {
    return "high";
  }

  if (ratio >= moderateThreshold) {
    return "moderate";
  }

  return "low";
}

function buildHeadcountNote(
  headcountByRole: Partial<Record<LaborRole, number>>,
): string {
  const entries = Object.entries(headcountByRole);

  if (entries.length === 0) {
    return "Current headcount should absorb this contract if flow stays balanced.";
  }

  return `Plan for ${entries
    .map(([roleId, headcount]) => `${headcount} ${roleId.replace("-", " ")}`)
    .join(", ")} to keep service stable.`;
}

function buildStorageRiskNote(
  storageRisk: ContractRiskLevel,
  freightClass: FreightClassConfig,
): string {
  if (storageRisk === "high") {
    return `${freightClass.name} will strain compatible storage unless more capacity is painted.`;
  }

  if (storageRisk === "moderate") {
    return `${freightClass.name} fits the current footprint, but storage slack will be tighter.`;
  }

  return `${freightClass.name} is a comfortable fit for current compatible storage.`;
}

function buildBudgetRiskNote(budgetPressure: ContractRiskLevel): string {
  if (budgetPressure === "high") {
    return "Budget pressure is high; expect more labor or support spending to carry this account.";
  }

  if (budgetPressure === "moderate") {
    return "Budget pressure is manageable if labor and support budgets stay disciplined.";
  }

  return "Budget impact is modest compared with the current operation size.";
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}
