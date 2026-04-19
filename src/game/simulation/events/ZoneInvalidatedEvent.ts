import type { DomainEvent } from "./DomainEvent";

export interface ZoneInvalidatedEvent extends DomainEvent {
  type: "zone-invalidated";
  zoneId: string;
  reason: string;
}
