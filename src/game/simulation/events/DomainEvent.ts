import type { EventId } from "../types/ids";

export interface DomainEvent<TType extends string = string> {
  id: EventId;
  type: TType;
  tick: number;
  createdAt: number;
}
