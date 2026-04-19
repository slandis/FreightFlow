import { useSimulationRunner } from "../../app/providers/SimulationProvider";

export function useSimulation() {
  return useSimulationRunner();
}
