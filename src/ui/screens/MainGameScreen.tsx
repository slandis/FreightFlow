import { useEffect, useRef } from "react";
import { useSimulationRunner } from "../../app/providers/SimulationProvider";
import { createGame } from "../../game/phaser/GameBootstrap";
import { AlertsCenter } from "../components/alerts/AlertsCenter";
import { TopHud } from "../components/hud/TopHud";
import { BottomKpiBar } from "../components/panels/BottomKpiBar";
import { LeftToolPanel } from "../components/panels/LeftToolPanel";
import { RightOperationsPanel } from "../components/panels/RightOperationsPanel";

export function MainGameScreen() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const simulation = useSimulationRunner();

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const game = createGame(containerRef.current, simulation);

    return () => {
      game.destroy(true);
    };
  }, [simulation]);

  return (
    <main className="game-shell">
      <div id="phaser-game" ref={containerRef} className="phaser-surface" />
      <TopHud />
      <LeftToolPanel />
      <RightOperationsPanel />
      <BottomKpiBar />
      <AlertsCenter />
    </main>
  );
}
