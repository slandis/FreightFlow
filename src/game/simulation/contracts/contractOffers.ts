import contractTemplates from "../../../data/config/contracts.json";
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
import { getDifficultyModeById } from "../config/difficulty";
import { LABOR_COST_PER_WORKER_PER_MONTH } from "../labor/laborCost";
import { LaborRole } from "../types/enums";
import { createId } from "../types/ids";
import {
  createOfferScheduleFields,
  rollNextInboundEligibleTick,
  rollNextOutboundEligibleTick,
} from "./contractScheduling";

const OFFER_COUNT = 4;
const ROLE_ORDER: LaborRole[] = [
  LaborRole.SwitchDriver,
  LaborRole.Unload,
  LaborRole.Storage,
  LaborRole.Pick,
  LaborRole.Load,
];

type FreightClassConfig = (typeof freightClasses)[number];

interface ContractTemplateConfig {
  id: string;
  clientName: string;
  freightClassId: string;
  difficultyTag: ContractDifficultyTag;
  minMonthlyCubicFeet: number;
  maxMonthlyCubicFeet: number;
  throughputMultiplier: number;
  lengthMonthsOptions: number[];
  rateMultiplier: number;
  minimumServiceLevelModifier: number;
  dwellPenaltyRateMultiplier: number;
  challengeNote: string;
}

const configuredContractTemplates = contractTemplates as ContractTemplateConfig[];

