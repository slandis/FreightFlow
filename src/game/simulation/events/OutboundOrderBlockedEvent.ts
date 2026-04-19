import type { DomainEvent } from "./DomainEvent";

export interface OutboundOrderBlockedEvent extends DomainEvent {
  type: "outbound-order-blocked";
  outboundOrderId: string;
  reason: string;
}
