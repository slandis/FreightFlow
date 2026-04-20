import type { GameState, MonthlyPlan, PlanningSnapshot } from "../core/GameState";
import { createLaborAssignmentPlan, getMonthKey } from "../core/GameState";
import type { DomainEvent } from "../events/DomainEvent";
import {
  cloneBudgetPlan,
  getBudgetCostPerTick,
  validateBudgetPlan,
} from "../planning/BudgetPlan";
import { GameSpeed } from "../types/enums";

type EventFactory = <TType extends string>(type: TType) => DomainEvent<TType>;

export class PlanningSystem {
  update(state: GameState, createEvent: EventFactory): DomainEvent[] {
    const monthKey = getMonthKey(state.calendar);

    if (state.planning.isPlanningActive) {
      return [];
    }

    if (
      state.planning.currentPlan.monthKey === monthKey ||
      state.planning.lastOpenedMonthKey === monthKey
    ) {
      return [];
    }

    return this.openMonthlyPlanning(state, monthKey, createEvent);
  }

  openMonthlyPlanning(
    state: GameState,
    monthKey: string,
    createEvent: EventFactory,
  ): DomainEvent[] {
    const pendingPlan: MonthlyPlan = {
      monthKey,
      budget: cloneBudgetPlan(state.planning.currentPlan.budget),
      laborAssignments: createLaborAssignmentPlan(state.labor),
    };

    const snapshot = createPlanningSnapshot(state, monthKey, pendingPlan);

    state.planning.isPlanningActive = true;
    state.planning.activePlanId = `plan-${monthKey}`;
    state.planning.lastOpenedMonthKey = monthKey;
    state.planning.pendingPlan = pendingPlan;
    state.planning.latestSnapshot = snapshot;
    state.speed = GameSpeed.Slow;
    resetCurrentMonthEconomy(state);

    const event = {
      ...createEvent("monthly-planning-opened"),
      monthKey,
      planId: state.planning.activePlanId,
    };

    return [event];
  }
}

export function createPlanningSnapshot(
  state: GameState,
  monthKey: string,
  plan: MonthlyPlan,
): PlanningSnapshot {
  const storageZones = state.warehouseMap.zones.filter((zone) => zone.capacityCubicFeet > 0);
  const activeAlerts = state.alerts.alerts.filter((alert) => alert.active);
  const contract = state.contracts.activeContracts[0];

  return {
    monthKey,
    year: state.calendar.year,
    month: state.calendar.month,
    openedTick: state.currentTick,
    cash: state.cash,
    currentMonthRevenue: state.economy.currentMonthRevenue,
    currentMonthLaborCost: state.economy.currentMonthLaborCost,
    currentMonthOperatingCost: state.economy.currentMonthOperatingCost,
    currentMonthNet: state.economy.currentMonthNet,
    inboundCubicFeet: state.kpis.inboundCubicFeet,
    outboundCubicFeet: state.kpis.outboundCubicFeet,
    throughputCubicFeet: state.kpis.throughputCubicFeet,
    yardTrailers: state.freightFlow.queues.yardTrailers,
    dockFreightCubicFeet: state.freightFlow.queues.dockFreightCubicFeet,
    storageQueueCubicFeet: state.freightFlow.queues.storageQueueCubicFeet,
    pickQueueCubicFeet: state.freightFlow.queues.pickQueueCubicFeet,
    loadQueueCubicFeet: state.freightFlow.queues.loadQueueCubicFeet,
    moraleScore: state.scores.morale.value,
    conditionScore: state.scores.condition.value,
    safetyScore: state.scores.safety.value,
    clientSatisfactionScore: state.scores.clientSatisfaction.value,
    customerSatisfactionScore: state.scores.customerSatisfaction.value,
    serviceLevel: state.contracts.serviceLevel,
    contractHealth: contract?.health ?? "stable",
    totalHeadcount: state.labor.totalHeadcount,
    unassignedHeadcount: state.labor.unassignedHeadcount,
    topBottleneckLabel: state.labor.pressure.topBottleneck?.label ?? null,
    topBottleneckPressure: state.labor.pressure.topBottleneck?.pressure ?? null,
    storageUsedCubicFeet: storageZones.reduce((total, zone) => total + zone.usedCubicFeet, 0),
    storageCapacityCubicFeet: storageZones.reduce(
      (total, zone) => total + zone.capacityCubicFeet,
      0,
    ),
    dockStorageNeedCount: state.freightFlow.freightBatches.filter(
      (batch) => batch.state === "on-dock",
    ).length,
    activeAlertCount: activeAlerts.length,
    criticalAlertCount: activeAlerts.filter((alert) => alert.severity === "critical").length,
    projectedBudgetCostPerTick: getBudgetCostPerTick(plan.budget),
  };
}

export function validateMonthlyPlan(state: GameState, plan: MonthlyPlan): string | null {
  const budgetError = validateBudgetPlan(plan.budget);

  if (budgetError) {
    return budgetError;
  }

  const totalAssigned = Object.values(plan.laborAssignments).reduce(
    (total, headcount) => total + headcount,
    0,
  );

  if (Object.values(plan.laborAssignments).some((headcount) => !isValidHeadcount(headcount))) {
    return "Planned labor assignments must be non-negative integers";
  }

  if (totalAssigned > state.labor.totalHeadcount) {
    return "Planned labor assignments exceed total headcount";
  }

  return null;
}

function isValidHeadcount(headcount: number): boolean {
  return Number.isFinite(headcount) && Number.isInteger(headcount) && headcount >= 0;
}

function resetCurrentMonthEconomy(state: GameState): void {
  state.economy.currentMonthRevenue = 0;
  state.economy.currentMonthLaborCost = 0;
  state.economy.currentMonthOperatingCost = 0;
  state.economy.currentMonthNet = 0;
}
