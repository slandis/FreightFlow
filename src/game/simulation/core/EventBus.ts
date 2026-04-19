import type { DomainEvent } from "../events/DomainEvent";

type EventHandler = (event: DomainEvent) => void;
type TypedEventHandler<TEvent extends DomainEvent> = (event: TEvent) => void;

export class EventBus {
  private readonly allHandlers = new Set<EventHandler>();
  private readonly typedHandlers = new Map<string, Set<EventHandler>>();

  subscribeAll(handler: EventHandler): () => void {
    this.allHandlers.add(handler);
    return () => this.allHandlers.delete(handler);
  }

  subscribe<TEvent extends DomainEvent>(
    type: TEvent["type"],
    handler: TypedEventHandler<TEvent>,
  ): () => void {
    const handlers = this.typedHandlers.get(type) ?? new Set<EventHandler>();
    handlers.add(handler as EventHandler);
    this.typedHandlers.set(type, handlers);

    return () => {
      handlers.delete(handler as EventHandler);
      if (handlers.size === 0) {
        this.typedHandlers.delete(type);
      }
    };
  }

  emit(event: DomainEvent): void {
    for (const handler of this.allHandlers) {
      handler(event);
    }

    const typedHandlers = this.typedHandlers.get(event.type);

    if (!typedHandlers) {
      return;
    }

    for (const handler of typedHandlers) {
      handler(event);
    }
  }
}
