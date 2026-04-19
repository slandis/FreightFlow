import type { GameState } from "../core/GameState";
import type { SimulationCalendar } from "../core/GameState";

export function selectCurrentTick(state: GameState): number {
  return state.currentTick;
}

export function selectCalendar(state: GameState) {
  return state.calendar;
}

export function selectSpeed(state: GameState) {
  return state.speed;
}

export function formatCalendarTime(calendar: SimulationCalendar): string {
  return `Year ${calendar.year}, Month ${calendar.month}, Day ${calendar.day}, ${calendar.hour
    .toString()
    .padStart(2, "0")}:${calendar.minute.toString().padStart(2, "0")}`;
}
