import type { EventBus } from "../core/EventBus";
import type { GameState } from "../core/GameState";
import type { RandomService } from "../core/RandomService";
import type { DomainEvent } from "../events/DomainEvent";

export interface CommandContext {
  state: GameState;
  eventBus: EventBus;
  random: RandomService;
  createEvent: <TType extends string>(type: TType) => DomainEvent<TType>;
}

export interface CommandResult {
  success: boolean;
  events: DomainEvent[];
  errors: string[];
}

export interface Command<TType extends string = string> {
  type: TType;
  execute(context: CommandContext): CommandResult;
}

export function commandSucceeded(events: DomainEvent[] = []): CommandResult {
  return {
    success: true,
    events,
    errors: [],
  };
}

export function commandFailed(error: string): CommandResult {
  return {
    success: false,
    events: [],
    errors: [error],
  };
}
