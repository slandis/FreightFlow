import { MAP_HEIGHT, MAP_WIDTH } from "../../shared/constants/map";
import type { Command, CommandResult } from "../commands/Command";
import { CommandBus } from "./CommandBus";
import { EventBus } from "./EventBus";
import { WarehouseMap } from "../world/WarehouseMap";
import type { GameState } from "./GameState";
import { RandomService } from "./RandomService";
import { createInitialCalendar, SimulationClock } from "./SimulationClock";
import type { DomainEvent } from "../events/DomainEvent";
import { GameSpeed } from "../types/enums";

export interface SimulationRunnerOptions {
  seed?: number;
  startingCash?: number;
}

type StateListener = (state: GameState) => void;

export class SimulationRunner {
  private readonly clock = new SimulationClock();
  private readonly eventBus = new EventBus();
  private readonly random: RandomService;
  private readonly commandBus: CommandBus;
  private readonly listeners = new Set<StateListener>();
  private readonly state: GameState;
  private eventSequence = 0;

  constructor(options: SimulationRunnerOptions = {}) {
    this.random = new RandomService(options.seed);
    this.state = {
      currentTick: 0,
      calendar: createInitialCalendar(),
      speed: GameSpeed.Paused,
      cash: options.startingCash ?? 100000,
      kpis: {
        inboundCubicFeet: 0,
        outboundCubicFeet: 0,
        throughputCubicFeet: 0,
        safetyScore: 100,
      },
      debug: {
        lastCommandType: null,
        lastEventType: null,
      },
      warehouseMap: new WarehouseMap(MAP_WIDTH, MAP_HEIGHT),
    };

    this.commandBus = new CommandBus({
      state: this.state,
      eventBus: this.eventBus,
      random: this.random,
      createEvent: (type) => this.createEvent(type),
    });
  }

  tick(): void {
    this.state.currentTick = this.clock.advance();
    this.state.calendar = this.clock.getCalendar();

    const event = this.createEvent("simulation-ticked");
    this.state.debug.lastEventType = event.type;
    this.eventBus.emit(event);
    this.notifyStateChanged();
  }

  dispatch(command: Command): CommandResult {
    const result = this.commandBus.dispatch(command);
    this.notifyStateChanged();
    return result;
  }

  getState(): GameState {
    return this.state;
  }

  getCommandBus(): CommandBus {
    return this.commandBus;
  }

  getEventBus(): EventBus {
    return this.eventBus;
  }

  getRandomService(): RandomService {
    return this.random;
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private createEvent<TType extends string>(type: TType): DomainEvent<TType> {
    this.eventSequence += 1;

    return {
      id: `event-${this.eventSequence.toString().padStart(6, "0")}`,
      type,
      tick: this.state.currentTick,
      createdAt: Date.now(),
    };
  }

  private notifyStateChanged(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}
