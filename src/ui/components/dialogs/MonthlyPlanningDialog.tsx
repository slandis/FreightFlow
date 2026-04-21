import { useState } from "react";
import type { ReactNode } from "react";
import { ApplyBudgetPlanCommand } from "../../../game/simulation/commands/ApplyBudgetPlanCommand";
import { AssignPlannedLaborCommand } from "../../../game/simulation/commands/AssignPlannedLaborCommand";
import { ConfirmMonthlyPlanCommand } from "../../../game/simulation/commands/ConfirmMonthlyPlanCommand";
import { getDifficultyModeById } from "../../../game/simulation/config/difficulty";
import type { BudgetPlan } from "../../../game/simulation/core/GameState";
import { selectPlanningState } from "../../../game/simulation/selectors/planningSelectors";
import { LaborRole } from "../../../game/simulation/types/enums";
import { useSimulation, useSimulationState } from "../../hooks/useSimulation";
import { type PlanningPage, useUiStore } from "../../store/uiStore";

const planningPages: Array<{ id: PlanningPage; label: string }> = [
  { id: "forecast", label: "Forecast" },
  { id: "workforce", label: "Workforce" },
  { id: "condition", label: "Condition" },
  { id: "satisfaction", label: "Satisfaction" },
  { id: "budgeting", label: "Budgeting" },
  { id: "productivity", label: "Productivity" },
];

const budgetLabels: Record<keyof BudgetPlan, string> = {
  maintenance: "Maintenance",
  training: "Training",
  safety: "Safety",
  operationsSupport: "Operations Support",
  contingency: "Contingency",
};

const budgetHelp: Record<keyof BudgetPlan, string> = {
  maintenance: "Supports warehouse condition and offsets wear.",
  training: "Improves productive labor throughput.",
  safety: "Supports the safety score through the month.",
  operationsSupport: "Reduces support pressure from congestion and understaffed support roles.",
  contingency: "Reserved spend with no direct operational effect yet.",
};

const roleLabels: Record<LaborRole, string> = {
  [LaborRole.SwitchDriver]: "Switch Driver",
  [LaborRole.Unload]: "Inbound Unloading",
  [LaborRole.Storage]: "Inbound Storage",
  [LaborRole.Pick]: "Outbound Picking",
  [LaborRole.Load]: "Outbound Loading",
  [LaborRole.Sanitation]: "Sanitation",
  [LaborRole.Management]: "Management",
};

const roleOrder = Object.values(LaborRole);

