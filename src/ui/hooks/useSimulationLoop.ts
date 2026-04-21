import { useEffect } from "react";
import {
  calculateTicksForElapsed,
  type TickCalculationResult,
} from "../../game/simulation/core/SimulationTiming";
import type { SimulationRunner } from "../../game/simulation/core/SimulationRunner";

const initialTickCalculation: TickCalculationResult = {
  ticksToRun: 0,
  accumulatedMs: 0,
};

export function useSimulationLoop(simulation: SimulationRunner): void {
  useEffect(() => {
    let animationFrameId: number | null = null;
    let lastFrameTime: number | null = null;
    let accumulatedMs = initialTickCalculation.accumulatedMs;
    let stopped = false;

    const runFrame = (frameTime: number) => {
      if (stopped) {
        return;
      }

      if (lastFrameTime === null) {
        lastFrameTime = frameTime;
      }

      const elapsedMs = frameTime - lastFrameTime;
      lastFrameTime = frameTime;

      const result = calculateTicksForElapsed(
        elapsedMs,
        simulation.getState().speed,
        accumulatedMs,
      );
      accumulatedMs = result.accumulatedMs;
      const executedTicks = simulation.tickMany(result.ticksToRun);

      if (executedTicks > 0 && simulation.getState().planning.isPlanningActive) {
        accumulatedMs = 0;
      }

      animationFrameId = window.requestAnimationFrame(runFrame);
    };

    animationFrameId = window.requestAnimationFrame(runFrame);

    return () => {
      stopped = true;

      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [simulation]);
}
