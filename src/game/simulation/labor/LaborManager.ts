import laborRoles from "../../../data/config/laborRoles.json";
import type { BudgetPlan } from "../core/GameState";
import type { FreightFlowState } from "../freight/FreightFlowState";
import {
  createDefaultBudgetPlan,
  getInventorySupport,
  getOperationsSupport,
  getTrainingProductivityBonus,
} from "../planning/BudgetPlan";
import { getSuggestedInventorySupportHeadcount } from "../planning/inventorySupport";
import { LaborRole } from "../types/enums";
import { LaborAnalyticsRecorder } from "./LaborAnalyticsRecorder";
import type {
  LaborBottleneck,
  LaborModifiers,
  LaborPool,
  LaborPressure,
  LaborState,
} from "./LaborPool";

export const DEFAULT_TOTAL_HEADCOUNT = 18;
export const CUBIC_FEET_PER_WORKER_TICK = 120;

const SUPPORT_TARGET_HEADCOUNT = 2;
const defaultAssignments: Record<LaborRole, number> = {
  [LaborRole.SwitchDriver]: 2,
  [LaborRole.Unload]: 3,
  [LaborRole.Storage]: 3,
  [LaborRole.Pick]: 3,
  [LaborRole.Load]: 3,
  [LaborRole.InventoryTeam]: 0,
  [LaborRole.Sanitation]: 2,
  [LaborRole.Management]: 2,
};

const roleLabels = new Map<LaborRole, string>(
  laborRoles.map((role) => [role.id as LaborRole, role.name]),
);

const roleSortOrder = new Map<LaborRole, number>(
  Object.values(LaborRole).map((role, index) => [role, index]),
);

export class LaborManager {
  private readonly analyticsRecorder = new LaborAnalyticsRecorder();

  createInitialLaborState(monthKey: string, totalHeadcount: number = DEFAULT_TOTAL_HEADCOUNT): LaborState {
    const initialAssignments = createInitialAssignments(totalHeadcount);
    const pools = laborRoles.map((role) => {
      const roleId = role.id as LaborRole;

      return {
        roleId,
        assignedHeadcount: initialAssignments[roleId] ?? 0,
        availableHeadcount: initialAssignments[roleId] ?? 0,
        baseRate: role.baseRate,
        effectiveRate: 0,
        activeWorkload: 0,
        utilization: 0,
        pressure: "healthy" as LaborPressure,
      };
    });

    const labor: LaborState = {
      totalHeadcount,
      unassignedHeadcount: 0,
      pools,
      modifiers: this.calculateModifiers(pools, createDefaultBudgetPlan()),
      pressure: {
        bottlenecks: [],
        criticalCount: 0,
        topBottleneck: null,
      },
      analytics: this.analyticsRecorder.createInitialAnalytics(monthKey),
    };

    this.recalculate(labor);

    return labor;
  }

  assignLabor(
    labor: LaborState,
    roleId: string,
    headcount: number,
    budget: BudgetPlan = createDefaultBudgetPlan(),
  ): { success: true } | { success: false; error: string } {
    if (!Object.values(LaborRole).includes(roleId as LaborRole)) {
      return { success: false, error: `Unknown labor role: ${roleId}` };
    }

    if (!Number.isFinite(headcount) || !Number.isInteger(headcount) || headcount < 0) {
      return { success: false, error: "Headcount must be a non-negative integer" };
    }

    const pool = this.getPool(labor, roleId as LaborRole);

    if (!pool) {
      return { success: false, error: `Unknown labor role: ${roleId}` };
    }

    const assignedOtherHeadcount = labor.pools
      .filter((candidatePool) => candidatePool.roleId !== roleId)
      .reduce((total, candidatePool) => total + candidatePool.assignedHeadcount, 0);

    if (assignedOtherHeadcount + headcount > labor.totalHeadcount) {
      return { success: false, error: "Assignment exceeds total headcount" };
    }

    pool.assignedHeadcount = headcount;
    pool.availableHeadcount = headcount;
    this.recalculate(labor, {}, budget);

    return { success: true };
  }

