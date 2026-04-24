import { describe, expect, it } from "vitest";
import { ApplyBudgetPlanCommand } from "../../game/simulation/commands/ApplyBudgetPlanCommand";
import { AssignPlannedLaborCommand } from "../../game/simulation/commands/AssignPlannedLaborCommand";
import { ChangeSpeedCommand } from "../../game/simulation/commands/ChangeSpeedCommand";
import { ConfirmMonthlyPlanCommand } from "../../game/simulation/commands/ConfirmMonthlyPlanCommand";
import { OpenMonthlyPlanningCommand } from "../../game/simulation/commands/OpenMonthlyPlanningCommand";
import { PaintZoneCommand } from "../../game/simulation/commands/PaintZoneCommand";
import { SetMonthlyReviewSkipCommand } from "../../game/simulation/commands/SetMonthlyReviewSkipCommand";
import { SetContractOfferDecisionCommand } from "../../game/simulation/commands/SetContractOfferDecisionCommand";
import { SetPlannedTotalHeadcountCommand } from "../../game/simulation/commands/SetPlannedTotalHeadcountCommand";
import { SimulationRunner } from "../../game/simulation/core/SimulationRunner";
import type { DomainEvent } from "../../game/simulation/events/DomainEvent";
import { selectPlanningInventorySupportRecommendation } from "../../game/simulation/selectors/planningSelectors";
import { LaborRole, GameSpeed, TileZoneType } from "../../game/simulation/types/enums";

const rolloverCalendar = {
  year: 1,
  month: 1,
  day: 30,
  hour: 23,
  minute: 59,
};

function createRunnerAtMonthEnd(): SimulationRunner {
  return new SimulationRunner({ initialCalendar: rolloverCalendar });
}

function openPlanning(runner: SimulationRunner) {
  runner.tick();
  return runner.getState().planning;
}

