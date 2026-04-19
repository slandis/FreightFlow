import type { DomainEvent } from "./DomainEvent";

export interface MonthStartedEvent extends DomainEvent {
  type: "month-started";
  month: number;
}