export function generateMonthlyContractOffers(
  state: GameState,
  monthKey: string,
  random: RandomService,
): ContractOffer[] {
  const templates = selectOfferTemplates(state, random);
  const offers: ContractOffer[] = [];

  for (const [offerIndex, template] of templates.entries()) {
    const freightClass = getFreightClassConfig(template.freightClassId);

    if (!freightClass) {
      continue;
    }

    const expectedMonthlyThroughputCubicFeet = calculateOfferThroughput(
      state,
      freightClass,
      template,
      random,
    );
    const lengthMonths =
      template.lengthMonthsOptions[random.nextInt(0, template.lengthMonthsOptions.length - 1)];
    const analysis = buildOfferAnalysis(
      state,
      freightClass,
      expectedMonthlyThroughputCubicFeet,
      template.difficultyTag,
    );
    const schedule = createOfferScheduleFields(template.difficultyTag);

    offers.push({
      id: createId("contract-offer", state.contracts.nextOfferSequence + offerIndex),
      monthKey,
      clientName: template.clientName,
      freightClassId: freightClass.id,
      ...schedule,
      lengthMonths,
      expectedMonthlyThroughputCubicFeet,
      expectedWeeklyThroughputCubicFeet: Math.round(expectedMonthlyThroughputCubicFeet / 4),
      revenuePerCubicFoot: calculateOfferRevenueRate(freightClass, template, random),
      minimumServiceLevel: calculateMinimumServiceLevel(template, random),
      dwellPenaltyThresholdTicks: calculateDwellPenaltyThreshold(template.difficultyTag),
      dwellPenaltyRatePerCubicFoot: calculateDwellPenaltyRate(freightClass, template),
      difficultyTag: template.difficultyTag,
      operationalChallengeNote: template.challengeNote,
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

export function activateAcceptedContractOffers(
  state: GameState,
  random: RandomService,
): void {
  const acceptedOffers = state.contracts.pendingOffers.filter(
    (offer) => offer.decision === "accepted",
  );

  if (acceptedOffers.length === 0) {
    state.contracts.pendingOffers = [];
    return;
  }

  const acceptedMonthIndex = getMonthIndex(state.calendar);
  const difficultyMode = getDifficultyModeById(state.difficultyModeId);

  for (const offer of acceptedOffers) {
    const activeContract: ActiveContract = {
      id: createId("contract", state.contracts.nextActiveContractSequence),
      name: `${offer.clientName} ${getFreightClassName(offer.freightClassId)}`,
      clientName: offer.clientName,
      freightClassId: offer.freightClassId,
      inboundIntervalMinTicks: offer.inboundIntervalMinTicks,
      inboundIntervalMaxTicks: offer.inboundIntervalMaxTicks,
      outboundIntervalMinTicks: offer.outboundIntervalMinTicks,
      outboundIntervalMaxTicks: offer.outboundIntervalMaxTicks,
      nextInboundEligibleTick: 0,
      nextOutboundEligibleTick: 0,
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
    activeContract.nextInboundEligibleTick = rollNextInboundEligibleTick(
      state.currentTick,
      activeContract,
      difficultyMode,
      random,
    );
    activeContract.nextOutboundEligibleTick = rollNextOutboundEligibleTick(
      state.currentTick,
      activeContract,
      difficultyMode,
      random,
    );

    state.contracts.nextActiveContractSequence += 1;
    state.contracts.activeContracts.push(activeContract);
  }

  state.contracts.pendingOffers = [];
}

function selectOfferTemplates(
  state: GameState,
  random: RandomService,
): ContractTemplateConfig[] {
  const primaryPool = getAvailableTemplates(state, true);
  const fallbackPool = getAvailableTemplates(state, false);
  const candidatePool = primaryPool.length >= OFFER_COUNT ? primaryPool : fallbackPool;
  const selected: ContractTemplateConfig[] = [];
  const remaining = [...candidatePool];

  while (selected.length < OFFER_COUNT && remaining.length > 0) {
    let bestIndex = 0;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (const [index, template] of remaining.entries()) {
      const score = scoreTemplateSelection(template, selected) + random.next();

      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    }

    selected.push(remaining.splice(bestIndex, 1)[0]);
  }

  return selected;
}

function getAvailableTemplates(
  state: GameState,
  excludeCompletedClientNames: boolean,
): ContractTemplateConfig[] {
  const activeClientNames = new Set(state.contracts.activeContracts.map((contract) => contract.clientName));
  const pendingClientNames = new Set(state.contracts.pendingOffers.map((offer) => offer.clientName));
  const completedClientNames = new Set(
    excludeCompletedClientNames
      ? state.contracts.completedContracts.map((contract) => contract.clientName)
      : [],
  );

  return configuredContractTemplates.filter((template) => {
    if (
      activeClientNames.has(template.clientName) ||
      pendingClientNames.has(template.clientName) ||
      completedClientNames.has(template.clientName)
    ) {
      return false;
    }

    const freightClass = getFreightClassConfig(template.freightClassId);

    if (!freightClass) {
      return false;
    }

    const compatibleCapacity = getCompatibleStorageCapacity(state, freightClass);
    const capacityBound = Math.max(250000, compatibleCapacity * 6);

    return Math.min(template.maxMonthlyCubicFeet, capacityBound) >= template.minMonthlyCubicFeet;
  });
}

function scoreTemplateSelection(
  template: ContractTemplateConfig,
  selectedTemplates: ContractTemplateConfig[],
): number {
  const duplicateFreightClass = selectedTemplates.some(
    (selectedTemplate) => selectedTemplate.freightClassId === template.freightClassId,
  );
  const duplicateDifficulty = selectedTemplates.some(
    (selectedTemplate) => selectedTemplate.difficultyTag === template.difficultyTag,
  );
  const volumeBand = getVolumeBand(template);
  const duplicateVolumeBand = selectedTemplates.some(
    (selectedTemplate) => getVolumeBand(selectedTemplate) === volumeBand,
  );
  const averageThroughputMultiplier =
    selectedTemplates.length === 0
      ? template.throughputMultiplier
      : selectedTemplates.reduce(
          (total, selectedTemplate) => total + selectedTemplate.throughputMultiplier,
          0,
        ) / selectedTemplates.length;
  const throughputSpreadScore =
    Math.abs(template.throughputMultiplier - averageThroughputMultiplier) * 4;

  return (
    (duplicateFreightClass ? 0 : 3) +
    (duplicateDifficulty ? 0 : 2) +
    (duplicateVolumeBand ? 0 : 2.5) +
    throughputSpreadScore +
    template.throughputMultiplier
  );
}

function calculateOfferThroughput(
  state: GameState,
  freightClass: FreightClassConfig,
  template: ContractTemplateConfig,
  random: RandomService,
): number {
  const currentPortfolioMonthly = state.contracts.activeContracts.reduce(
    (total, contract) => total + contract.expectedMonthlyThroughputCubicFeet,
    0,
  );
  const compatibleCapacity = getCompatibleStorageCapacity(state, freightClass);
  const capacityBound = Math.max(250000, compatibleCapacity * 6);
  const portfolioAnchor = currentPortfolioMonthly <= 0 ? 180000 : currentPortfolioMonthly * 0.38;
  const difficultyMultiplier = getDifficultyThroughputMultiplier(template.difficultyTag);
  const variance = 0.88 + random.next() * 0.26;
  const templateMin = Math.max(45000, template.minMonthlyCubicFeet);
  const templateMax = Math.max(templateMin, template.maxMonthlyCubicFeet);
  const feasibleMax = Math.max(templateMin, Math.min(templateMax, capacityBound));
  const suggestedMonthlyCubicFeet =
    portfolioAnchor * difficultyMultiplier * template.throughputMultiplier * variance;

  return clampOfferVolume(
    Math.round(suggestedMonthlyCubicFeet),
    templateMin,
    feasibleMax,
  );
}

function calculateOfferRevenueRate(
  freightClass: FreightClassConfig,
  template: ContractTemplateConfig,
  random: RandomService,
): number {
  const difficultyRateMultiplier =
    {
      capacity: 0.95,
      speed: 1.12,
      specialization: 1.2,
      margin: 0.84,
      consistency: 1,
    }[template.difficultyTag] ?? 1;

  return roundCurrency(
    freightClass.baseRevenuePerCubicFoot *
      difficultyRateMultiplier *
      template.rateMultiplier *
      (0.96 + random.next() * 0.1),
  );
}

function calculateMinimumServiceLevel(
  template: ContractTemplateConfig,
  random: RandomService,
): number {
  const baseline =
    {
      capacity: 78,
      speed: 88,
      specialization: 84,
      margin: 82,
      consistency: 90,
    }[template.difficultyTag] ?? 82;

  return Math.min(
    97,
    Math.max(
      72,
      Math.round(baseline + template.minimumServiceLevelModifier + random.nextInt(-2, 3)),
    ),
  );
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
  template: ContractTemplateConfig,
): number {
  const difficultyRate =
    {
      capacity: 0.012,
      speed: 0.05,
      specialization: 0.032,
      margin: 0.018,
      consistency: 0.038,
    }[template.difficultyTag] ?? 0.02;

  return roundCurrency(
    (difficultyRate + freightClass.baseRevenuePerCubicFoot * 0.03) *
      template.dwellPenaltyRateMultiplier,
  );
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
    totalExpectedHeadcount * LABOR_COST_PER_WORKER_PER_MONTH;
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
    case LaborRole.InventoryTeam:
      return "storage";
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

function getVolumeBand(template: ContractTemplateConfig): "light" | "medium" | "heavy" {
  if (template.maxMonthlyCubicFeet < 350000) {
    return "light";
  }

  if (template.maxMonthlyCubicFeet < 650000) {
    return "medium";
  }

  return "heavy";
}

function getFreightClassConfig(freightClassId: string): FreightClassConfig | undefined {
  return freightClasses.find((freightClass) => freightClass.id === freightClassId);
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

function clampOfferVolume(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(value, maximum));
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}
