import { useEffect, useLayoutEffect, useRef } from "react";
import { useSimulationRunner } from "../../app/providers/SimulationProvider";
import { createGame } from "../../game/phaser/GameBootstrap";
import { LaborDialog } from "../components/dialogs/LaborDialog";
import { MonthlyPlanningDialog } from "../components/dialogs/MonthlyPlanningDialog";
import { SaveLoadDialog } from "../components/dialogs/SaveLoadDialog";
import { TopHud } from "../components/hud/TopHud";
import { BottomKpiBar } from "../components/panels/BottomKpiBar";
import { LeftToolPanel } from "../components/panels/LeftToolPanel";
import { RightOperationsPanel } from "../components/panels/RightOperationsPanel";
import { TutorialCoachCard } from "../components/tutorial/TutorialCoachCard";
import { useSimulationState } from "../hooks/useSimulation";
import { useUiStore } from "../store/uiStore";

export function MainGameScreen() {
  const shellRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const topHudRef = useRef<HTMLElement | null>(null);
  const simulation = useSimulationRunner();
  const isLaborDialogOpen = useUiStore((state) => state.isLaborDialogOpen);
  const isSaveLoadDialogOpen = useUiStore((state) => state.isSaveLoadDialogOpen);
  const isPlanningActive = useSimulationState((state) => state.planning.isPlanningActive);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const game = createGame(containerRef.current, simulation);

    return () => {
      game.destroy(true);
    };
  }, [simulation]);

  useLayoutEffect(() => {
    const shell = shellRef.current;
    const topHud = topHudRef.current;

    if (!shell || !topHud) {
      return;
    }

    const updateHudAnchor = () => {
      const shellRect = shell.getBoundingClientRect();
      const topHudRect = topHud.getBoundingClientRect();
      const topHudBottomOffset = Math.max(
        88,
        Math.ceil(topHudRect.bottom - shellRect.top + 12),
      );

      shell.style.setProperty("--top-hud-bottom", `${topHudBottomOffset}px`);
    };

    updateHudAnchor();

    const resizeObserver = new ResizeObserver(() => {
      updateHudAnchor();
    });

    resizeObserver.observe(topHud);
    window.addEventListener("resize", updateHudAnchor);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateHudAnchor);
    };
  }, []);

  return (
    <main className="game-shell" ref={shellRef}>
      <div id="phaser-game" ref={containerRef} className="phaser-surface" />
      <TopHud ref={topHudRef} />
      <TutorialCoachCard />
      <LeftToolPanel />
      <RightOperationsPanel />
      <BottomKpiBar />
      {isLaborDialogOpen ? <LaborDialog /> : null}
      {isSaveLoadDialogOpen ? <SaveLoadDialog /> : null}
      {isPlanningActive ? <MonthlyPlanningDialog /> : null}
    </main>
  );
}
