import type { GameState } from "../core/GameState";

export function selectCash(state: GameState): number {
  return state.cash;
}

export function selectKpis(state: GameState) {
  return state.kpis;
}

export function selectThroughputCubicFeet(state: GameState): number {
  return state.kpis.throughputCubicFeet;
}
