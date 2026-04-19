import { createContext, type PropsWithChildren, useContext, useMemo } from "react";
import { SimulationRunner } from "../../game/simulation/core/SimulationRunner";
import { useSimulationLoop } from "../../ui/hooks/useSimulationLoop";

const SimulationContext = createContext<SimulationRunner | null>(null);

export function SimulationProvider({ children }: PropsWithChildren) {
  const simulation = useMemo(() => new SimulationRunner(), []);
  useSimulationLoop(simulation);

  return <SimulationContext.Provider value={simulation}>{children}</SimulationContext.Provider>;
}

export function useSimulationRunner(): SimulationRunner {
  const simulation = useContext(SimulationContext);

  if (!simulation) {
    throw new Error("useSimulationRunner must be used within SimulationProvider");
  }

  return simulation;
}
