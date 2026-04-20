import { describe, expect, it } from "vitest";
import { ApplyBudgetPlanCommand } from "../../game/simulation/commands/ApplyBudgetPlanCommand";
import { AssignPlannedLaborCommand } from "../../game/simulation/commands/AssignPlannedLaborCommand";
import { ChangeSpeedCommand } from "../../game/simulation/commands/ChangeSpeedCommand";
import { ConfirmMonthlyPlanCommand } from "../../game/simulation/commands/ConfirmMonthlyPlanCommand";
import { PaintZoneCommand } from "../../game/simulation/commands/PaintZoneCommand";
import { SimulationRunner } from "../../game/simulation/core/SimulationRunner";
import type { DomainEvent } from "../../game/simulation/events/DomainEvent";
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
    expect(state.speed).toBe(GameSpeed.Slow);
    expect(openedEvents).toHaveLength(1);

    runner.tick();

    expect(openedEvents).toHaveLength(1);
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
        contingency: 0,
      }),
    );

    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain("maintenance budget");
  });

  it("rejects planned labor above total headcount", () => {
    const runner = createRunnerAtMonthEnd();
    openPlanning(runner);

    const result = runner.dispatch(new AssignPlannedLaborCommand(LaborRole.Load, 18));

    expect(result.success).toBe(false);
    expect(result.errors[0]).toBe("Planned labor assignments exceed total headcount");
  });

  it("confirms budget and labor assignments into authoritative state", () => {
    const runner = createRunnerAtMonthEnd();
    openPlanning(runner);

    const budget = {
      maintenance: 12,
      training: 10,
      safety: 9,
      operationsSupport: 8,
      contingency: 2,
    };

    expect(runner.dispatch(new ApplyBudgetPlanCommand(budget)).success).toBe(true);
    expect(runner.dispatch(new AssignPlannedLaborCommand(LaborRole.Sanitation, 1)).success).toBe(
      true,
    );

    const result = runner.dispatch(new ConfirmMonthlyPlanCommand());
    const state = runner.getState();

    expect(result.success).toBe(true);
    expect(state.planning.isPlanningActive).toBe(false);
    expect(state.planning.pendingPlan).toBeNull();
    expect(state.planning.currentPlan.monthKey).toBe("Y1-M2");
    expect(state.planning.currentPlan.budget).toEqual(budget);
    expect(state.planning.lastConfirmedMonthKey).toBe("Y1-M2");
    expect(
      state.labor.pools.find((pool) => pool.roleId === LaborRole.Sanitation)?.assignedHeadcount,
    ).toBe(
      1,
    );
    expect(state.debug.lastCommandType).toBe("confirm-monthly-plan");
    expect(state.debug.lastEventType).toBe("monthly-plan-confirmed");
  });

  it("budget support affects score and cost paths", () => {
    const lowBudgetRunner = new SimulationRunner();
    const highBudgetRunner = new SimulationRunner();

    lowBudgetRunner.getState().planning.currentPlan.budget = {
      maintenance: 0,
      training: 0,
      safety: 0,
      operationsSupport: 0,
      contingency: 0,
    };
    highBudgetRunner.getState().planning.currentPlan.budget = {
      maintenance: 20,
      training: 20,
      safety: 20,
      operationsSupport: 20,
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

  it("blocks operational mutation commands and speed changes while planning is active", () => {
    const runner = createRunnerAtMonthEnd();
    openPlanning(runner);

    expect(runner.dispatch(new ChangeSpeedCommand(GameSpeed.Fast)).success).toBe(false);
    expect(runner.dispatch(new PaintZoneCommand(4, 4, TileZoneType.Travel)).success).toBe(false);
  });
});