  recalculate(
    labor: LaborState,
    workloads: Partial<Record<LaborRole, number>> = {},
    budget: BudgetPlan = createDefaultBudgetPlan(),
  ): void {
    labor.unassignedHeadcount = Math.max(
      0,
      labor.totalHeadcount -
        labor.pools.reduce((total, pool) => total + pool.assignedHeadcount, 0),
    );
    labor.modifiers = this.calculateModifiers(labor.pools, budget);

    for (const pool of labor.pools) {
      const activeWorkload = workloads[pool.roleId] ?? 0;
      const effectiveRate = this.calculateEffectiveRate(pool, labor.modifiers);

      pool.availableHeadcount = pool.assignedHeadcount;
      pool.effectiveRate = effectiveRate;
      pool.activeWorkload = activeWorkload;
      pool.utilization = this.calculateUtilization(pool.roleId, activeWorkload, pool);
      pool.pressure = this.calculatePressure(pool, activeWorkload);
    }

    labor.pressure = this.calculatePressureSummary(labor.pools);
  }

  calculateWorkloads(
    freightFlow: FreightFlowState,
    forecastMonthlyVolumeCubicFeet: number = 0,
  ): Partial<Record<LaborRole, number>> {
    const yardTrailers = freightFlow.trailers.filter(
      (trailer) => trailer.direction === "inbound" && trailer.state === "yard",
    ).length;
    const switchingTrailers = freightFlow.trailers.filter(
      (trailer) => trailer.state === "switching-to-door",
    ).length;
    const unloadWorkload = freightFlow.trailers
      .filter((trailer) => trailer.state === "at-door" || trailer.state === "unloading")
      .reduce((total, trailer) => total + trailer.remainingUnloadCubicFeet, 0);
    const storageWorkload = freightFlow.freightBatches
      .filter((batch) => batch.state === "in-stage" || batch.state === "storing")
      .reduce((total, batch) => total + (batch.remainingStorageCubicFeet ?? batch.cubicFeet), 0);
    const pickWorkload = freightFlow.outboundOrders
      .filter((order) => order.state === "open" || order.state === "picking")
      .reduce((total, order) => total + order.remainingPickCubicFeet, 0);
    const loadWorkload = freightFlow.outboundOrders
      .filter((order) => order.state === "picked" || order.state === "loading")
      .reduce((total, order) => total + order.remainingLoadCubicFeet, 0);

    return {
      [LaborRole.SwitchDriver]: yardTrailers + switchingTrailers,
      [LaborRole.Unload]: unloadWorkload,
      [LaborRole.Storage]: storageWorkload,
      [LaborRole.Pick]: pickWorkload,
      [LaborRole.Load]: loadWorkload,
      [LaborRole.InventoryTeam]: getSuggestedInventorySupportHeadcount(
        forecastMonthlyVolumeCubicFeet,
      ),
      [LaborRole.Sanitation]: SUPPORT_TARGET_HEADCOUNT,
      [LaborRole.Management]: SUPPORT_TARGET_HEADCOUNT,
    };
  }

  getProcessingCapacity(labor: LaborState, roleId: LaborRole): number {
    return this.getPool(labor, roleId)?.effectiveRate ?? 0;
  }

  getAssignedHeadcount(labor: LaborState, roleId: LaborRole): number {
    return this.getPool(labor, roleId)?.assignedHeadcount ?? 0;
  }

  getRoleLabel(roleId: LaborRole): string {
    return roleLabels.get(roleId) ?? roleId;
  }

