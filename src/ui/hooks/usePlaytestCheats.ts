import { useEffect } from "react";
import { GrantPlaytestCashCommand } from "../../game/simulation/commands/GrantPlaytestCashCommand";
import type { SimulationRunner } from "../../game/simulation/core/SimulationRunner";

export const PLAYTEST_CASH_CHEAT_CODE = "ineedcashnow!";

export function usePlaytestCheats(simulation: SimulationRunner): void {
  useEffect(() => {
    let buffer = "";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldIgnoreTarget(event.target)) {
        return;
      }

      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      if (event.key.length !== 1) {
        return;
      }

      buffer = appendCheatBuffer(buffer, event.key, PLAYTEST_CASH_CHEAT_CODE.length);

      if (!buffer.endsWith(PLAYTEST_CASH_CHEAT_CODE)) {
        return;
      }

      simulation.dispatch(new GrantPlaytestCashCommand());
      buffer = "";
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [simulation]);
}

export function appendCheatBuffer(
  currentBuffer: string,
  key: string,
  maxLength: number,
): string {
  return `${currentBuffer}${key.toLowerCase()}`.slice(-maxLength);
}

function shouldIgnoreTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();

  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable
  );
}
