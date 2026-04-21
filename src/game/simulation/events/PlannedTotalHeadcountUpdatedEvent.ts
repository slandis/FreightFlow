import type { DomainEvent } from "./DomainEvent";

export interface PlannedTotalHeadcountUpdatedEvent extends DomainEvent {
  type: "planned-total-headcount-updated";
  monthKey: string;
  totalHeadcount: number;
  unassignedHeadcount: number;
}
