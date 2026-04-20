import type { DomainEvent } from "./DomainEvent";

export interface DoorRemovedEvent extends DomainEvent {
  type: "door-removed";
  doorId: string;
  x: number;
  y: number;
}
