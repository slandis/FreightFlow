import { MAP_HEIGHT, MAP_WIDTH } from "../../shared/constants/map";
import type { Command, CommandResult } from "../commands/Command";
import { CommandBus } from "./CommandBus";
import { EventBus } from "./EventBus";
import { WarehouseMap } from "../world/WarehouseMap";
import type { GameState } from "./GameState";
import {
  createInitialAlertState,
  createInitialContractState,
  createInitialEconomyState,
  createInitialPlanningState,
  createInitialScoreState,
  getMonthKey,
  type SimulationCalendar,
} from "./GameState";
import { RandomService } from "./RandomService";
import { SimulationClock } from "./SimulationClock";
import type { DomainEvent } from "../events/DomainEvent";
import { GameSpeed, LaborRole } from "../types/enums";
import { createInitialFreightFlowState } from "../world/DoorManager";
import { FreightGenerator } from "../freight/FreightGenerator";
import { OrderGenerator } from "../freight/OrderGenerator";
import { LaborManager } from "../labor/LaborManager";
import { LaborAnalyticsRecorder } from "../labor/LaborAnalyticsRecorder";
import { LoadSystem } from "../labor/LoadSystem";
import { PickSystem } from "../labor/PickSystem";
import { StorageSystem } from "../labor/StorageSystem";
import { SwitchDriverSystem } from "../labor/SwitchDriverSystem";
import { UnloadSystem } from "../labor/UnloadSystem";
import { QueueManager } from "../systems/QueueManager";
import { AlertSystem } from "../systems/AlertSystem";
import { ConditionSystem } from "../systems/ConditionSystem";
import { ContractSystem } from "../systems/ContractSystem";
import { FinanceSystem } from "../systems/FinanceSystem";
import { KPIService } from "../systems/KPIService";
import { MoraleSystem } from "../systems/MoraleSystem";
import {
  applyQueuedMonthlyPlan,
  openMonthlyPlanning,
  PlanningSystem,
} from "../systems/PlanningSystem";
import { SafetySystem } from "../systems/SafetySystem";
import { SatisfactionSystem } from "../systems/SatisfactionSystem";
import {
  DEFAULT_DIFFICULTY_MODE_ID,
  getDifficultyModeById,
} from "../config/difficulty";

export interface SimulationRunnerOptions {
  seed?: number;
  startingCash?: number;
  initialCalendar?: SimulationCalendar;
  openInitialPlanning?: boolean;
  difficultyModeId?: string;
}

type StateListener = (state: GameState) => void;
type ChangeListener = () => void;

export class SimulationRunner {
  private readonly clock: SimulationClock;
  private readonly eventBus = new EventBus();
  private readonly random: RandomService;
  private readonly commandBus: CommandBus;
  private readonly freightGenerator = new FreightGenerator();
  private readonly orderGenerator = new OrderGenerator();
  private readonly switchDriverSystem = new SwitchDriverSystem();
  private readonly unloadSystem = new UnloadSystem();
  private readonly storageSystem = new StorageSystem();
  private readonly pickSystem = new PickSystem();
  private readonly loadSystem = new LoadSystem();
  private readonly laborManager = new LaborManager();
  private readonly laborAnalyticsRecorder = new LaborAnalyticsRecorder();
  private readonly queueManager = new QueueManager();
  private readonly conditionSystem = new ConditionSystem();
  private readonly moraleSystem = new MoraleSystem();
  private readonly safetySystem = new SafetySystem();
  private readonly satisfactionSystem = new SatisfactionSystem();
  private readonly planningSystem = new PlanningSystem();
  private readonly contractSystem = new ContractSystem();
  private readonly financeSystem = new FinanceSystem();
  private readonly kpiService = new KPIService();
  private readonly alertSystem = new AlertSystem();
  private readonly listeners = new Set<StateListener>();
  private readonly changeListeners = new Set<ChangeListener>();
  private readonly state: GameState;
  private eventSequence = 0;
  private revision = 0;

  constructor(options: SimulationRunnerOptions = {}) {
    this.clock = new SimulationClock(options.initialCalendar);
    this.random = new RandomService(options.seed);
    const warehouseMap = new WarehouseMap(MAP_WIDTH, MAP_HEIGHT);
    const calendar = this.clock.getCalendar();
    const difficultyMode = getDifficultyModeById(
      options.difficultyModeId ?? DEFAULT_DIFFICULTY_MODE_ID,
    );
    const labor = this.laborManager.createInitialLaborState(
      getMonthKey(calendar),
      difficultyMode.initialHeadcount,
    );
    this.state = {
      currentTick: 0,
      calendar,
      difficultyModeId: difficultyMode.id,
      speed: GameSpeed.Paused,
      cash: options.startingCash ?? difficultyMode.startingCash,
      kpis: {
        inboundCubicFeet: 0,
        outboundCubicFeet: 0,
        throughputCubicFeet: 0,
        revenue: 0,
        laborCost: 0,
        operatingCost: 0,
        netOperatingResult: 0,
        moraleScore: 80,
        conditionScore: 85,
        safetyScore: 90,
        clientSatisfactionScore: 82,
        customerSatisfactionScore: 82,
      },
      debug: {
        lastCommandType: null,
        lastEventType: null,
      },
      warehouseMap,
      freightFlow: createInitialFreightFlowState(warehouseMap),
      labor,
      economy: createInitialEconomyState(),
      scores: createInitialScoreState(),
      contracts: createInitialContractState(),
      alerts: createInitialAlertState(),
      planning: createInitialPlanningState(calendar, labor),
    };

    this.commandBus = new CommandBus({
      state: this.state,
      eventBus: this.eventBus,
      random: this.random,
      createEvent: (type) => this.createEvent(type),
    });

    if (options.openInitialPlanning) {
      openMonthlyPlanning(this.state, this.random, (type) => this.createEvent(type), {
        monthKey: this.state.planning.currentPlan.monthKey,
        regenerateOffers: true,
        resetCurrentMonthEconomy: true,
        setSpeedToSlow: false,
      });
      this.state.speed = GameSpeed.Paused;
    }
  }

