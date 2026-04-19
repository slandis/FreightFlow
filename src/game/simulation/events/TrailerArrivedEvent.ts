import type { DomainEvent } from "./DomainEvent";

export interface TrailerArrivedEvent extends DomainEvent {
  type: "trailer-arrived";
  trailerId: string;
}