describe("monthly planning", () => {
  it("can open the first monthly planning dialog on a new game start", () => {
    const runner = new SimulationRunner({ openInitialPlanning: true });
    const state = runner.getState();

    expect(state.planning.isPlanningActive).toBe(true);
    expect(state.planning.pendingPlan?.monthKey).toBe("Y1-M1");
    expect(state.planning.pendingPlan?.totalHeadcount).toBe(12);
    expect(state.planning.queuedPlan).toBeNull();
    expect(state.planning.latestSnapshot?.monthKey).toBe("Y1-M1");
    expect(state.contracts.pendingOffers).toHaveLength(4);
    expect(state.speed).toBe(GameSpeed.Paused);
  });

  it("opens planning once at the month boundary and shifts speed to slow", () => {
    const runner = createRunnerAtMonthEnd();
    const openedEvents: DomainEvent[] = [];

    runner.dispatch(new ChangeSpeedCommand(GameSpeed.Fast));
    runner.getEventBus().subscribe("monthly-planning-opened", (event) => {
      openedEvents.push(event);
    });

    runner.tick();

    const state = runner.getState();
    expect(state.calendar.month).toBe(2);
    expect(state.planning.isPlanningActive).toBe(true);
    expect(state.planning.lastOpenedMonthKey).toBe("Y1-M2");
    expect(state.planning.pendingPlan?.monthKey).toBe("Y1-M2");
    expect(state.contracts.pendingOffers).toHaveLength(4);
    expect(state.speed).toBe(GameSpeed.Slow);
    expect(openedEvents).toHaveLength(1);

    runner.tick();

    expect(openedEvents).toHaveLength(1);
  });

  it("pauses from hyper speed when monthly planning opens", () => {
    const runner = createRunnerAtMonthEnd();

    runner.dispatch(new ChangeSpeedCommand(GameSpeed.Hyper));
    runner.tick();

    expect(runner.getState().planning.isPlanningActive).toBe(true);
    expect(runner.getState().speed).toBe(GameSpeed.Paused);
  });

  it("updates pending budget only during active planning", () => {
    const inactiveRunner = new SimulationRunner();

    expect(
      inactiveRunner.dispatch(
        new ApplyBudgetPlanCommand({
          maintenance: 1,
          training: 1,
          safety: 1,
          operationsSupport: 1,
          inventorySupport: 1,
          contingency: 1,
        }),
      ).success,
    ).toBe(false);

    const runner = createRunnerAtMonthEnd();
    openPlanning(runner);

    const budget = {
      maintenance: 8,
      training: 6,
      safety: 7,
      operationsSupport: 4,
      inventorySupport: 5,
      contingency: 3,
    };
    const result = runner.dispatch(new ApplyBudgetPlanCommand(budget));

    expect(result.success).toBe(true);
    expect(runner.getState().planning.pendingPlan?.budget).toEqual(budget);
    expect(runner.getState().planning.currentPlan.budget).not.toEqual(budget);
    expect(runner.getState().debug.lastCommandType).toBe("apply-budget-plan");
    expect(runner.getState().debug.lastEventType).toBe("budget-plan-updated");
  });

  it("rejects invalid budget values", () => {
    const runner = createRunnerAtMonthEnd();
    openPlanning(runner);

    const result = runner.dispatch(
      new ApplyBudgetPlanCommand({
        maintenance: -1,
        training: 0,
        safety: 0,
        operationsSupport: 0,
        inventorySupport: 0,
        contingency: 0,
      }),
    );

    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain("maintenance budget");
  });

  it("rejects planned labor above total headcount", () => {
    const runner = createRunnerAtMonthEnd();
    openPlanning(runner);

    const result = runner.dispatch(new AssignPlannedLaborCommand(LaborRole.Load, 13));

    expect(result.success).toBe(false);
    expect(result.errors[0]).toBe("Planned labor assignments exceed total headcount");
  });

  it("rejects planned total headcount below assigned labor", () => {
    const runner = createRunnerAtMonthEnd();
    openPlanning(runner);

    const result = runner.dispatch(new SetPlannedTotalHeadcountCommand(11));

    expect(result.success).toBe(false);
    expect(result.errors[0]).toBe("Planned total headcount cannot be lower than assigned labor");
  });

  it("confirms budget and labor assignments into authoritative state", () => {
    const runner = createRunnerAtMonthEnd();
    const confirmedEvents: DomainEvent[] = [];

    runner.getEventBus().subscribe("monthly-plan-confirmed", (event) => {
      confirmedEvents.push(event);
    });

    openPlanning(runner);

    const budget = {
      maintenance: 12,
      training: 10,
      safety: 9,
      operationsSupport: 8,
      inventorySupport: 6,
      contingency: 2,
    };

    expect(runner.dispatch(new ApplyBudgetPlanCommand(budget)).success).toBe(true);
    expect(runner.dispatch(new SetPlannedTotalHeadcountCommand(20)).success).toBe(true);
    expect(runner.dispatch(new AssignPlannedLaborCommand(LaborRole.Sanitation, 1)).success).toBe(
      true,
    );

    const result = runner.dispatch(new ConfirmMonthlyPlanCommand());
    const queuedState = runner.getState();

    expect(result.success).toBe(true);
    expect(queuedState.planning.isPlanningActive).toBe(false);
    expect(queuedState.planning.pendingPlan).toBeNull();
    expect(queuedState.planning.queuedPlan?.monthKey).toBe("Y1-M2");
    expect(queuedState.planning.queuedPlan?.totalHeadcount).toBe(20);
    expect(queuedState.planning.currentPlan.monthKey).toBe("Y1-M1");
    expect(queuedState.planning.currentPlan.totalHeadcount).toBe(12);
    expect(queuedState.planning.currentPlan.budget).not.toEqual(budget);
    expect(queuedState.planning.lastConfirmedMonthKey).toBe("Y1-M1");
    expect(queuedState.debug.lastCommandType).toBe("confirm-monthly-plan");
    expect(queuedState.debug.lastEventType).toBe("monthly-plan-queued");

    runner.tick();

    const state = runner.getState();

    expect(state.planning.queuedPlan).toBeNull();
    expect(state.planning.currentPlan.monthKey).toBe("Y1-M2");
    expect(state.planning.currentPlan.totalHeadcount).toBe(20);
    expect(state.planning.currentPlan.budget).toEqual(budget);
    expect(state.planning.lastConfirmedMonthKey).toBe("Y1-M2");
    expect(state.labor.totalHeadcount).toBe(20);
    expect(
      state.labor.pools.find((pool) => pool.roleId === LaborRole.Sanitation)?.assignedHeadcount,
    ).toBe(
      1,
    );
    expect(state.labor.unassignedHeadcount).toBe(8);
    expect(confirmedEvents).toHaveLength(1);
  });

  it("activates accepted contract offers when the monthly plan is confirmed", () => {
    const runner = createRunnerAtMonthEnd();
    openPlanning(runner);
    const offerId = runner.getState().contracts.pendingOffers[0]?.id;

    expect(offerId).toBeTruthy();
    expect(
      runner.dispatch(new SetContractOfferDecisionCommand(offerId ?? "", "accepted")).success,
    ).toBe(true);

    const result = runner.dispatch(new ConfirmMonthlyPlanCommand());
    const state = runner.getState();

    expect(result.success).toBe(true);
    expect(state.contracts.pendingOffers).toHaveLength(4);
    expect(state.contracts.activeContracts).toHaveLength(1);

    runner.tick();

    expect(runner.getState().contracts.pendingOffers).toHaveLength(0);
    expect(runner.getState().contracts.activeContracts.length).toBeGreaterThan(1);
    expect(
      runner
        .getState()
        .contracts.activeContracts.some((contract) => contract.id !== "baseline-general-freight"),
    ).toBe(true);
  });

  it("budget support affects score and cost paths", () => {
    const lowBudgetRunner = new SimulationRunner();
    const highBudgetRunner = new SimulationRunner();

    lowBudgetRunner.getState().planning.currentPlan.budget = {
      maintenance: 0,
      training: 0,
      safety: 0,
      operationsSupport: 0,
      inventorySupport: 0,
      contingency: 0,
    };
    highBudgetRunner.getState().planning.currentPlan.budget = {
      maintenance: 20,
      training: 20,
      safety: 20,
      operationsSupport: 20,
      inventorySupport: 20,
      contingency: 5,
    };
    lowBudgetRunner.getState().scores.condition.value = 50;
    highBudgetRunner.getState().scores.condition.value = 50;
    lowBudgetRunner.getState().scores.safety.value = 50;
    highBudgetRunner.getState().scores.safety.value = 50;

    lowBudgetRunner.tick();
    highBudgetRunner.tick();

    expect(highBudgetRunner.getState().scores.condition.value).toBeGreaterThan(
      lowBudgetRunner.getState().scores.condition.value,
    );
    expect(highBudgetRunner.getState().scores.safety.value).toBeGreaterThan(
      lowBudgetRunner.getState().scores.safety.value,
    );
    expect(highBudgetRunner.getState().economy.operatingCostPerTick).toBeGreaterThan(
      lowBudgetRunner.getState().economy.operatingCostPerTick,
    );
    expect(highBudgetRunner.getState().labor.modifiers.productivityMultiplier).toBeGreaterThan(
      lowBudgetRunner.getState().labor.modifiers.productivityMultiplier,
    );
  });

  it("recommends inventory support from accepted monthly forecast volume", () => {
    const runner = createRunnerAtMonthEnd();
    openPlanning(runner);
    const offer = runner.getState().contracts.pendingOffers[0];

    expect(offer).toBeTruthy();
    expect(
      runner.dispatch(new SetContractOfferDecisionCommand(offer?.id ?? "", "accepted")).success,
    ).toBe(true);

    const recommendation = selectPlanningInventorySupportRecommendation(runner.getState());

    expect(recommendation.forecastMonthlyVolumeCubicFeet).toBe(
      offer?.expectedMonthlyThroughputCubicFeet ?? 0,
    );
    expect(recommendation.suggestedHeadcount).toBe(1);
    expect(recommendation.suggestedBudgetPoints).toBe(5);
  });

  it("blocks operational mutation commands and speed changes while planning is active", () => {
    const runner = createRunnerAtMonthEnd();
    openPlanning(runner);

    expect(runner.dispatch(new ChangeSpeedCommand(GameSpeed.Fast)).success).toBe(false);
    expect(runner.dispatch(new PaintZoneCommand(4, 4, TileZoneType.Travel)).success).toBe(false);
  });

  it("can open planning manually during the month without resetting monthly economy", () => {
    const runner = new SimulationRunner();
    runner.getState().economy.currentMonthRevenue = 1234;
    runner.getState().economy.currentMonthLaborCost = 456;
    runner.getState().economy.currentMonthOperatingCost = 78;
    runner.getState().economy.currentMonthNet = 700;

    const result = runner.dispatch(new OpenMonthlyPlanningCommand());
    const state = runner.getState();

    expect(result.success).toBe(true);
    expect(state.planning.isPlanningActive).toBe(true);
    expect(state.planning.pendingPlan?.monthKey).toBe("Y1-M1");
    expect(state.planning.pendingPlan?.totalHeadcount).toBe(12);
    expect(state.planning.latestSnapshot?.currentMonthRevenue).toBe(1234);
    expect(state.economy.currentMonthRevenue).toBe(1234);
    expect(state.contracts.pendingOffers).toHaveLength(0);
  });

  it("can skip future monthly reviews while keeping the active plan in force", () => {
    const runner = createRunnerAtMonthEnd();
    openPlanning(runner);

    expect(runner.dispatch(new SetMonthlyReviewSkipCommand(true)).success).toBe(true);
    expect(runner.dispatch(new ConfirmMonthlyPlanCommand()).success).toBe(true);

    runner.tick();

    const state = runner.getState();
    expect(state.planning.skipMonthlyReviews).toBe(true);
    expect(state.planning.isPlanningActive).toBe(false);
    expect(state.planning.currentPlan.monthKey).toBe("Y1-M2");
    expect(state.planning.lastConfirmedMonthKey).toBe("Y1-M2");
    expect(state.economy.currentMonthRevenue).toBe(0);
  });

  it("does not advance simulation time while planning is open", () => {
    const runner = new SimulationRunner({ openInitialPlanning: true });
    const startingTick = runner.getState().currentTick;
    const startingCalendar = { ...runner.getState().calendar };

    runner.tick();
    const executedTicks = runner.tickMany(5);

    expect(runner.getState().currentTick).toBe(startingTick);
    expect(runner.getState().calendar).toEqual(startingCalendar);
    expect(executedTicks).toBe(0);
  });
});
