import type { DomainEvent } from "./DomainEvent";

export interface OutboundOrderCreatedEvent extends DomainEvent {
  type: "outbound-order-created";
  outboundOrderId: string;
  freightClassId: string;
  requestedCubicFeet: number;
}
