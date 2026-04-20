import type { DomainEvent } from "./DomainEvent";
import type { AlertSeverity } from "../core/GameState";

export interface AlertRaisedEvent extends DomainEvent {
  type: "alert-raised";
  alertId: string;
  key: string;
  severity: AlertSeverity;
  message: string;
}
