import type { DomainEvent } from "./DomainEvent";

export interface QueueCriticalEvent extends DomainEvent {
  type: "queue-critical";
  queueId: string;
}
