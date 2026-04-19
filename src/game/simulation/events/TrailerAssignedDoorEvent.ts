import type { DomainEvent } from "./DomainEvent";

export interface TrailerAssignedDoorEvent extends DomainEvent {
  type: "trailer-assigned-door";
  trailerId: string;
  doorId: string;
}
