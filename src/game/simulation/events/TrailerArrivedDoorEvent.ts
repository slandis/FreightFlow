import type { DomainEvent } from "./DomainEvent";

export interface TrailerArrivedDoorEvent extends DomainEvent {
  type: "trailer-arrived-door";
  trailerId: string;
  doorId: string | null;
}
