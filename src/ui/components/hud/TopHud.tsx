import { useSimulationRunner } from "../../../app/providers/SimulationProvider";

export function TopHud() {
  const simulation = useSimulationRunner();
  const state = simulation.getState();

  return (
    <header className="top-hud">
      <span>Day 1</span>
      <span>Speed: {state.speed}</span>
      <span>Cash: ${state.cash.toLocaleString()}</span>
      <span>Tick: {state.currentTick}</span>
    </header>
  );
}
