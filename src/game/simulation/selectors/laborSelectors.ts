import type { GameState } from "../core/GameState";
import type { LaborBottleneck, LaborPool, LaborPressure, LaborRoleAnalytics } from "../labor/LaborPool";
import { CUBIC_FEET_PER_WORKER_TICK } from "../labor/LaborManager";
import { LaborRole } from "../types/enums";

const TICKS_PER_MONTH = 1440 * 30;
const IDEAL_PRODUCTIVITY_MULTIPLIER = 1.1;
const FORECAST_CUBIC_FEET_PER_TRAILER = 2000;
const PRODUCTIVE_HEADCOUNT_PER_SANITATION = 7;
const PRODUCTIVE_HEADCOUNT_PER_MANAGEMENT = 7;
const BASELINE_CONTRACT_ID = "baseline-general-freight";

const LABOR_ROLE_ORDER: LaborRole[] = [
  LaborRole.SwitchDriver,
  LaborRole.Unload,
  LaborRole.Storage,
  LaborRole.Pick,
  LaborRole.Load,
  LaborRole.Sanitation,
  LaborRole.Management,
];

const DIRECT_LABOR_ROLES = new Set<LaborRole>([
  LaborRole.SwitchDriver,
  LaborRole.Unload,
  LaborRole.Storage,
  LaborRole.Pick,
  LaborRole.Load,
]);

const PRODUCTIVE_CUBIC_FOOT_ROLES = [
  LaborRole.Unload,
  LaborRole.Storage,
  LaborRole.Pick,
  LaborRole.Load,
] as const;

export const LABOR_ROLE_LABELS: Record<LaborRole, string> = {
  [LaborRole.SwitchDriver]: "Switch Driver",
  [LaborRole.Unload]: "Inbound Unloading",
  [LaborRole.Storage]: "Inbound Storage",
  [LaborRole.Pick]: "Outbound Picking",
  [LaborRole.Load]: "Outbound Loading",
  [LaborRole.Sanitation]: "Sanitation",
  [LaborRole.Management]: "Management",
};

export interface LaborAnalysisRole {
  roleId: LaborRole;
  label: string;
  pressure: LaborPressure;
  assignedHeadcount: number;
  averageAssignedHeadcount: number;
  totalCubicFeetProcessed: number;
  averageCubicFeetPerHead: number | null;
  costPerThroughputCube: number | null;
  averageTaskTicks: number | null;
  totalLaborCostPerTick: number;
  totalLaborCost: number;
  utilization: number;
  completedTaskCount: number;
  isEstimated: boolean;
}

export interface LaborAnalysisSummary {
  monthKey: string;
  elapsedTicks: number;
  totalLaborCost: number;
  laborCostPerThroughputCube: number | null;
  throughputCubicFeet: number;
  mostStrainedRoleLabel: string | null;
  mostExpensiveRoleLabel: string | null;
  lowestEfficiencyRoleLabel: string | null;
  acceptedContractForecastCubicFeet: number;
  totalForecastHeadcountGap: number;
}

export interface LaborSuggestion {
  id: string;
  message: string;
}

export interface LaborForecastRole {
  roleId: LaborRole;
  label: string;
  currentHeadcount: number;
  idealHeadcount: number;
  difference: number;
}

export function selectLaborSummary(state: GameState) {
  return {
    totalHeadcount: state.labor.totalHeadcount,
    unassignedHeadcount: state.labor.unassignedHeadcount,
    criticalCount: state.labor.pressure.criticalCount,
    topBottleneck: state.labor.pressure.topBottleneck,
    productivityMultiplier: state.labor.modifiers.productivityMultiplier,
    conditionPressure: state.labor.modifiers.conditionPressure,
  };
}

export function selectLaborRoleDetails(state: GameState): LaborPool[] {
  return [...state.labor.pools].sort((first, second) =>
    first.roleId.localeCompare(second.roleId),
  );
}

export function selectBottleneckSummary(state: GameState): LaborBottleneck | null {
  return state.labor.pressure.topBottleneck;
}