  tick(): void {
    if (this.state.planning.isPlanningActive) {
      return;
    }

    this.tickInternal(true);
  }

  tickMany(tickCount: number): number {
    if (tickCount <= 0) {
      return 0;
    }

    let executedTicks = 0;

    for (let tickIndex = 0; tickIndex < tickCount; tickIndex += 1) {
      if (this.state.planning.isPlanningActive) {
        break;
      }

      this.tickInternal(false);
      executedTicks += 1;

      if (this.state.planning.isPlanningActive) {
        break;
      }
    }

    this.notifyStateChanged();

    return executedTicks;
  }

  dispatch(command: Command): CommandResult {
    const result = this.commandBus.dispatch(command);
    this.notifyStateChanged();
    return result;
  }

  getState(): GameState {
    return this.state;
  }

  replaceState(nextState: GameState): void {
    Object.assign(this.state, nextState);
    this.clock.restore(nextState.currentTick, nextState.calendar);
    this.notifyStateChanged();
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

  private tickInternal(notifyAfterTick: boolean): void {
    this.state.currentTick = this.clock.advance();
    this.state.calendar = this.clock.getCalendar();
    const queuedPlanEvents = applyQueuedMonthlyPlan(this.state, (type) => this.createEvent(type));
    const difficultyMode = getDifficultyModeById(this.state.difficultyModeId);
    const planningEvents = this.planningSystem.update(this.state, this.random, (type) =>
      this.createEvent(type),
    );
    this.laborManager.recalculate(
      this.state.labor,
      this.laborManager.calculateWorkloads(this.state.freightFlow),
      this.state.planning.currentPlan.budget,
    );
    this.laborAnalyticsRecorder.recordTick(this.state.labor);

    const events = [
      ...queuedPlanEvents,
      ...planningEvents,
      ...this.freightGenerator.generateInbound(
        this.state.freightFlow,
        this.state.currentTick,
        this.random,
        (type) => this.createEvent(type),
        difficultyMode,
        this.state.contracts.activeContracts,
      ),
      ...this.switchDriverSystem.process(
        this.state.freightFlow,
        this.state.warehouseMap,
        this.state.currentTick,
        (type) => this.createEvent(type),
        this.laborManager.getAssignedHeadcount(this.state.labor, LaborRole.SwitchDriver),
        this.state.labor,
      ),
      ...this.unloadSystem.process(
        this.state.freightFlow,
        this.state.warehouseMap,
        this.state.currentTick,
        (type) => this.createEvent(type),
        this.laborManager.getProcessingCapacity(this.state.labor, LaborRole.Unload),
        this.state.labor,
      ),
      ...this.storageSystem.process(
        this.state.freightFlow,
        this.state.warehouseMap,
        this.state.currentTick,
        (type) => this.createEvent(type),
        this.laborManager.getProcessingCapacity(this.state.labor, LaborRole.Storage),
        this.state.labor,
      ),
      ...this.orderGenerator.generateOutbound(
        this.state.freightFlow,
        this.state.currentTick,
        this.random,
        (type) => this.createEvent(type),
        difficultyMode,
      ),
      ...this.pickSystem.process(
        this.state.freightFlow,
        this.state.currentTick,
        (type) => this.createEvent(type),
        this.laborManager.getProcessingCapacity(this.state.labor, LaborRole.Pick),
        this.state.labor,
      ),
      ...this.loadSystem.process(
        this.state.freightFlow,
        this.state.currentTick,
        (type) => this.createEvent(type),
        this.laborManager.getProcessingCapacity(this.state.labor, LaborRole.Load),
        this.state.labor,
      ),
    ];

    this.queueManager.updateQueues(
      this.state.freightFlow,
      this.state.currentTick,
      this.state.warehouseMap,
    );
    this.laborManager.recalculate(
      this.state.labor,
      this.laborManager.calculateWorkloads(this.state.freightFlow),
      this.state.planning.currentPlan.budget,
    );
    this.conditionSystem.update(this.state);
    this.moraleSystem.update(this.state);
    this.safetySystem.update(this.state);
    this.satisfactionSystem.update(this.state);
    this.contractSystem.update(this.state);
    events.push(...this.financeSystem.update(this.state, (type) => this.createEvent(type)));
    this.kpiService.update(this.state);
    events.push(...this.alertSystem.update(this.state, (type) => this.createEvent(type)));
    events.push(this.createEvent("simulation-ticked"));
    this.emitEvents(events);

    if (notifyAfterTick) {
      this.notifyStateChanged();
    }
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

  private emitEvents(events: DomainEvent[]): void {
    for (const event of events) {
      this.state.debug.lastEventType = event.type;
      this.eventBus.emit(event);
    }
  }
}
