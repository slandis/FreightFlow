import { useEffect, useState } from "react";
import { useSimulationState, useSimulation } from "./useSimulation";
import {
  selectTutorialHintCandidates,
  type TutorialHint,
} from "../tutorial/tutorialHints";

export function useTutorialCoach() {
  const simulation = useSimulation();
  const candidates = useSimulationState(selectTutorialHintCandidates);
  const [activeHint, setActiveHint] = useState<TutorialHint | null>(null);
  const [seenHintIds, setSeenHintIds] = useState<string[]>([]);

  useEffect(() => {
    setActiveHint(null);
    setSeenHintIds([]);
  }, [simulation]);

  useEffect(() => {
    if (activeHint) {
      return;
    }

    const nextHint = candidates.find((hint) => !seenHintIds.includes(hint.id));

    if (!nextHint) {
      return;
    }

    setActiveHint(nextHint);
    setSeenHintIds((current) => [...current, nextHint.id]);
  }, [activeHint, candidates, seenHintIds]);

  return {
    activeHint,
    dismissActiveHint: () => setActiveHint(null),
  };
}