export function selectCriticalLaborWarnings(state: GameState): LaborBottleneck[] {
  return state.labor.pressure.bottlenecks.filter(
    (bottleneck) => bottleneck.pressure === "critical",
  );
}

export function selectQueuePressureSummary(state: GameState): LaborBottleneck[] {
  return state.labor.pressure.bottlenecks;
}

export function selectLaborAnalysisRoles(state: GameState): LaborAnalysisRole[] {
  const elapsedTicks = getElapsedAnalysisTicks(state);

  return LABOR_ROLE_ORDER.map((roleId) => {
    const pool = getPool(state, roleId);
    const analytics = getRoleAnalytics(state, roleId);
    const totalCubicFeetProcessed = getRoleProcessedCube(analytics, roleId);
    const averageAssignedHeadcount = analytics.totalHeadcountTicks / elapsedTicks;
    const averageCubicFeetPerHead =
      averageAssignedHeadcount > 0 && totalCubicFeetProcessed > 0
        ? totalCubicFeetProcessed / averageAssignedHeadcount
        : null;
    const costPerThroughputCube =
      totalCubicFeetProcessed > 0
        ? analytics.totalLaborCost / totalCubicFeetProcessed
        : null;
    const averageTaskTicks =
      analytics.completedTaskCount > 0
        ? analytics.totalTaskTicks / analytics.completedTaskCount
        : null;

    return {
      roleId,
      label: LABOR_ROLE_LABELS[roleId],
      pressure: pool?.pressure ?? "healthy",
      assignedHeadcount: pool?.assignedHeadcount ?? 0,
      averageAssignedHeadcount,
      totalCubicFeetProcessed,
      averageCubicFeetPerHead,
      costPerThroughputCube,
      averageTaskTicks,
      totalLaborCostPerTick: analytics.totalLaborCost / elapsedTicks,
      totalLaborCost: analytics.totalLaborCost,
      utilization: pool?.utilization ?? 0,
      completedTaskCount: analytics.completedTaskCount,
      isEstimated: !DIRECT_LABOR_ROLES.has(roleId),
    };
  });
}

export function selectLaborAnalysisSummary(state: GameState): LaborAnalysisSummary {
  const roles = selectLaborAnalysisRoles(state);
  const throughputCubicFeet = getFacilityThroughputCubicFeet(state);
  const forecastRoles = selectLaborForecastHeadcountChart(state);
  const acceptedContractForecastCubicFeet = getAcceptedContractForecastCube(state);

  return {
    monthKey: state.labor.analytics.monthKey,
    elapsedTicks: getElapsedAnalysisTicks(state),
    totalLaborCost: roles.reduce((total, role) => total + role.totalLaborCost, 0),
    laborCostPerThroughputCube:
      throughputCubicFeet > 0
        ? roles.reduce((total, role) => total + role.totalLaborCost, 0) / throughputCubicFeet
        : null,
    throughputCubicFeet,
    mostStrainedRoleLabel: state.labor.pressure.topBottleneck?.label ?? null,
    mostExpensiveRoleLabel:
      [...roles].sort((first, second) => second.totalLaborCost - first.totalLaborCost)[0]?.label ??
      null,
    lowestEfficiencyRoleLabel:
      roles
        .filter(
          (role) =>
            DIRECT_LABOR_ROLES.has(role.roleId) &&
            role.costPerThroughputCube !== null &&
            role.totalCubicFeetProcessed > 0,
        )
        .sort(
          (first, second) =>
            (second.costPerThroughputCube ?? 0) - (first.costPerThroughputCube ?? 0),
        )[0]?.label ?? null,
    acceptedContractForecastCubicFeet,
    totalForecastHeadcountGap: forecastRoles.reduce(
      (total, role) => total + Math.max(0, role.difference),
      0,
    ),
  };
}