  private calculateModifiers(pools: LaborPool[], budget: BudgetPlan): LaborModifiers {
    const sanitationHeadcount =
      pools.find((pool) => pool.roleId === LaborRole.Sanitation)?.assignedHeadcount ?? 0;
    const inventoryHeadcount =
      pools.find((pool) => pool.roleId === LaborRole.InventoryTeam)?.assignedHeadcount ?? 0;
    const managementHeadcount =
      pools.find((pool) => pool.roleId === LaborRole.Management)?.assignedHeadcount ?? 0;
    const sanitationCoverage = sanitationHeadcount / SUPPORT_TARGET_HEADCOUNT;
    const managementCoverage = managementHeadcount / SUPPORT_TARGET_HEADCOUNT;
    const coordinationMultiplier =
      managementHeadcount === 0
        ? 0.85
        : Math.min(1.1, 0.9 + Math.min(1.5, managementCoverage) * 0.1);
    const trainingProductivityBonus = getTrainingProductivityBonus(budget);
    const operationsSupport = getOperationsSupport(budget);
    const inventorySupport = getInventorySupport(budget);
    const congestionPenalty =
      sanitationHeadcount >= SUPPORT_TARGET_HEADCOUNT
        ? 0
        : Math.max(
            0,
            Math.min(0.25, (SUPPORT_TARGET_HEADCOUNT - sanitationHeadcount) * 0.12) -
              operationsSupport,
          );
    const conditionPressure =
      sanitationHeadcount >= SUPPORT_TARGET_HEADCOUNT
        ? 0
        : Math.max(
            0,
            Math.min(100, (SUPPORT_TARGET_HEADCOUNT - sanitationHeadcount) * 35) -
              operationsSupport * 100,
          );

    return {
      productivityMultiplier: Math.max(
        0.5,
        coordinationMultiplier - congestionPenalty + trainingProductivityBonus,
      ),
      coordinationMultiplier,
      congestionPenalty,
      conditionPressure,
      trainingProductivityBonus,
      operationsSupport,
      inventorySupport,
      sanitationPressure: supportPressure(sanitationHeadcount),
      inventoryPressure: inventorySupportPressure(inventoryHeadcount),
      managementPressure: supportPressure(managementHeadcount),
    };
  }

  private calculateEffectiveRate(pool: LaborPool, modifiers: LaborModifiers): number {
    if (pool.roleId === LaborRole.SwitchDriver) {
      return pool.assignedHeadcount * pool.baseRate;
    }

    if (
      pool.roleId === LaborRole.InventoryTeam ||
      pool.roleId === LaborRole.Sanitation ||
      pool.roleId === LaborRole.Management
    ) {
      return pool.assignedHeadcount * pool.baseRate;
    }

    return (
      pool.assignedHeadcount *
      CUBIC_FEET_PER_WORKER_TICK *
      pool.baseRate *
      modifiers.productivityMultiplier
    );
  }

  private calculateUtilization(
    roleId: LaborRole,
    activeWorkload: number,
    pool: LaborPool,
  ): number {
    if (activeWorkload <= 0) {
      return 0;
    }

    if (
      roleId === LaborRole.InventoryTeam ||
      roleId === LaborRole.Sanitation ||
      roleId === LaborRole.Management
    ) {
      return Math.min(2, activeWorkload / Math.max(1, pool.assignedHeadcount));
    }

    if (pool.effectiveRate <= 0) {
      return 1;
    }

    return activeWorkload / pool.effectiveRate;
  }

  private calculatePressure(pool: LaborPool, activeWorkload: number): LaborPressure {
    if (pool.roleId === LaborRole.Sanitation) {
      return supportPressure(pool.assignedHeadcount);
    }

    if (pool.roleId === LaborRole.InventoryTeam) {
      return inventorySupportPressure(pool.assignedHeadcount, pool.activeWorkload);
    }

    if (pool.roleId === LaborRole.Management) {
      return supportPressure(pool.assignedHeadcount);
    }

    if (activeWorkload > 0 && pool.assignedHeadcount === 0) {
      return "critical";
    }

    if (activeWorkload <= 0) {
      return "healthy";
    }

    if (pool.utilization >= 1) {
      return "strained";
    }

    if (pool.utilization >= 0.75) {
      return "busy";
    }

    if (pool.utilization >= 0.5) {
      return "stable";
    }

    return "healthy";
  }

  private calculatePressureSummary(pools: LaborPool[]): LaborState["pressure"] {
    const bottlenecks = pools
      .map((pool) => this.createBottleneck(pool))
      .filter((bottleneck): bottleneck is LaborBottleneck => bottleneck !== null)
      .sort(compareBottlenecks);

    return {
      bottlenecks,
      criticalCount: bottlenecks.filter((bottleneck) => bottleneck.pressure === "critical").length,
      topBottleneck: bottlenecks[0] ?? null,
    };
  }

