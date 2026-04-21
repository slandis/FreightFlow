import { LaborRole } from "../types/enums";
import type {
  LaborAnalyticsState,
  LaborRoleAnalytics,
  LaborState,
} from "./LaborPool";
import { LABOR_COST_PER_WORKER_PER_TICK } from "./laborCost";

const DIRECT_LABOR_ROLES = new Set<LaborRole>([
  LaborRole.SwitchDriver,
  LaborRole.Unload,
  LaborRole.Storage,
  LaborRole.Pick,
  LaborRole.Load,
]);

const SUPPORT_LABOR_ROLES = [LaborRole.Sanitation, LaborRole.Management] as const;

export class LaborAnalyticsRecorder {
  createInitialAnalytics(monthKey: string, startedTick = 0): LaborAnalyticsState {
    return {
      monthKey,
      startedTick,
      roles: Object.values(LaborRole).map((roleId) => createRoleAnalytics(roleId)),
    };
  }

  resetForMonth(labor: LaborState, monthKey: string, startedTick: number): void {
    labor.analytics = this.createInitialAnalytics(monthKey, startedTick);
  }

  recordTick(labor: LaborState): void {
    for (const pool of labor.pools) {
      const analytics = getRoleAnalytics(labor.analytics, pool.roleId);

      analytics.totalHeadcountTicks += pool.assignedHeadcount;
      analytics.totalLaborCost += pool.assignedHeadcount * LABOR_COST_PER_WORKER_PER_TICK;

      if (pool.activeWorkload > 0) {
        analytics.activeHeadcountTicks += pool.assignedHeadcount;
      }
    }
  }

  recordCompletedWork(
    labor: LaborState,
    roleId: LaborRole,
    cubicFeet: number,
    taskTicks: number,
  ): void {
    const boundedCubicFeet = Math.max(0, cubicFeet);
    const boundedTaskTicks = Math.max(1, taskTicks);
    const analytics = getRoleAnalytics(labor.analytics, roleId);

    analytics.directCubicFeetProcessed += boundedCubicFeet;
    analytics.completedTaskCount += 1;
    analytics.totalTaskTicks += boundedTaskTicks;

    if (!DIRECT_LABOR_ROLES.has(roleId)) {
      return;
    }

    for (const supportRole of SUPPORT_LABOR_ROLES) {
      const supportPool = labor.pools.find((pool) => pool.roleId === supportRole);

      if (!supportPool || supportPool.assignedHeadcount <= 0) {
        continue;
      }

      const supportAnalytics = getRoleAnalytics(labor.analytics, supportRole);
      supportAnalytics.attributedCubicFeetProcessed += boundedCubicFeet;
      supportAnalytics.completedTaskCount += 1;
      supportAnalytics.totalTaskTicks += boundedTaskTicks;
    }
  }
}

function createRoleAnalytics(roleId: LaborRole): LaborRoleAnalytics {
  return {
    roleId,
    directCubicFeetProcessed: 0,
    attributedCubicFeetProcessed: 0,
    completedTaskCount: 0,
    totalTaskTicks: 0,
    totalLaborCost: 0,
    totalHeadcountTicks: 0,
    activeHeadcountTicks: 0,
  };
}

function getRoleAnalytics(
  analytics: LaborAnalyticsState,
  roleId: LaborRole,
): LaborRoleAnalytics {
  const roleAnalytics = analytics.roles.find((role) => role.roleId === roleId);

  if (!roleAnalytics) {
    throw new Error(`Missing labor analytics for role ${roleId}`);
  }

  return roleAnalytics;
}
