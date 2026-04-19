import type { DomainEvent } from "./DomainEvent";

export interface OutboundTrailerLoadedEvent extends DomainEvent {
  type: "outbound-trailer-loaded";
  outboundOrderId: string;
  trailerId: string;
  doorId: string;
}
