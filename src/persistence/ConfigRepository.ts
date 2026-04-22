import clientProfiles from "../data/config/clientProfiles.json";
import contracts from "../data/config/contracts.json";
import difficultyModes from "../data/config/difficultyModes.json";
import freightClasses from "../data/config/freightClasses.json";
import laborRoles from "../data/config/laborRoles.json";
import seasonalCurves from "../data/config/seasonalCurves.json";
import zoneTypes from "../data/config/zoneTypes.json";
import { LaborRole } from "../game/simulation/types/enums";

export interface ConfigValidationResult {
  success: boolean;
  errors: string[];
}

export class ConfigRepository {
  constructor(
    private readonly config = {
      clientProfiles,
      contracts,
      difficultyModes,
      freightClasses,
      laborRoles,
      seasonalCurves,
      zoneTypes,
    },
  ) {}

  getFreightClasses() {
    return this.config.freightClasses;
  }

  getZoneTypes() {
    return this.config.zoneTypes;
  }

  getLaborRoles() {
    return this.config.laborRoles;
  }

  getDifficultyModes() {
    return this.config.difficultyModes;
  }

  getContracts() {
    return this.config.contracts;
  }

  getSeasonalCurves() {
    return this.config.seasonalCurves;
  }

  getClientProfiles() {
    return this.config.clientProfiles;
  }

  validateAll(): ConfigValidationResult {
    const errors: string[] = [];
    const zoneIds = validateIdArray("zoneTypes", this.config.zoneTypes, errors);
    const laborRoleIds = validateIdArray("laborRoles", this.config.laborRoles, errors);
    const freightClassIds = validateIdArray("freightClasses", this.config.freightClasses, errors);

    validateIdArray("difficultyModes", this.config.difficultyModes, errors);
    validateIdArray("contracts", this.config.contracts, errors);
    validateIdArray("seasonalCurves", this.config.seasonalCurves, errors, { allowEmpty: true });
    validateIdArray("clientProfiles", this.config.clientProfiles, errors, { allowEmpty: true });
    validateFreightClasses(this.config.freightClasses, zoneIds, errors);
    validateZoneTypes(this.config.zoneTypes, errors);
    validateLaborRoles(laborRoleIds, errors);
    validateDifficultyModes(this.config.difficultyModes, errors);
    validateContracts(this.config.contracts, freightClassIds, errors);

    return {
      success: errors.length === 0,
      errors,
    };
  }
}

const contractDifficultyTags = new Set([
  "capacity",
  "speed",
  "specialization",
  "margin",
  "consistency",
]);

function validateContracts(
  value: unknown,
  freightClassIds: Set<string>,
  errors: string[],
): void {
  if (!Array.isArray(value)) {
    return;
  }

  for (const contract of value) {
    if (!isRecord(contract)) {
      continue;
    }

    if (typeof contract.clientName !== "string" || contract.clientName.length === 0) {
      errors.push(`contracts.${String(contract.id)} is missing a clientName`);
    }

    if (
      typeof contract.freightClassId !== "string" ||
      !freightClassIds.has(contract.freightClassId)
    ) {
      errors.push(
        `contracts.${String(contract.id)} references unknown freight class ${String(contract.freightClassId)}`,
      );
    }

    if (
      typeof contract.difficultyTag !== "string" ||
      !contractDifficultyTags.has(contract.difficultyTag)
    ) {
      errors.push(`contracts.${String(contract.id)} has invalid difficultyTag`);
    }

    for (const field of [
      "minMonthlyCubicFeet",
      "maxMonthlyCubicFeet",
      "throughputMultiplier",
      "rateMultiplier",
      "dwellPenaltyRateMultiplier",
    ]) {
      if (!isNonNegativeNumber(contract[field]) || contract[field] <= 0) {
        errors.push(`contracts.${String(contract.id)} has invalid ${field}`);
      }
    }

    if (
      isNonNegativeNumber(contract.minMonthlyCubicFeet) &&
      isNonNegativeNumber(contract.maxMonthlyCubicFeet) &&
      contract.maxMonthlyCubicFeet < contract.minMonthlyCubicFeet
    ) {
      errors.push(`contracts.${String(contract.id)} has maxMonthlyCubicFeet below minimum`);
    }

    if (
      typeof contract.minimumServiceLevelModifier !== "number" ||
      !Number.isFinite(contract.minimumServiceLevelModifier)
    ) {
      errors.push(`contracts.${String(contract.id)} has invalid minimumServiceLevelModifier`);
    }

    if (
      !Array.isArray(contract.lengthMonthsOptions) ||
      contract.lengthMonthsOptions.length === 0 ||
      contract.lengthMonthsOptions.some(
        (value) => typeof value !== "number" || !Number.isInteger(value) || value <= 0,
      )
    ) {
      errors.push(`contracts.${String(contract.id)} has invalid lengthMonthsOptions`);
    }

    if (
      typeof contract.challengeNote !== "string" ||
      contract.challengeNote.length === 0
    ) {
      errors.push(`contracts.${String(contract.id)} is missing a challengeNote`);
    }
  }
}

