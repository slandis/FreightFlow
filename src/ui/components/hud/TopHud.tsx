import { useSimulationRunner } from "../../../app/providers/SimulationProvider";
import { ChangeSpeedCommand } from "../../../game/simulation/commands/ChangeSpeedCommand";
import { GameSpeed } from "../../../game/simulation/types/enums";
import {
  formatCalendarTime,
  selectCalendar,
  selectCurrentTick,
  selectSpeed,
} from "../../../game/simulation/selectors/timeSelectors";
import { selectCash } from "../../../game/simulation/selectors/kpiSelectors";
import { useSimulationState } from "../../hooks/useSimulation";

const speedButtons: Array<{ speed: GameSpeed; label: string }> = [
  { speed: GameSpeed.Paused, label: "Pause" },
  { speed: GameSpeed.Slow, label: "Slow" },
  { speed: GameSpeed.Medium, label: "Medium" },
  { speed: GameSpeed.Fast, label: "Fast" },
];

export function TopHud() {
  const simulation = useSimulationRunner();
  const calendar = useSimulationState(selectCalendar);
  const speed = useSimulationState(selectSpeed);
  const cash = useSimulationState(selectCash);
  const currentTick = useSimulationState(selectCurrentTick);

  return (
    <header className="top-hud">
      <span>{formatCalendarTime(calendar)}</span>
      <span>Cash: ${cash.toLocaleString()}</span>
      <span>Tick: {currentTick}</span>
      <div className="speed-controls" aria-label="Simulation speed">
        {speedButtons.map((button) => (
          <button
            aria-pressed={button.speed === speed}
            className={button.speed === speed ? "active" : ""}
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
