import type { GameState } from "../core/GameState";

export function selectCurrentTick(state: GameState): number {
  return state.currentTick;
}

export function selectCalendar(state: GameState) {
  return state.calendar;
}

export function selectSpeed(state: GameState) {
  return state.speed;
}
