import type { DomainEvent } from "./DomainEvent";

export interface ShipmentCompletedEvent extends DomainEvent {
  type: "shipment-completed";
  outboundOrderId: string;
  trailerId: string;
  cubicFeet: number;
}
