import { useSimulationRunner } from "../../../app/providers/SimulationProvider";
import { ChangeSpeedCommand } from "../../../game/simulation/commands/ChangeSpeedCommand";
import { selectMostSevereIssue } from "../../../game/simulation/selectors/diagnosticSelectors";
import { GameSpeed } from "../../../game/simulation/types/enums";
import {
  formatCalendarTime,
  selectCalendar,
  selectCurrentTick,
  selectSpeed,
} from "../../../game/simulation/selectors/timeSelectors";
import {
  selectCash,
  selectCriticalAlertCount,
  selectKpis,
} from "../../../game/simulation/selectors/kpiSelectors";
import { selectIsPlanningActive } from "../../../game/simulation/selectors/planningSelectors";
import { useSimulationState } from "../../hooks/useSimulation";
import { useUiStore } from "../../store/uiStore";
import { MetricTooltip } from "../tooltips/MetricTooltip";

const speedButtons: Array<{ speed: GameSpeed; label: string }> = [
  { speed: GameSpeed.Paused, label: "Pause" },
  { speed: GameSpeed.Slow, label: "Slow" },
  { speed: GameSpeed.Medium, label: "Medium" },
  { speed: GameSpeed.Fast, label: "Fast" },
  { speed: GameSpeed.Hyper, label: "Hyper" },
];

export function TopHud() {
  const simulation = useSimulationRunner();
  const calendar = useSimulationState(selectCalendar);
  const speed = useSimulationState(selectSpeed);
  const cash = useSimulationState(selectCash);
  const kpis = useSimulationState(selectKpis);
  const criticalAlertCount = useSimulationState(selectCriticalAlertCount);
  const currentTick = useSimulationState(selectCurrentTick);
  const isPlanningActive = useSimulationState(selectIsPlanningActive);
  const mostSevereIssue = useSimulationState(selectMostSevereIssue);
  const activeOverlayMode = useUiStore((state) => state.activeOverlayMode);
  const setSaveLoadDialogOpen = useUiStore((state) => state.setSaveLoadDialogOpen);

  return (
    <header className="top-hud">
      <MetricTooltip content="Current in-game calendar time.">
        <span>{formatCalendarTime(calendar)}</span>
      </MetricTooltip>
      <MetricTooltip content="Available cash after current month operating movement.">
        <span>Cash: ${cash.toLocaleString()}</span>
      </MetricTooltip>
      <MetricTooltip content="Labor morale score affected by pressure and support staffing.">
        <span>Morale: {kpis.moraleScore.toFixed(0)}</span>
      </MetricTooltip>
      <MetricTooltip content="Safety score affected by congestion, pressure, and support staffing.">
        <span>Safety: {kpis.safetyScore.toFixed(0)}</span>
      </MetricTooltip>
      <MetricTooltip content="Warehouse condition score affected by sanitation and operating stress.">
        <span>Condition: {kpis.conditionScore.toFixed(0)}</span>
      </MetricTooltip>
      <MetricTooltip content={mostSevereIssue?.recommendedAction ?? "No critical issues active."}>
        <span>
          Critical alerts: {criticalAlertCount}
          {mostSevereIssue ? ` (${mostSevereIssue.severity})` : ""}
        </span>
      </MetricTooltip>
      {isPlanningActive ? <span className="hud-badge">Planning active</span> : null}
      <span className="hud-badge">Overlay: {formatOverlay(activeOverlayMode)}</span>
      <span>Tick: {currentTick}</span>
      <button className="hud-action" onClick={() => setSaveLoadDialogOpen(true)} type="button">
        Save/Load
      </button>
      <div className="speed-controls" aria-label="Simulation speed">
        {speedButtons.map((button) => (
          <button
            aria-pressed={button.speed === speed}
            className={button.speed === speed ? "active" : ""}
            disabled={isPlanningActive}
            key={button.speed}
            onClick={() => simulation.dispatch(new ChangeSpeedCommand(button.speed))}
            type="button"
          >
            {button.label}
          </button>
        ))}
      </div>
    </header>
  );
}

function formatOverlay(mode: string): string {
  return mode
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
