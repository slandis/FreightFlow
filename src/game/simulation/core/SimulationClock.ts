import type { SimulationCalendar } from "./GameState";

const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_MONTH = 30;
const MONTHS_PER_YEAR = 12;

export class SimulationClock {
  private tick = 0;
  private calendar: SimulationCalendar;

  constructor(initialCalendar: SimulationCalendar = createInitialCalendar()) {
    this.calendar = { ...initialCalendar };
  }

  advance(): number {
    this.tick += 1;
    this.calendar = advanceCalendarMinute(this.calendar);
    return this.tick;
  }

  getTick(): number {
    return this.tick;
  }

  getCalendar(): SimulationCalendar {
    return { ...this.calendar };
  }
}

export function createInitialCalendar(): SimulationCalendar {
  return {
    year: 1,
    month: 1,
    day: 1,
    hour: 8,
    minute: 0,
  };
}

function advanceCalendarMinute(calendar: SimulationCalendar): SimulationCalendar {
  let { year, month, day, hour, minute } = calendar;

  minute += 1;

  if (minute >= MINUTES_PER_HOUR) {
    minute = 0;
    hour += 1;
  }

  if (hour >= HOURS_PER_DAY) {
    hour = 0;
    day += 1;
  }

  if (day > DAYS_PER_MONTH) {
    day = 1;
    month += 1;
  }

  if (month > MONTHS_PER_YEAR) {
    month = 1;
    year += 1;
  }

  return { year, month, day, hour, minute };
}
