import type { DoorNode } from "../world/DoorNode";
import type { DomainEvent } from "./DomainEvent";

export interface DoorPlacedEvent extends DomainEvent {
  type: "door-placed";
  doorId: string;
  x: number;
  y: number;
  mode: DoorNode["mode"];
}
