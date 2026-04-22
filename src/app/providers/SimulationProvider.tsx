import { createContext, type PropsWithChildren, useContext, useState } from "react";
import { APP_DEFAULT_DIFFICULTY_MODE_ID } from "../../game/simulation/config/difficulty";
import { SimulationRunner } from "../../game/simulation/core/SimulationRunner";
import { usePlaytestCheats } from "../../ui/hooks/usePlaytestCheats";
import { useSimulationLoop } from "../../ui/hooks/useSimulationLoop";

interface SimulationContextValue {
  simulation: SimulationRunner;
  restartSimulation: (difficultyModeId?: string) => void;
}

const SimulationContext = createContext<SimulationContextValue | null>(null);

export function SimulationProvider({ children }: PropsWithChildren) {
  const [simulation, setSimulation] = useState(() =>
    createSimulationRunner(APP_DEFAULT_DIFFICULTY_MODE_ID),
  );
  useSimulationLoop(simulation);
  usePlaytestCheats(simulation);

  return (
    <SimulationContext.Provider
      value={{
        simulation,
        restartSimulation: (difficultyModeId = APP_DEFAULT_DIFFICULTY_MODE_ID) => {
          setSimulation(createSimulationRunner(difficultyModeId));
        },
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulationRunner(): SimulationRunner {
  const value = useContext(SimulationContext);

  if (!value) {
    throw new Error("useSimulationRunner must be used within SimulationProvider");
  }

  return value.simulation;
}

export function useSimulationController(): SimulationContextValue {
  const value = useContext(SimulationContext);

  if (!value) {
    throw new Error("useSimulationController must be used within SimulationProvider");
  }

  return value;
}

function createSimulationRunner(difficultyModeId: string): SimulationRunner {
  return new SimulationRunner({
    difficultyModeId,
    openInitialPlanning: true,
  });
}
