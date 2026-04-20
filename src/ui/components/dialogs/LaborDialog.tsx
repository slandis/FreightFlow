import { useState } from "react";
import { AssignLaborCommand } from "../../../game/simulation/commands/AssignLaborCommand";
import {
  selectLaborRoleDetails,
  selectLaborSummary,
} from "../../../game/simulation/selectors/laborSelectors";
import type { LaborPool } from "../../../game/simulation/labor/LaborPool";
import { LaborRole } from "../../../game/simulation/types/enums";
import { useSimulation, useSimulationState } from "../../hooks/useSimulation";
import { useUiStore } from "../../store/uiStore";

const roleLabels: Record<LaborRole, string> = {
  [LaborRole.SwitchDriver]: "Switch Driver",
  [LaborRole.Unload]: "Inbound Unloading",
  [LaborRole.Storage]: "Inbound Storage",
  [LaborRole.Pick]: "Outbound Picking",
  [LaborRole.Load]: "Outbound Loading",
  [LaborRole.Sanitation]: "Sanitation",
  [LaborRole.Management]: "Management",
};

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
  const setLaborDialogOpen = useUiStore((state) => state.setLaborDialogOpen);
  const [error, setError] = useState<string | null>(null);

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
              {summary.totalHeadcount} total; {summary.unassignedHeadcount} unassigned.
            </p>
          </div>
          <button type="button" onClick={() => setLaborDialogOpen(false)}>
            Close
          </button>
        </header>
        {error ? <p className="labor-error">{error}</p> : null}
        <div className="labor-role-list">
          {roles.map((pool) => (
            <article key={pool.roleId} className={`labor-role ${pool.pressure}`}>
              <div>
                <strong>{roleLabels[pool.roleId]}</strong>
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
      </section>
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
