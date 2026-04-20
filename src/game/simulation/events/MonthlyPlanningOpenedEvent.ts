import type { DomainEvent } from "./DomainEvent";

export interface MonthlyPlanningOpenedEvent extends DomainEvent {
  type: "monthly-planning-opened";
  monthKey: string;
  planId: string | null;
}
