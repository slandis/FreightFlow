import type { DomainEvent } from "./DomainEvent";

export interface FreightStoredEvent extends DomainEvent {
  type: "freight-stored";
  freightBatchId: string;
  freightClassId: string;
  zoneId: string;
  cubicFeet: number;
}
