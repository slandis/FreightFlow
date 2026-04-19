import { useSyncExternalStore } from "react";
import { useSimulationRunner } from "../../app/providers/SimulationProvider";
import type { GameState } from "../../game/simulation/core/GameState";

export function useSimulation() {
  return useSimulationRunner();
}

export function useSimulationState<TValue>(
  selector: (state: GameState) => TValue,
): TValue {
  const simulation = useSimulationRunner();

  return useSyncExternalStore(
    (listener) => simulation.subscribeToChanges(listener),
    () => selector(simulation.getState()),
    () => selector(simulation.getState()),
  );
}