export function MonthlyPlanningDialog() {
  const simulation = useSimulation();
  const planning = useSimulationState(selectPlanningState);
  const difficultyMode = useSimulationState((state) => getDifficultyModeById(state.difficultyModeId));
  const activePage = useUiStore((state) => state.activePlanningPage);
  const setActivePlanningPage = useUiStore((state) => state.setActivePlanningPage);
  const [error, setError] = useState<string | null>(null);

  const pendingPlan = planning.pendingPlan;
  const snapshot = planning.latestSnapshot;

  if (!planning.isPlanningActive || !pendingPlan || !snapshot) {
    return null;
  }

  const activePendingPlan = pendingPlan;
  const activeSnapshot = snapshot;

  const updateBudget = (category: keyof BudgetPlan, delta: number) => {
    const nextBudget = {
      ...activePendingPlan.budget,
      [category]: Math.max(0, activePendingPlan.budget[category] + delta),
    };
    const result = simulation.dispatch(new ApplyBudgetPlanCommand(nextBudget));

    setError(result.success ? null : result.errors[0] ?? "Budget update failed");
  };

  const updatePlannedLabor = (roleId: LaborRole, delta: number) => {
    const result = simulation.dispatch(
      new AssignPlannedLaborCommand(
        roleId,
        Math.max(0, (activePendingPlan.laborAssignments[roleId] ?? 0) + delta),
      ),
    );

    setError(result.success ? null : result.errors[0] ?? "Planned labor update failed");
  };

  const confirmPlan = () => {
    const result = simulation.dispatch(new ConfirmMonthlyPlanCommand());

    setError(result.success ? null : result.errors[0] ?? "Plan confirmation failed");
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-label="Monthly planning"
        aria-modal="true"
        className="monthly-planning-dialog"
        role="dialog"
      >
        <header>
          <div>
            <strong>Monthly Planning</strong>
            <p>
              Month {activeSnapshot.month}, Year {activeSnapshot.year}. Confirm the plan before
              returning to live operations.
            </p>
          </div>
          <button type="button" onClick={confirmPlan}>
            Confirm Plan
          </button>
        </header>

        {error ? <p className="planning-error">{error}</p> : null}

        <div className="planning-layout">
          <nav className="planning-nav" aria-label="Planning pages">
            {planningPages.map((page) => (
              <button
                className={page.id === activePage ? "active" : ""}
                key={page.id}
                onClick={() => setActivePlanningPage(page.id)}
                type="button"
              >
                {page.label}
              </button>
            ))}
          </nav>

          <div className="planning-page">{renderPlanningPage(activePage)}</div>
        </div>

        <footer className="planning-summary-bar">
          <span>Cash ${formatNumber(activeSnapshot.cash)}</span>
          <span>Net ${formatNumber(activeSnapshot.currentMonthNet)}</span>
          <span>Budget {getTotalBudgetPoints(activePendingPlan.budget)} pts</span>
          <span>Budget cost ${activeSnapshot.projectedBudgetCostPerTick.toFixed(1)}/tick</span>
          <span>Unassigned labor {getUnassignedPlannedLabor()}</span>
        </footer>
      </section>
    </div>
  );

  function renderPlanningPage(page: PlanningPage) {
    switch (page) {
      case "forecast":
        return (
          <PlanningSection title="Forecast">
            <PlanningStats
              rows={[
                ["Throughput", `${formatNumber(activeSnapshot.throughputCubicFeet)} cu ft`],
                ["Inbound", `${formatNumber(activeSnapshot.inboundCubicFeet)} cu ft`],
                ["Outbound", `${formatNumber(activeSnapshot.outboundCubicFeet)} cu ft`],
                ["Difficulty", difficultyMode.name],
                ["Forecast accuracy", `${Math.round(difficultyMode.forecastAccuracy * 100)}%`],
                ["Service level", `${activeSnapshot.serviceLevel.toFixed(0)}%`],
                ["Contract health", activeSnapshot.contractHealth],
              ]}
            />
            <p className="planning-note">
              Queues and alerts are the clearest risk signal for this first planning slice.
            </p>
          </PlanningSection>
        );
      case "workforce":
        return (
          <PlanningSection title="Workforce">
            <PlanningStats
              rows={[
                ["Total headcount", activeSnapshot.totalHeadcount.toString()],
                ["Unassigned now", activeSnapshot.unassignedHeadcount.toString()],
                ["Planned unassigned", getUnassignedPlannedLabor().toString()],
                ["Top bottleneck", activeSnapshot.topBottleneckLabel ?? "None"],
                ["Pressure", activeSnapshot.topBottleneckPressure ?? "healthy"],
              ]}
            />
            <p className="planning-note">
              Use the Productivity page to set next-month labor assignments.
            </p>
          </PlanningSection>
        );
      case "condition":
        return (
          <PlanningSection title="Warehouse Condition">
            <PlanningStats
              rows={[
                ["Condition", activeSnapshot.conditionScore.toFixed(0)],
                ["Storage", `${formatNumber(activeSnapshot.storageUsedCubicFeet)} / ${formatNumber(activeSnapshot.storageCapacityCubicFeet)} cu ft`],
                ["Dock freight", `${formatNumber(activeSnapshot.dockFreightCubicFeet)} cu ft`],
                ["Storage needs", activeSnapshot.dockStorageNeedCount.toString()],
                ["Maintenance budget", activePendingPlan.budget.maintenance.toString()],
              ]}
            />
            <p className="planning-note">
              Maintenance budget provides condition support and is charged through operating cost.
            </p>
          </PlanningSection>
        );
      case "satisfaction":
        return (
          <PlanningSection title="Satisfaction">
            <PlanningStats
              rows={[
                ["Client", activeSnapshot.clientSatisfactionScore.toFixed(0)],
                ["Customer", activeSnapshot.customerSatisfactionScore.toFixed(0)],
                ["Safety", activeSnapshot.safetyScore.toFixed(0)],
                ["Condition", activeSnapshot.conditionScore.toFixed(0)],
                ["Critical alerts", activeSnapshot.criticalAlertCount.toString()],
              ]}
            />
            <p className="planning-note">
              Customer satisfaction is most sensitive to outbound blockage, loading backlog, safety,
              and condition.
            </p>
          </PlanningSection>
        );
      case "budgeting":
        return (
          <PlanningSection title="Budgeting">
            <div className="budget-control-list">
              {(Object.keys(budgetLabels) as Array<keyof BudgetPlan>).map((category) => (
                <article className="budget-control" key={category}>
                  <div>
                    <strong>{budgetLabels[category]}</strong>
                    <p>{budgetHelp[category]}</p>
                  </div>
                  <div className="planning-stepper">
                    <button type="button" onClick={() => updateBudget(category, -1)}>
                      -
                    </button>
                    <span>{activePendingPlan.budget[category]}</span>
                    <button type="button" onClick={() => updateBudget(category, 1)}>
                      +
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </PlanningSection>
        );
      case "productivity":
        return (
          <PlanningSection title="Productivity & Labor">
            <div className="planning-role-list">
              {roleOrder.map((roleId) => (
                <article className="planning-role" key={roleId}>
                  <div>
                    <strong>{roleLabels[roleId]}</strong>
                    <p>{getRoleHint(roleId)}</p>
                  </div>
                  <div className="planning-stepper">
                    <button type="button" onClick={() => updatePlannedLabor(roleId, -1)}>
                      -
                    </button>
                    <span>{activePendingPlan.laborAssignments[roleId] ?? 0}</span>
                    <button type="button" onClick={() => updatePlannedLabor(roleId, 1)}>
                      +
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </PlanningSection>
        );
    }
  }

  function getUnassignedPlannedLabor(): number {
    return Math.max(
      0,
      activeSnapshot.totalHeadcount -
        Object.values(activePendingPlan.laborAssignments).reduce(
          (total, headcount) => total + headcount,
          0,
        ),
    );
  }
}

function PlanningSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function PlanningStats({ rows }: { rows: Array<[string, string]> }) {
  return (
    <dl className="planning-stats">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString();
}

function getTotalBudgetPoints(budget: BudgetPlan): number {
  return Object.values(budget).reduce((total, value) => total + value, 0);
}

function getRoleHint(roleId: LaborRole): string {
  switch (roleId) {
    case LaborRole.SwitchDriver:
      return "Moves trailers between yard and doors.";
    case LaborRole.Unload:
      return "Clears inbound trailers into dock freight.";
    case LaborRole.Storage:
      return "Moves dock freight into valid storage.";
    case LaborRole.Pick:
      return "Picks outbound orders from storage.";
    case LaborRole.Load:
      return "Loads picked freight onto outbound trailers.";
    case LaborRole.Sanitation:
      return "Protects condition and congestion pressure.";
    case LaborRole.Management:
      return "Supports coordination and overload control.";
  }
}
