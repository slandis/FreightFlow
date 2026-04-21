import { useEffect, useState } from "react";
import { getMonthKey } from "../../game/simulation/core/GameState";
import { useSimulation } from "./useSimulation";
import {
  createPlaytestMonthAccumulator,
  finalizePlaytestMonth,
  formatPlaytestReview,
  samplePlaytestMonth,
  type PlaytestMonthRecord,
} from "../playtest/playtestTelemetry";

export function usePlaytestReview() {
  const simulation = useSimulation();
  const [records, setRecords] = useState<PlaytestMonthRecord[]>([]);

  useEffect(() => {
    setRecords([]);
    let lastProcessedTick = simulation.getState().currentTick;
    let accumulator = createPlaytestMonthAccumulator(
      getMonthKey(simulation.getState().calendar),
    );

    const unsubscribe = simulation.subscribeToChanges(() => {
      const state = simulation.getState();

      if (state.currentTick === lastProcessedTick) {
        return;
      }

      const activeMonthKey = getMonthKey(state.calendar);

      if (activeMonthKey !== accumulator.monthKey) {
        const completedMonth = finalizePlaytestMonth(accumulator, state);
        setRecords((current) => [...current, completedMonth]);
        accumulator = createPlaytestMonthAccumulator(activeMonthKey);
      }

      accumulator = samplePlaytestMonth(accumulator, state);
      lastProcessedTick = state.currentTick;
    });

    return unsubscribe;
  }, [simulation]);

  return {
    records,
    exportText: formatPlaytestReview(records),
  };
}
