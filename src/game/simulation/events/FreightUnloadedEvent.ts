import type { DomainEvent } from "./DomainEvent";

export interface FreightUnloadedEvent extends DomainEvent {
  type: "freight-unloaded";
  trailerId: string;
  freightBatchId: string;
  cubicFeet: number;
}