function validateIdArray(
  name: string,
  value: unknown,
  errors: string[],
  options: { allowEmpty?: boolean } = {},
): Set<string> {
  const ids = new Set<string>();

  if (!Array.isArray(value)) {
    errors.push(`${name} must be an array`);
    return ids;
  }

  if (!options.allowEmpty && value.length === 0) {
    errors.push(`${name} must contain at least one item`);
  }

  for (const item of value) {
    if (!isRecord(item) || typeof item.id !== "string" || item.id.length === 0) {
      errors.push(`${name} contains an item without an id`);
      continue;
    }

    if (ids.has(item.id)) {
      errors.push(`${name} contains duplicate id ${item.id}`);
    }

    ids.add(item.id);
  }

  return ids;
}

function validateFreightClasses(
  value: unknown,
  zoneIds: Set<string>,
  errors: string[],
): void {
  if (!Array.isArray(value)) {
    return;
  }

  for (const freightClass of value) {
    if (!isRecord(freightClass)) {
      continue;
    }

    if (typeof freightClass.name !== "string" || freightClass.name.length === 0) {
      errors.push(`freightClasses.${String(freightClass.id)} is missing a name`);
    }

    if (!isNonNegativeNumber(freightClass.baseRevenuePerCubicFoot)) {
      errors.push(`freightClasses.${String(freightClass.id)} has invalid revenue`);
    }

    if (!Array.isArray(freightClass.compatibleZoneTypes)) {
      errors.push(`freightClasses.${String(freightClass.id)} is missing compatible zones`);
      continue;
    }

    for (const zoneType of freightClass.compatibleZoneTypes) {
      if (typeof zoneType !== "string" || !zoneIds.has(zoneType)) {
        errors.push(
          `freightClasses.${String(freightClass.id)} references unknown zone ${String(zoneType)}`,
        );
      }
    }
  }
}

function validateZoneTypes(value: unknown, errors: string[]): void {
  if (!Array.isArray(value)) {
    return;
  }

  for (const zoneType of value) {
    if (!isRecord(zoneType)) {
      continue;
    }

    if (typeof zoneType.name !== "string" || zoneType.name.length === 0) {
      errors.push(`zoneTypes.${String(zoneType.id)} is missing a name`);
    }

    if (!isNonNegativeNumber(zoneType.capacityPerTile)) {
      errors.push(`zoneTypes.${String(zoneType.id)} has invalid capacity`);
    }
  }
}

function validateLaborRoles(roleIds: Set<string>, errors: string[]): void {
  for (const role of Object.values(LaborRole)) {
    if (!roleIds.has(role)) {
      errors.push(`laborRoles is missing ${role}`);
    }
  }
}

function validateDifficultyModes(value: unknown, errors: string[]): void {
  if (!Array.isArray(value)) {
    return;
  }

  for (const mode of value) {
    if (!isRecord(mode)) {
      continue;
    }

    for (const field of [
      "startingCash",
      "initialHeadcount",
      "forecastAccuracy",
      "demandVolatility",
      "inboundIntervalMultiplier",
      "inboundVolumeMultiplier",
      "outboundIntervalMultiplier",
      "outboundVolumeMultiplier",
      "scoreDecayMultiplier",
      "serviceTargetMultiplier",
    ]) {
      if (!isNonNegativeNumber(mode[field])) {
        errors.push(`difficultyModes.${String(mode.id)} has invalid ${field}`);
      }
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}
