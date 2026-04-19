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
import { createInitialFreightFlowState } from "../world/DoorManager";
import { FreightGenerator } from "../freight/FreightGenerator";
import { SwitchDriverSystem } from "../labor/SwitchDriverSystem";
import { UnloadSystem } from "../labor/UnloadSystem";
import { QueueManager } from "../systems/QueueManager";

export interface SimulationRunnerOptions {
  seed?: number;
  startingCash?: number;
}

type StateListener = (state: GameState) => void;
type ChangeListener = () => void;

export class SimulationRunner {
  private readonly clock = new SimulationClock();
  private readonly eventBus = new EventBus();
  private readonly random: RandomService;
  private readonly commandBus: CommandBus;
  private readonly freightGenerator = new FreightGenerator();
  private readonly switchDriverSystem = new SwitchDriverSystem();
  private readonly unloadSystem = new UnloadSystem();
  private readonly queueManager = new QueueManager();
  private readonly listeners = new Set<StateListener>();
  private readonly changeListeners = new Set<ChangeListener>();
  private readonly state: GameState;
  private eventSequence = 0;
  private revision = 0;

  constructor(options: SimulationRunnerOptions = {}) {
    this.random = new RandomService(options.seed);
    const warehouseMap = new WarehouseMap(MAP_WIDTH, MAP_HEIGHT);
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
      warehouseMap,
      freightFlow: createInitialFreightFlowState(warehouseMap),
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

    const events = [
      ...this.freightGenerator.generateInbound(
        this.state.freightFlow,
        this.state.currentTick,
        this.random,
        (type) => this.createEvent(type),
      ),
      ...this.switchDriverSystem.process(this.state.freightFlow, this.state.currentTick, (type) =>
        this.createEvent(type),
      ),
      ...this.unloadSystem.process(this.state.freightFlow, this.state.currentTick, (type) =>
        this.createEvent(type),
      ),
    ];

    this.queueManager.updateQueues(this.state.freightFlow, this.state.currentTick);
    this.updateInboundKpis();
    events.push(this.createEvent("simulation-ticked"));
    this.emitEvents(events);
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

  getRevision(): number {
    return this.revision;
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

  subscribeToChanges(listener: ChangeListener): () => void {
    this.changeListeners.add(listener);

    return () => {
      this.changeListeners.delete(listener);
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
    this.revision += 1;

    for (const listener of this.listeners) {
      listener(this.state);
    }

    for (const listener of this.changeListeners) {
      listener();
    }
  }

  private updateInboundKpis(): void {
    this.state.kpis.inboundCubicFeet = this.state.freightFlow.metrics.totalUnloadedCubicFeet;
    this.state.kpis.throughputCubicFeet =
      (this.state.kpis.inboundCubicFeet + this.state.kpis.outboundCubicFeet) / 2;
  }

  private emitEvents(events: DomainEvent[]): void {
    for (const event of events) {
      this.state.debug.lastEventType = event.type;
      this.eventBus.emit(event);
    }
  }
}
