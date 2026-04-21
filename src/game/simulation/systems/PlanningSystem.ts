import type { GameState, MonthlyPlan, PlanningSnapshot } from "../core/GameState";
import { createLaborAssignmentPlan, getMonthKey } from "../core/GameState";
import {
  activateAcceptedContractOffers,
  generateMonthlyContractOffers,
} from "../contracts/contractOffers";
import type { RandomService } from "../core/RandomService";
import type { DomainEvent } from "../events/DomainEvent";
import type { MonthlyPlanConfirmedEvent } from "../events/MonthlyPlanConfirmedEvent";
import type { MonthlyPlanningOpenedEvent } from "../events/MonthlyPlanningOpenedEvent";
import { LaborAnalyticsRecorder } from "../labor/LaborAnalyticsRecorder";
import { LaborManager } from "../labor/LaborManager";
import {
  cloneBudgetPlan,
  getBudgetCostPerTick,
  validateBudgetPlan,
} from "../planning/BudgetPlan";
import { GameSpeed } from "../types/enums";

type EventFactory = <TType extends string>(type: TType) => DomainEvent<TType>;

const laborAnalyticsRecorder = new LaborAnalyticsRecorder();
const laborManager = new LaborManager();

interface OpenPlanningOptions {
  monthKey?: string;
  resetCurrentMonthEconomy?: boolean;
  regenerateOffers?: boolean;
  setSpeedToSlow?: boolean;
}

export class PlanningSystem {
  update(
    state: GameState,
    random: RandomService,
    createEvent: EventFactory,
  ): DomainEvent[] {
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

    return openMonthlyPlanning(state, random, createEvent, {
      monthKey,
      regenerateOffers: true,
      resetCurrentMonthEconomy: true,
      setSpeedToSlow: true,
    });
  }
}

export function openMonthlyPlanning(
  state: GameState,
  random: RandomService,
  createEvent: EventFactory,
  options: OpenPlanningOptions = {},
): DomainEvent[] {
  if (state.planning.isPlanningActive) {
    return [];
  }

  const monthKey = options.monthKey ?? getMonthKey(state.calendar);
  const pendingPlan: MonthlyPlan = {
    monthKey,
    totalHeadcount: state.planning.currentPlan.totalHeadcount,
    budget: cloneBudgetPlan(state.planning.currentPlan.budget),
    laborAssignments: createLaborAssignmentPlan(state.labor),
  };

  state.planning.isPlanningActive = true;
  state.planning.activePlanId = `plan-${monthKey}`;
  state.planning.lastOpenedMonthKey = monthKey;
  state.planning.pendingPlan = pendingPlan;
  state.planning.latestSnapshot = createPlanningSnapshot(state, monthKey, pendingPlan);

  if (options.regenerateOffers) {
    state.contracts.pendingOffers = generateMonthlyContractOffers(state, monthKey, random);
  }

  if (options.setSpeedToSlow) {
    state.speed = GameSpeed.Slow;
  }

  if (options.resetCurrentMonthEconomy) {
    resetCurrentMonthEconomy(state);
    laborAnalyticsRecorder.resetForMonth(state.labor, monthKey, state.currentTick);
  }

  const event: MonthlyPlanningOpenedEvent = {
    ...createEvent("monthly-planning-opened"),
    monthKey,
    planId: state.planning.activePlanId,
  };

  return [event];
}

export function applyQueuedMonthlyPlan(
  state: GameState,
  createEvent: EventFactory,
): DomainEvent[] {
  const queuedPlan = state.planning.queuedPlan;

  if (!queuedPlan) {
    return [];
  }

  for (const pool of state.labor.pools) {
    pool.assignedHeadcount = queuedPlan.laborAssignments[pool.roleId] ?? 0;
    pool.availableHeadcount = pool.assignedHeadcount;
  }

  state.labor.totalHeadcount = queuedPlan.totalHeadcount;

  laborManager.recalculate(
    state.labor,
    laborManager.calculateWorkloads(state.freightFlow),
    queuedPlan.budget,
  );

  activateAcceptedContractOffers(state);

  state.planning.currentPlan = {
    monthKey: queuedPlan.monthKey,
    totalHeadcount: queuedPlan.totalHeadcount,
    budget: cloneBudgetPlan(queuedPlan.budget),
    laborAssignments: { ...queuedPlan.laborAssignments },
  };
  state.planning.lastConfirmedMonthKey = queuedPlan.monthKey;
  state.planning.queuedPlan = null;

  const event: MonthlyPlanConfirmedEvent = {
    ...createEvent("monthly-plan-confirmed"),
    monthKey: state.planning.currentPlan.monthKey,
    totalHeadcount: state.planning.currentPlan.totalHeadcount,
    budget: cloneBudgetPlan(state.planning.currentPlan.budget),
    laborAssignments: { ...state.planning.currentPlan.laborAssignments },
  };

  return [event];
}

export function createPlanningSnapshot(
  state: GameState,
  monthKey: string,
  plan: MonthlyPlan,
): PlanningSnapshot {
  const storageZones = state.warehouseMap.zones.filter((zone) => zone.capacityCubicFeet > 0);
  const activeAlerts = state.alerts.alerts.filter((alert) => alert.active);
  const contract = [...state.contracts.activeContracts].sort(
    (first, second) => contractHealthRank(second.health) - contractHealthRank(first.health),
  )[0];

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
    activeContractCount: state.contracts.activeContracts.length,
    acceptedOfferCount: state.contracts.pendingOffers.filter(
      (offer) => offer.decision === "accepted",
    ).length,
  };
}

export function validateMonthlyPlan(state: GameState, plan: MonthlyPlan): string | null {
  if (
    !Number.isFinite(plan.totalHeadcount) ||
    !Number.isInteger(plan.totalHeadcount) ||
    plan.totalHeadcount < 0
  ) {
    return "Planned total headcount must be a non-negative integer";
  }

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

  if (totalAssigned > plan.totalHeadcount) {
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

function contractHealthRank(health: string): number {
  switch (health) {
    case "critical":
      return 4;
    case "at-risk":
      return 3;
    case "stable":
      return 2;
    case "healthy":
      return 1;
    default:
      return 0;
  }
}