export function selectLaborAnalysisSuggestions(state: GameState): LaborSuggestion[] {
  const suggestions: LaborSuggestion[] = [];
  const roles = selectLaborAnalysisRoles(state);
  const byRole = new Map(roles.map((role) => [role.roleId, role]));
  const queues = state.freightFlow.queues;
  const summary = selectLaborAnalysisSummary(state);

  function addSuggestion(id: string, message: string): void {
    if (suggestions.some((suggestion) => suggestion.id === id) || suggestions.length >= 3) {
      return;
    }

    suggestions.push({ id, message });
  }

  if (isRoleStrained(byRole.get(LaborRole.Unload)) && (queues.yardTrailers > 0 || queues.unloadTrailers > 0)) {
    addSuggestion("unload", "Look into adding more unloader labor.");
  }

  if (isRoleStrained(byRole.get(LaborRole.Storage)) && queues.dockFreightCubicFeet > 0) {
    addSuggestion(
      "storage",
      "Storage crews are behind. More storage labor should improve dock turnover.",
    );
  }

  if (isRoleStrained(byRole.get(LaborRole.Pick)) && queues.pickQueueCubicFeet > 0) {
    addSuggestion(
      "pick",
      "Outbound picking is falling behind. Consider increasing pick labor.",
    );
  }

  if (isRoleStrained(byRole.get(LaborRole.Load)) && queues.loadQueueCubicFeet > 0) {
    addSuggestion(
      "load",
      "Outbound trailers are waiting on loading. More loaders may protect revenue.",
    );
  }

  if (isRoleStrained(byRole.get(LaborRole.SwitchDriver)) && queues.yardTrailers > 0) {
    addSuggestion(
      "switch-driver",
      "Yard and dock movement is constrained. Add switch-driver coverage.",
    );
  }

  if (
    isRoleStrained(byRole.get(LaborRole.Sanitation)) &&
    (state.scores.condition.value < 82 || state.scores.safety.value < 88)
  ) {
    addSuggestion(
      "sanitation",
      "Sanitation support is light. A small increase may stabilize condition and safety.",
    );
  }

  if (
    isRoleStrained(byRole.get(LaborRole.Management)) &&
    state.labor.pressure.bottlenecks.filter(
      (bottleneck) => bottleneck.roleId !== LaborRole.Management && bottleneck.roleId !== LaborRole.Sanitation,
    ).length >= 2
  ) {
    addSuggestion(
      "management",
      "Coordination is stretched across several teams. More management support could improve overall flow.",
    );
  }

  if (
    state.economy.currentMonthNet < 0 &&
    roles.some(
      (role) =>
        DIRECT_LABOR_ROLES.has(role.roleId) &&
        role.assignedHeadcount > 0 &&
        role.utilization < 0.4 &&
        role.totalLaborCost > 0,
    )
  ) {
    addSuggestion(
      "rebalance",
      "Labor spend is outpacing current throughput. Rebalance underused roles before expanding headcount.",
    );
  }

  if (summary.totalForecastHeadcountGap > 0) {
    addSuggestion(
      "forecast-gap",
      `Accepted contract volume suggests roughly ${summary.totalForecastHeadcountGap} more heads may be needed at ideal performance.`,
    );
  }

  if (suggestions.length === 0) {
    addSuggestion(
      "stable",
      "Labor is broadly in line with current demand. Make small adjustments before adding cost.",
    );
  }

  return suggestions;
}