  private createBottleneck(pool: LaborPool): LaborBottleneck | null {
    if (pool.pressure === "healthy" || pool.pressure === "stable") {
      return null;
    }

    const label = this.getRoleLabel(pool.roleId);
    const supportRole =
      pool.roleId === LaborRole.InventoryTeam ||
      pool.roleId === LaborRole.Sanitation ||
      pool.roleId === LaborRole.Management;

    return {
      roleId: pool.roleId,
      label,
      pressure: pool.pressure,
      queuedWork: pool.activeWorkload,
      assignedHeadcount: pool.assignedHeadcount,
      effectiveRate: pool.effectiveRate,
      reason: supportRole
        ? `${label} is understaffed and creating support pressure.`
        : `${label} cannot keep up with queued work.`,
      recommendation:
        pool.assignedHeadcount === 0
          ? `Assign at least one worker to ${label}.`
          : `Add workers to ${label} or reduce incoming work.`,
    };
  }

  private getPool(labor: LaborState, roleId: LaborRole): LaborPool | undefined {
    return labor.pools.find((pool) => pool.roleId === roleId);
  }
}

function createInitialAssignments(totalHeadcount: number): Record<LaborRole, number> {
  const roles = Object.values(LaborRole);
  const baselineAssignments = { ...defaultAssignments };

  if (totalHeadcount >= DEFAULT_TOTAL_HEADCOUNT) {
    return baselineAssignments;
  }

  const minimumAssignments = roles.reduce(
    (assignments, roleId) => {
      assignments[roleId] =
        totalHeadcount >= roles.length && (baselineAssignments[roleId] ?? 0) > 0 ? 1 : 0;
      return assignments;
    },
    {} as Record<LaborRole, number>,
  );

  let remainingHeadcount = Math.max(
    0,
    totalHeadcount - roles.reduce((total, roleId) => total + minimumAssignments[roleId], 0),
  );

  if (remainingHeadcount === 0) {
    return minimumAssignments;
  }

  const upgradeWeights = roles.map((roleId) => ({
    roleId,
    weight: Math.max(0, (baselineAssignments[roleId] ?? 0) - minimumAssignments[roleId]),
  }));
  const totalWeight = upgradeWeights.reduce((total, entry) => total + entry.weight, 0);

  if (totalWeight <= 0) {
    return minimumAssignments;
  }

  const weightedAllocations = upgradeWeights.map((entry, index) => {
    const exact = (remainingHeadcount * entry.weight) / totalWeight;

    return {
      roleId: entry.roleId,
      base: Math.floor(exact),
      remainder: exact - Math.floor(exact),
      index,
    };
  });

  for (const allocation of weightedAllocations) {
    minimumAssignments[allocation.roleId] += allocation.base;
    remainingHeadcount -= allocation.base;
  }

  weightedAllocations
    .sort((first, second) => {
      if (second.remainder !== first.remainder) {
        return second.remainder - first.remainder;
      }

      return first.index - second.index;
    })
    .slice(0, remainingHeadcount)
    .forEach((allocation) => {
      minimumAssignments[allocation.roleId] += 1;
    });

  return minimumAssignments;
}

function supportPressure(assignedHeadcount: number): LaborPressure {
  if (assignedHeadcount <= 0) {
    return "critical";
  }

  if (assignedHeadcount < SUPPORT_TARGET_HEADCOUNT) {
    return "strained";
  }

  return "healthy";
}

function inventorySupportPressure(
  assignedHeadcount: number,
  targetHeadcount: number = 1,
): LaborPressure {
  if (assignedHeadcount <= 0) {
    return "critical";
  }

  if (assignedHeadcount < Math.max(1, targetHeadcount)) {
    return "strained";
  }

  return "healthy";
}

function compareBottlenecks(first: LaborBottleneck, second: LaborBottleneck): number {
  const pressureDifference = pressureRank(second.pressure) - pressureRank(first.pressure);

  if (pressureDifference !== 0) {
    return pressureDifference;
  }

  const queueDifference = second.queuedWork - first.queuedWork;

  if (queueDifference !== 0) {
    return queueDifference;
  }

  return (roleSortOrder.get(first.roleId) ?? 0) - (roleSortOrder.get(second.roleId) ?? 0);
}

function pressureRank(pressure: LaborPressure): number {
  switch (pressure) {
    case "critical":
      return 5;
    case "strained":
      return 4;
    case "busy":
      return 3;
    case "stable":
      return 2;
    case "healthy":
      return 1;
  }
}
