import { describe, expect, it } from "vitest";
import { EventBus } from "../../game/simulation/core/EventBus";
import type { DomainEvent } from "../../game/simulation/events/DomainEvent";

describe("EventBus", () => {
  it("emits events to typed and catch-all subscribers", () => {
    const bus = new EventBus();
    const allEvents: string[] = [];
    const typedEvents: string[] = [];
    const event: DomainEvent<"queue-critical"> = {
      id: "event-000001",
      type: "queue-critical",
      tick: 12,
      createdAt: 1000,
    };

    bus.subscribeAll((received) => allEvents.push(received.type));
    bus.subscribe("queue-critical", (received) => typedEvents.push(received.type));

    bus.emit(event);

    expect(allEvents).toEqual(["queue-critical"]);
    expect(typedEvents).toEqual(["queue-critical"]);
  });

  it("unsubscribes handlers", () => {
    const bus = new EventBus();
    const events: string[] = [];
    const event: DomainEvent<"alert-raised"> = {
      id: "event-000001",
      type: "alert-raised",
      tick: 1,
      createdAt: 1000,
    };

    const unsubscribe = bus.subscribe("alert-raised", (received) => events.push(received.type));

    unsubscribe();
    bus.emit(event);

    expect(events).toEqual([]);
  });
});