export function selectLaborForecastHeadcountChart(state: GameState): LaborForecastRole[] {
  const acceptedForecastCube = getAcceptedContractForecastCube(state);
  const currentHeadcountByRole = new Map(
    state.labor.pools.map((pool) => [pool.roleId, pool.assignedHeadcount]),
  );
  const productiveForecast = new Map<LaborRole, number>();

  productiveForecast.set(
    LaborRole.SwitchDriver,
    acceptedForecastCube <= 0
      ? 0
      : Math.ceil(
          Math.ceil(acceptedForecastCube / FORECAST_CUBIC_FEET_PER_TRAILER) /
            Math.max(1, getSwitchMovesPerMonthPerHead(state)),
        ),
  );

  for (const roleId of PRODUCTIVE_CUBIC_FOOT_ROLES) {
    productiveForecast.set(
      roleId,
      acceptedForecastCube <= 0
        ? 0
        : Math.ceil(
            acceptedForecastCube /
              Math.max(1, getProductiveCubePerMonthPerHead(state, roleId)),
          ),
    );
  }

  const productiveHeadcount = [...productiveForecast.values()].reduce(
    (total, headcount) => total + headcount,
    0,
  );
  const sanitationHeadcount =
    productiveHeadcount <= 0 ? 0 : Math.ceil(productiveHeadcount / PRODUCTIVE_HEADCOUNT_PER_SANITATION);
  const managementHeadcount =
    productiveHeadcount <= 0 ? 0 : Math.ceil(productiveHeadcount / PRODUCTIVE_HEADCOUNT_PER_MANAGEMENT);

  const idealHeadcountByRole = new Map<LaborRole, number>([
    [LaborRole.SwitchDriver, productiveForecast.get(LaborRole.SwitchDriver) ?? 0],
    [LaborRole.Unload, productiveForecast.get(LaborRole.Unload) ?? 0],
    [LaborRole.Storage, productiveForecast.get(LaborRole.Storage) ?? 0],
    [LaborRole.Pick, productiveForecast.get(LaborRole.Pick) ?? 0],
    [LaborRole.Load, productiveForecast.get(LaborRole.Load) ?? 0],
    [LaborRole.Sanitation, sanitationHeadcount],
    [LaborRole.Management, managementHeadcount],
  ]);

  return LABOR_ROLE_ORDER.map((roleId) => {
    const currentHeadcount = currentHeadcountByRole.get(roleId) ?? 0;
    const idealHeadcount = idealHeadcountByRole.get(roleId) ?? 0;

    return {
      roleId,
      label: LABOR_ROLE_LABELS[roleId],
      currentHeadcount,
      idealHeadcount,
      difference: idealHeadcount - currentHeadcount,
    };
  });
}

function getElapsedAnalysisTicks(state: GameState): number {
  return Math.max(1, state.currentTick - state.labor.analytics.startedTick + 1);
}

function getRoleAnalytics(state: GameState, roleId: LaborRole): LaborRoleAnalytics {
  const analytics = state.labor.analytics.roles.find((role) => role.roleId === roleId);

  if (!analytics) {
    throw new Error(`Missing labor analytics for role ${roleId}`);
  }

  return analytics;
}

function getPool(state: GameState, roleId: LaborRole): LaborPool | null {
  return state.labor.pools.find((pool) => pool.roleId === roleId) ?? null;
}

function getRoleProcessedCube(analytics: LaborRoleAnalytics, roleId: LaborRole): number {
  return DIRECT_LABOR_ROLES.has(roleId)
    ? analytics.directCubicFeetProcessed
    : analytics.attributedCubicFeetProcessed;
}

function getAcceptedContractForecastCube(state: GameState): number {
  return state.contracts.activeContracts
    .filter((contract) => contract.id !== BASELINE_CONTRACT_ID)
    .reduce((total, contract) => total + contract.expectedMonthlyThroughputCubicFeet, 0);
}

function getProductiveCubePerMonthPerHead(state: GameState, roleId: LaborRole): number {
  const pool = getPool(state, roleId);
  const baseRate = pool?.baseRate ?? 1;

  return CUBIC_FEET_PER_WORKER_TICK * baseRate * IDEAL_PRODUCTIVITY_MULTIPLIER * TICKS_PER_MONTH;
}

function getSwitchMovesPerMonthPerHead(state: GameState): number {
  const pool = getPool(state, LaborRole.SwitchDriver);
  const baseRate = pool?.baseRate ?? 1;

  return baseRate * TICKS_PER_MONTH;
}

function getFacilityThroughputCubicFeet(state: GameState): number {
  const unloadCube = getRoleAnalytics(state, LaborRole.Unload).directCubicFeetProcessed;
  const loadCube = getRoleAnalytics(state, LaborRole.Load).directCubicFeetProcessed;
  const averageThroughput = (unloadCube + loadCube) / 2;

  return Math.max(averageThroughput, unloadCube, loadCube);
}

function isRoleStrained(role: LaborAnalysisRole | undefined): boolean {
  if (!role) {
    return false;
  }

  return role.pressure === "strained" || role.pressure === "critical" || role.pressure === "busy";
}
