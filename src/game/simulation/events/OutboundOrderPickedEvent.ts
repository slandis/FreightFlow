import type { DomainEvent } from "./DomainEvent";

export interface OutboundOrderPickedEvent extends DomainEvent {
  type: "outbound-order-picked";
  outboundOrderId: string;
  cubicFeet: number;
}
