import { useState } from "react";
import { AssignLaborCommand } from "../../../game/simulation/commands/AssignLaborCommand";
import {
  LABOR_ROLE_LABELS,
  selectLaborAnalysisRoles,
  selectLaborAnalysisSummary,
  selectLaborAnalysisSuggestions,
  selectLaborForecastHeadcountChart,
  selectLaborRoleDetails,
  selectLaborSummary,
} from "../../../game/simulation/selectors/laborSelectors";
import type { LaborAnalysisRole, LaborForecastRole } from "../../../game/simulation/selectors/laborSelectors";
import type { LaborPool } from "../../../game/simulation/labor/LaborPool";
import { LaborRole } from "../../../game/simulation/types/enums";
import { useSimulation, useSimulationState } from "../../hooks/useSimulation";
import { useUiStore } from "../../store/uiStore";

type LaborDialogView = "assignments" | "analysis";

const roleDescriptions: Record<LaborRole, string> = {
  [LaborRole.SwitchDriver]: "Moves trailers between yard and dock doors.",
  [LaborRole.Unload]: "Unloads inbound trailers into dock freight.",
  [LaborRole.Storage]: "Moves dock freight into compatible storage.",
  [LaborRole.Pick]: "Picks outbound orders from stored inventory.",
  [LaborRole.Load]: "Loads picked freight into outbound trailers.",
  [LaborRole.Sanitation]: "Protects cleanliness, condition pressure, and congestion risk.",
  [LaborRole.Management]: "Improves coordination and stabilizes overloaded teams.",
};

