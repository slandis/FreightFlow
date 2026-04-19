export type EntityId = string;
export type CommandId = string;
export type EventId = string;

export function createId(prefix: string, sequence: number): EntityId {
  return `${prefix}-${sequence.toString().padStart(6, "0")}`;
}
