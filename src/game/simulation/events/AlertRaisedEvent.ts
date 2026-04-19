import type { DomainEvent } from "./DomainEvent";

export interface AlertRaisedEvent extends DomainEvent {
  type: "alert-raised";
  message: string;
}