export function LaborDialog() {
  const simulation = useSimulation();
  const roles = useSimulationState(selectLaborRoleDetails);
  const summary = useSimulationState(selectLaborSummary);
  const analysisSummary = useSimulationState(selectLaborAnalysisSummary);
  const analysisRoles = useSimulationState(selectLaborAnalysisRoles);
  const suggestions = useSimulationState(selectLaborAnalysisSuggestions);
  const forecastRoles = useSimulationState(selectLaborForecastHeadcountChart);
  const setLaborDialogOpen = useUiStore((state) => state.setLaborDialogOpen);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<LaborDialogView>("assignments");

  const assignHeadcount = (pool: LaborPool, delta: number) => {
    const result = simulation.dispatch(
      new AssignLaborCommand(pool.roleId, pool.assignedHeadcount + delta),
    );

    setError(result.success ? null : result.errors[0] ?? "Labor assignment failed");
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="labor-dialog" role="dialog" aria-modal="true" aria-label="Labor">
        <header>
          <div>
            <strong>Labor</strong>
            <p>
              {summary.totalHeadcount} total; {summary.unassignedHeadcount} unassigned;{" "}
              {analysisSummary.monthKey}
            </p>
          </div>
          <button type="button" onClick={() => setLaborDialogOpen(false)}>
            Close
          </button>
        </header>
        <div className="labor-dialog-tabs" role="tablist" aria-label="Labor views">
          <button
            type="button"
            className={view === "assignments" ? "active" : undefined}
            aria-pressed={view === "assignments"}
            onClick={() => setView("assignments")}
          >
            Assignments
          </button>
          <button
            type="button"
            className={view === "analysis" ? "active" : undefined}
            aria-pressed={view === "analysis"}
            onClick={() => setView("analysis")}
          >
            Analysis
          </button>
        </div>
        {error ? <p className="labor-error">{error}</p> : null}
        {view === "assignments" ? (
          <div className="labor-role-list">
            {roles.map((pool) => (
              <article key={pool.roleId} className={`labor-role ${pool.pressure}`}>
                <div>
                  <strong>{LABOR_ROLE_LABELS[pool.roleId]}</strong>
                  <p>{roleDescriptions[pool.roleId]}</p>
                  <small>
                    {pool.pressure}; rate {formatRate(pool)}; utilization{" "}
                    {Math.round(pool.utilization * 100)}%
                  </small>
                </div>
                <div className="labor-stepper">
                  <button
                    type="button"
                    onClick={() => assignHeadcount(pool, -1)}
                    disabled={pool.assignedHeadcount <= 0}
                  >
                    -
                  </button>
                  <span>{pool.assignedHeadcount}</span>
                  <button type="button" onClick={() => assignHeadcount(pool, 1)}>
                    +
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="labor-analysis-view">
            <section className="labor-analysis-summary-grid">
              <article className="labor-summary-card">
                <strong>Labor Summary</strong>
                <small>Total labor this month</small>
                <p>{formatCurrency(analysisSummary.totalLaborCost)}</p>
                <small>
                  Cost per throughput cube{" "}
                  {formatNullableCurrency(analysisSummary.laborCostPerThroughputCube)}
                </small>
              </article>
              <article className="labor-summary-card">
                <strong>Most Strained</strong>
                <small>{analysisSummary.mostStrainedRoleLabel ?? "No active bottleneck"}</small>
                <p>{analysisSummary.throughputCubicFeet.toLocaleString()} cu ft</p>
                <small>Month-to-date throughput window</small>
              </article>
              <article className="labor-summary-card">
                <strong>Cost Hotspot</strong>
                <small>{analysisSummary.mostExpensiveRoleLabel ?? "No active labor cost"}</small>
                <p>{analysisSummary.lowestEfficiencyRoleLabel ?? "No low-efficiency role yet"}</p>
                <small>Most expensive and least efficient roles</small>
              </article>
              <article className="labor-summary-card">
                <strong>Forecast Gap</strong>
                <small>
                  Accepted contracts:{" "}
                  {analysisSummary.acceptedContractForecastCubicFeet.toLocaleString()} cu ft
                </small>
                <p>{analysisSummary.totalForecastHeadcountGap}</p>
                <small>Heads needed at ideal KPI conditions</small>
              </article>
            </section>

            <section className="labor-suggestion-list" aria-label="Labor suggestions">
              {suggestions.map((suggestion) => (
                <article key={suggestion.id} className="labor-suggestion-card">
                  <strong>Suggestion</strong>
                  <p>{suggestion.message}</p>
                </article>
              ))}
            </section>

            <section className="labor-forecast-panel">
              <div className="labor-panel-heading">
                <div>
                  <strong>Ideal Staffing Forecast</strong>
                  <p>Accepted-contract volume at maximum KPI scores.</p>
                </div>
              </div>
              <LaborForecastChart roles={forecastRoles} />
            </section>

            <section className="labor-analysis-role-list">
              {analysisRoles.map((role) => (
                <article key={role.roleId} className={`labor-analysis-role ${role.pressure}`}>
                  <div className="labor-analysis-role-header">
                    <div>
                      <strong>{role.label}</strong>
                      <p>{roleDescriptions[role.roleId]}</p>
                    </div>
                    <div className="labor-analysis-role-meta">
                      <span>{role.assignedHeadcount} assigned</span>
                      <span>{role.pressure}</span>
                      {role.isEstimated ? <span>Estimated</span> : null}
                    </div>
                  </div>
                  <div className="labor-analysis-metrics">
                    <Metric label="Cost / cube" value={formatNullableCurrency(role.costPerThroughputCube)} />
                    <Metric
                      label="Cube / head"
                      value={formatNullableNumber(role.averageCubicFeetPerHead, " cu ft")}
                    />
                    <Metric label="Total cube" value={`${Math.round(role.totalCubicFeetProcessed).toLocaleString()} cu ft`} />
                    <Metric
                      label="Avg task ticks"
                      value={formatNullableNumber(role.averageTaskTicks)}
                    />
                    <Metric
                      label="Labor cost / tick"
                      value={formatCurrency(role.totalLaborCostPerTick)}
                    />
                    <Metric label="Avg headcount" value={role.averageAssignedHeadcount.toFixed(2)} />
                  </div>
                </article>
              ))}
            </section>
          </div>
        )}
      </section>
    </div>
  );
}

function LaborForecastChart({ roles }: { roles: LaborForecastRole[] }) {
  const maxHeadcount = Math.max(1, ...roles.map((role) => Math.max(role.currentHeadcount, role.idealHeadcount)));

  return (
    <div className="labor-forecast-chart" role="img" aria-label="Ideal staffing forecast by labor role">
      {roles.map((role) => {
        const currentWidth = `${(role.currentHeadcount / maxHeadcount) * 100}%`;
        const idealWidth = `${(role.idealHeadcount / maxHeadcount) * 100}%`;
        const differenceLabel =
          role.difference > 0
            ? `+${role.difference} needed`
            : role.difference < 0
              ? `${Math.abs(role.difference)} over`
              : "On target";

        return (
          <div key={role.roleId} className="labor-forecast-row">
            <div className="labor-forecast-labels">
              <strong>{role.label}</strong>
              <small>
                Current {role.currentHeadcount}; ideal {role.idealHeadcount}; {differenceLabel}
              </small>
            </div>
            <div className="labor-forecast-bars" aria-hidden="true">
              <div className="labor-forecast-bar labor-forecast-bar-current" style={{ width: currentWidth }} />
              <div className="labor-forecast-bar labor-forecast-bar-ideal" style={{ width: idealWidth }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="labor-analysis-metric">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  );
}

function formatRate(pool: LaborPool): string {
  if (pool.roleId === LaborRole.SwitchDriver) {
    return `${pool.effectiveRate.toFixed(0)} moves`;
  }

  if (pool.roleId === LaborRole.Sanitation || pool.roleId === LaborRole.Management) {
    return `${pool.effectiveRate.toFixed(0)} support`;
  }

  return `${Math.round(pool.effectiveRate).toLocaleString()} cu ft/tick`;
}

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatNullableCurrency(value: number | null): string {
  return value === null ? "--" : formatCurrency(value);
}

function formatNullableNumber(value: number | null, suffix = ""): string {
  return value === null ? "--" : `${value.toFixed(1)}${suffix}`;
}
