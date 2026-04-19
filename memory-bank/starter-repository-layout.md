# Starter Repository Layout with File Stubs

This document provides a practical starter repository structure for the web-based warehouse simulation game using **Phaser + React + TypeScript + Vite**.

It is designed to:
- mirror the proposed architecture
- give each major system a home
- provide minimal file stubs to start implementation
- keep simulation code separate from presentation code

---

## 1. Suggested Repository Tree

```text
warehouse-sim/
├─ package.json
├─ tsconfig.json
├─ tsconfig.node.json
├─ vite.config.ts
├─ index.html
├─ .gitignore
├─ public/
│  └─ favicon.svg
├─ src/
│  ├─ app/
│  │  ├─ main.tsx
│  │  ├─ App.tsx
│  │  ├─ providers/
│  │  │  └─ SimulationProvider.tsx
│  │  └─ styles/
│  │     └─ global.css
│  ├─ game/
│  │  ├─ phaser/
│  │  │  ├─ GameBootstrap.ts
│  │  │  ├─ scenes/
│  │  │  │  ├─ BootScene.ts
│  │  │  │  ├─ MainScene.ts
│  │  │  │  └─ UIScene.ts
│  │  │  ├─ input/
│  │  │  │  └─ MapInputController.ts
│  │  │  └─ rendering/
│  │  │     ├─ TileRenderer.ts
│  │  │     ├─ ZoneOverlayRenderer.ts
│  │  │     └─ DoorRenderer.ts
│  │  ├─ simulation/
│  │  │  ├─ core/
│  │  │  │  ├─ GameState.ts
│  │  │  │  ├─ SimulationRunner.ts
│  │  │  │  ├─ SimulationClock.ts
│  │  │  │  ├─ CommandBus.ts
│  │  │  │  ├─ EventBus.ts
│  │  │  │  └─ RandomService.ts
│  │  │  ├─ world/
│  │  │  │  ├─ Tile.ts
│  │  │  │  ├─ WarehouseMap.ts
│  │  │  │  ├─ DoorNode.ts
│  │  │  │  ├─ Zone.ts
│  │  │  │  ├─ ZoneManager.ts
│  │  │  │  └─ TravelGraph.ts
│  │  │  ├─ freight/
│  │  │  │  ├─ Trailer.ts
│  │  │  │  ├─ FreightBatch.ts
│  │  │  │  ├─ OutboundOrder.ts
│  │  │  │  ├─ FreightGenerator.ts
│  │  │  │  └─ OrderGenerator.ts
│  │  │  ├─ labor/
│  │  │  │  ├─ LaborPool.ts
│  │  │  │  ├─ LaborManager.ts
│  │  │  │  ├─ SwitchDriverSystem.ts
│  │  │  │  ├─ UnloadSystem.ts
│  │  │  │  ├─ StorageSystem.ts
│  │  │  │  ├─ PickSystem.ts
│  │  │  │  ├─ LoadSystem.ts
│  │  │  │  ├─ SanitationSystem.ts
│  │  │  │  └─ ManagementSystem.ts
│  │  │  ├─ systems/
│  │  │  │  ├─ QueueManager.ts
│  │  │  │  ├─ PathfindingService.ts
│  │  │  │  ├─ FinanceSystem.ts
│  │  │  │  ├─ KPIService.ts
│  │  │  │  ├─ ConditionSystem.ts
│  │  │  │  ├─ MoraleSystem.ts
│  │  │  │  ├─ SafetySystem.ts
│  │  │  │  ├─ SatisfactionSystem.ts
│  │  │  │  ├─ ContractSystem.ts
│  │  │  │  ├─ PlanningSystem.ts
│  │  │  │  └─ AlertSystem.ts
│  │  │  ├─ commands/
│  │  │  │  ├─ Command.ts
│  │  │  │  ├─ PaintZoneCommand.ts
│  │  │  │  ├─ AssignLaborCommand.ts
│  │  │  │  ├─ ChangeSpeedCommand.ts
│  │  │  │  └─ ApplyBudgetPlanCommand.ts
│  │  │  ├─ events/
│  │  │  │  ├─ DomainEvent.ts
│  │  │  │  ├─ AlertRaisedEvent.ts
│  │  │  │  ├─ MonthStartedEvent.ts
│  │  │  │  └─ QueueCriticalEvent.ts
│  │  │  ├─ selectors/
│  │  │  │  ├─ mapSelectors.ts
│  │  │  │  ├─ kpiSelectors.ts
│  │  │  │  └─ queueSelectors.ts
│  │  │  └─ types/
│  │  │     ├─ enums.ts
│  │  │     ├─ ids.ts
│  │  │     └─ dto.ts
│  │  └─ shared/
│  │     ├─ constants/
│  │     │  └─ map.ts
│  │     ├─ math/
│  │     │  └─ distance.ts
│  │     └─ utils/
│  │        └─ clamp.ts
│  ├─ ui/
│  │  ├─ components/
│  │  │  ├─ hud/
│  │  │  │  └─ TopHud.tsx
│  │  │  ├─ panels/
│  │  │  │  ├─ LeftToolPanel.tsx
│  │  │  │  ├─ RightOperationsPanel.tsx
│  │  │  │  └─ BottomKpiBar.tsx
│  │  │  ├─ dialogs/
│  │  │  │  └─ MonthlyPlanningDialog.tsx
│  │  │  ├─ alerts/
│  │  │  │  └─ AlertsCenter.tsx
│  │  │  └─ tooltips/
│  │  │     └─ MetricTooltip.tsx
│  │  ├─ screens/
│  │  │  └─ MainGameScreen.tsx
│  │  ├─ store/
│  │  │  └─ uiStore.ts
│  │  └─ hooks/
│  │     └─ useSimulation.ts
│  ├─ data/
│  │  └─ config/
│  │     ├─ freightClasses.json
│  │     ├─ zoneTypes.json
│  │     ├─ laborRoles.json
│  │     └─ difficultyModes.json
│  ├─ persistence/
│  │  ├─ SaveLoadService.ts
│  │  └─ ConfigRepository.ts
│  └─ tests/
│     └─ simulation/
│        └─ SimulationRunner.test.ts
└─ README.md
```

---

## 2. Root Files

### `package.json`
```json
{
  "name": "warehouse-sim",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "phaser": "^3.90.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zustand": "^5.0.0"
  },
  "devDependencies": {
    "@types/node": "^24.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "^5.8.0",
    "vite": "^8.0.0",
    "vitest": "^3.0.0"
  }
}
```

### `vite.config.ts`
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### `README.md`
```md
# Warehouse Sim

A web-based warehouse and logistics simulation game built with Phaser, React, TypeScript, and Vite.

## Scripts
- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run test`
```

---

## 3. App Shell

### `src/app/main.tsx`
```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### `src/app/App.tsx`
```tsx
import { SimulationProvider } from "./providers/SimulationProvider";
import { MainGameScreen } from "../ui/screens/MainGameScreen";

export default function App() {
  return (
    <SimulationProvider>
      <MainGameScreen />
    </SimulationProvider>
  );
}
```

### `src/app/providers/SimulationProvider.tsx`
```tsx
import { PropsWithChildren, useMemo } from "react";
import { SimulationRunner } from "../../game/simulation/core/SimulationRunner";

export function SimulationProvider({ children }: PropsWithChildren) {
  const simulation = useMemo(() => new SimulationRunner(), []);

  void simulation;

  return <>{children}</>;
}
```

### `src/app/styles/global.css`
```css
html, body, #root {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: Arial, sans-serif;
}

* {
  box-sizing: border-box;
}
```

---

## 4. Phaser Bootstrap

### `src/game/phaser/GameBootstrap.ts`
```ts
import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { MainScene } from "./scenes/MainScene";
import { UIScene } from "./scenes/UIScene";

export function createGame(container: string): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: container,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: "#1f2430",
    scene: [BootScene, MainScene, UIScene],
  });
}
```

### `src/game/phaser/scenes/BootScene.ts`
```ts
import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    this.scene.start("MainScene");
    this.scene.start("UIScene");
  }
}
```

### `src/game/phaser/scenes/MainScene.ts`
```ts
import Phaser from "phaser";

export class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
  }

  create() {
    this.add.text(24, 24, "Warehouse Map Placeholder", { color: "#ffffff" });
  }

  update(_time: number, _delta: number) {
    // Simulation-driven map rendering updates will go here.
  }
}
```

### `src/game/phaser/scenes/UIScene.ts`
```ts
import Phaser from "phaser";

export class UIScene extends Phaser.Scene {
  constructor() {
    super("UIScene");
  }

  create() {
    // Optional Phaser-native overlays can be created here.
  }
}
```

### `src/game/phaser/input/MapInputController.ts`
```ts
export class MapInputController {
  attach() {
    // Hook pointer events into paint/select commands.
  }
}
```

### `src/game/phaser/rendering/TileRenderer.ts`
```ts
export class TileRenderer {
  render() {
    // Render base isometric tiles.
  }
}
```

### `src/game/phaser/rendering/ZoneOverlayRenderer.ts`
```ts
export class ZoneOverlayRenderer {
  render() {
    // Render zone colors, invalid overlays, and highlights.
  }
}
```

### `src/game/phaser/rendering/DoorRenderer.ts`
```ts
export class DoorRenderer {
  render() {
    // Render active dock doors and door state indicators.
  }
}
```

---

## 5. Simulation Core

### `src/game/simulation/core/GameState.ts`
```ts
import { WarehouseMap } from "../world/WarehouseMap";

export interface GameState {
  currentTick: number;
  speed: "paused" | "slow" | "medium" | "fast";
  cash: number;
  warehouseMap: WarehouseMap;
}
```

### `src/game/simulation/core/SimulationClock.ts`
```ts
export class SimulationClock {
  private tick = 0;

  advance(): number {
    this.tick += 1;
    return this.tick;
  }

  getTick(): number {
    return this.tick;
  }
}
```

### `src/game/simulation/core/CommandBus.ts`
```ts
import { Command } from "../commands/Command";

export class CommandBus {
  dispatch(command: Command): void {
    command.execute();
  }
}
```

### `src/game/simulation/core/EventBus.ts`
```ts
import { DomainEvent } from "../events/DomainEvent";

export class EventBus {
  emit(_event: DomainEvent): void {
    // Publish domain events to subscribers.
  }
}
```

### `src/game/simulation/core/RandomService.ts`
```ts
export class RandomService {
  next(): number {
    return Math.random();
  }
}
```

### `src/game/simulation/core/SimulationRunner.ts`
```ts
import { SimulationClock } from "./SimulationClock";
import { WarehouseMap } from "../world/WarehouseMap";
import type { GameState } from "./GameState";

export class SimulationRunner {
  private readonly clock = new SimulationClock();
  private readonly state: GameState;

  constructor() {
    this.state = {
      currentTick: 0,
      speed: "paused",
      cash: 100000,
      warehouseMap: new WarehouseMap(64, 64),
    };
  }

  tick(): void {
    this.state.currentTick = this.clock.advance();
  }

  getState(): GameState {
    return this.state;
  }
}
```

---

## 6. World Layer

### `src/game/simulation/world/Tile.ts`
```ts
import { TileZoneType } from "../types/enums";

export interface Tile {
  x: number;
  y: number;
  zoneType: TileZoneType;
  isDockEdge: boolean;
  isActiveDoor: boolean;
}
```

### `src/game/simulation/world/WarehouseMap.ts`
```ts
import type { Tile } from "./Tile";
import { TileZoneType } from "../types/enums";

export class WarehouseMap {
  readonly width: number;
  readonly height: number;
  readonly tiles: Tile[];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.tiles = [];

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const isDockEdge = x === 0 || y === 0 || x === width - 1 || y === height - 1;
        this.tiles.push({
          x,
          y,
          zoneType: isDockEdge ? TileZoneType.Dock : TileZoneType.Unassigned,
          isDockEdge,
          isActiveDoor: false,
        });
      }
    }
  }
}
```

### `src/game/simulation/world/DoorNode.ts`
```ts
export interface DoorNode {
  id: string;
  x: number;
  y: number;
  mode: "inbound" | "outbound" | "flex";
}
```

### `src/game/simulation/world/Zone.ts`
```ts
export interface Zone {
  id: string;
  tileIndexes: number[];
  capacityCubicFeet: number;
  usedCubicFeet: number;
}
```

### `src/game/simulation/world/ZoneManager.ts`
```ts
export class ZoneManager {
  rebuildZones(): void {
    // Recluster tiles into logical zones and recalculate capacity.
  }
}
```

### `src/game/simulation/world/TravelGraph.ts`
```ts
export class TravelGraph {
  rebuild(): void {
    // Rebuild pathing graph from travel tiles.
  }
}
```

---

## 7. Freight Layer

### `src/game/simulation/freight/Trailer.ts`
```ts
export interface Trailer {
  id: string;
  direction: "inbound" | "outbound";
  state: string;
}
```

### `src/game/simulation/freight/FreightBatch.ts`
```ts
export interface FreightBatch {
  id: string;
  freightClassId: string;
  cubicFeet: number;
  state: string;
}
```

### `src/game/simulation/freight/OutboundOrder.ts`
```ts
export interface OutboundOrder {
  id: string;
  cubicFeet: number;
  dueTick: number;
}
```

### `src/game/simulation/freight/FreightGenerator.ts`
```ts
export class FreightGenerator {
  generateInbound(): void {
    // Spawn inbound trailers based on forecast and demand rules.
  }
}
```

### `src/game/simulation/freight/OrderGenerator.ts`
```ts
export class OrderGenerator {
  generateOutbound(): void {
    // Generate outbound orders from available stored freight.
  }
}
```

---

## 8. Labor Layer

### `src/game/simulation/labor/LaborPool.ts`
```ts
export interface LaborPool {
  roleId: string;
  assignedHeadcount: number;
  availableHeadcount: number;
}
```

### `src/game/simulation/labor/LaborManager.ts`
```ts
export class LaborManager {
  assignLabor(_roleId: string, _headcount: number): void {
    // Update pooled labor allocations.
  }
}
```

### `src/game/simulation/labor/SwitchDriverSystem.ts`
```ts
export class SwitchDriverSystem {
  process(): void {
    // Move trailers between yard and doors.
  }
}
```

### `src/game/simulation/labor/UnloadSystem.ts`
```ts
export class UnloadSystem {
  process(): void {
    // Unload inbound freight to dock.
  }
}
```

### `src/game/simulation/labor/StorageSystem.ts`
```ts
export class StorageSystem {
  process(): void {
    // Move dock freight into valid storage zones.
  }
}
```

### `src/game/simulation/labor/PickSystem.ts`
```ts
export class PickSystem {
  process(): void {
    // Pick freight from storage for outbound demand.
  }
}
```

### `src/game/simulation/labor/LoadSystem.ts`
```ts
export class LoadSystem {
  process(): void {
    // Load picked freight into outbound trailers.
  }
}
```

### `src/game/simulation/labor/SanitationSystem.ts`
```ts
export class SanitationSystem {
  process(): void {
    // Improve condition and reduce cleanliness-related penalties.
  }
}
```

### `src/game/simulation/labor/ManagementSystem.ts`
```ts
export class ManagementSystem {
  process(): void {
    // Apply management-based support modifiers.
  }
}
```

---

## 9. Systems Layer

### `src/game/simulation/systems/QueueManager.ts`
```ts
export class QueueManager {
  updateQueues(): void {
    // Recalculate queue sizes, wait time, and bottleneck severity.
  }
}
```

### `src/game/simulation/systems/PathfindingService.ts`
```ts
export class PathfindingService {
  getPathDistance(_startIndex: number, _endIndex: number): number {
    return 0;
  }
}
```

### `src/game/simulation/systems/FinanceSystem.ts`
```ts
export class FinanceSystem {
  update(): void {
    // Accrue revenue, labor cost, and monthly operating expenses.
  }
}
```

### `src/game/simulation/systems/KPIService.ts`
```ts
export class KPIService {
  update(): void {
    // Track inbound, outbound, throughput, and dwell metrics.
  }
}
```

### `src/game/simulation/systems/ConditionSystem.ts`
```ts
export class ConditionSystem {
  update(): void {
    // Update warehouse condition score.
  }
}
```

### `src/game/simulation/systems/MoraleSystem.ts`
```ts
export class MoraleSystem {
  update(): void {
    // Update workforce morale score.
  }
}
```

### `src/game/simulation/systems/SafetySystem.ts`
```ts
export class SafetySystem {
  update(): void {
    // Update safety score and roll for incident risk.
  }
}
```

### `src/game/simulation/systems/SatisfactionSystem.ts`
```ts
export class SatisfactionSystem {
  update(): void {
    // Update client and customer satisfaction scores.
  }
}
```

### `src/game/simulation/systems/ContractSystem.ts`
```ts
export class ContractSystem {
  update(): void {
    // Evaluate contract performance and demand targets.
  }
}
```

### `src/game/simulation/systems/PlanningSystem.ts`
```ts
export class PlanningSystem {
  beginMonthlyPlanning(): void {
    // Create a snapshot for the monthly planning dialog.
  }
}
```

### `src/game/simulation/systems/AlertSystem.ts`
```ts
export class AlertSystem {
  update(): void {
    // Build actionable alerts from current state.
  }
}
```

---

## 10. Commands and Events

### `src/game/simulation/commands/Command.ts`
```ts
export interface Command {
  execute(): void;
}
```

### `src/game/simulation/commands/PaintZoneCommand.ts`
```ts
import { Command } from "./Command";

export class PaintZoneCommand implements Command {
  execute(): void {
    // Apply zone painting to a tile range.
  }
}
```

### `src/game/simulation/commands/AssignLaborCommand.ts`
```ts
import { Command } from "./Command";

export class AssignLaborCommand implements Command {
  execute(): void {
    // Assign labor to a functional role.
  }
}
```

### `src/game/simulation/commands/ChangeSpeedCommand.ts`
```ts
import { Command } from "./Command";

export class ChangeSpeedCommand implements Command {
  execute(): void {
    // Change game speed.
  }
}
```

### `src/game/simulation/commands/ApplyBudgetPlanCommand.ts`
```ts
import { Command } from "./Command";

export class ApplyBudgetPlanCommand implements Command {
  execute(): void {
    // Apply confirmed monthly budget settings.
  }
}
```

### `src/game/simulation/events/DomainEvent.ts`
```ts
export interface DomainEvent {
  type: string;
}
```

### `src/game/simulation/events/AlertRaisedEvent.ts`
```ts
import { DomainEvent } from "./DomainEvent";

export interface AlertRaisedEvent extends DomainEvent {
  type: "alert-raised";
  message: string;
}
```

### `src/game/simulation/events/MonthStartedEvent.ts`
```ts
import { DomainEvent } from "./DomainEvent";

export interface MonthStartedEvent extends DomainEvent {
  type: "month-started";
  month: number;
}
```

### `src/game/simulation/events/QueueCriticalEvent.ts`
```ts
import { DomainEvent } from "./DomainEvent";

export interface QueueCriticalEvent extends DomainEvent {
  type: "queue-critical";
  queueId: string;
}
```

---

## 11. Selectors and Types

### `src/game/simulation/selectors/mapSelectors.ts`
```ts
import type { GameState } from "../core/GameState";

export function selectWarehouseMap(state: GameState) {
  return state.warehouseMap;
}
```

### `src/game/simulation/selectors/kpiSelectors.ts`
```ts
import type { GameState } from "../core/GameState";

export function selectCash(state: GameState): number {
  return state.cash;
}
```

### `src/game/simulation/selectors/queueSelectors.ts`
```ts
export function selectCriticalQueues(): string[] {
  return [];
}
```

### `src/game/simulation/types/enums.ts`
```ts
export enum TileZoneType {
  Unassigned = "unassigned",
  Dock = "dock",
  Travel = "travel",
  StandardStorage = "standard-storage",
  BulkStorage = "bulk-storage",
  FastTurnStorage = "fast-turn-storage",
  SpecialHandlingStorage = "special-handling-storage",
}
```

### `src/game/simulation/types/ids.ts`
```ts
export type EntityId = string;
```

### `src/game/simulation/types/dto.ts`
```ts
export interface BudgetPlanDto {
  payroll: number;
  maintenance: number;
  training: number;
  safety: number;
}
```

---

## 12. Shared Utilities

### `src/game/shared/constants/map.ts`
```ts
export const MAP_WIDTH = 64;
export const MAP_HEIGHT = 64;
```

### `src/game/shared/math/distance.ts`
```ts
export function manhattanDistance(ax: number, ay: number, bx: number, by: number): number {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}
```

### `src/game/shared/utils/clamp.ts`
```ts
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
```

---

## 13. React UI Layer

### `src/ui/screens/MainGameScreen.tsx`
```tsx
import { useEffect, useRef } from "react";
import { createGame } from "../../game/phaser/GameBootstrap";
import { TopHud } from "../components/hud/TopHud";
import { LeftToolPanel } from "../components/panels/LeftToolPanel";
import { RightOperationsPanel } from "../components/panels/RightOperationsPanel";
import { BottomKpiBar } from "../components/panels/BottomKpiBar";

export function MainGameScreen() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const game = createGame(containerRef.current.id);
    return () => game.destroy(true);
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <TopHud />
      <LeftToolPanel />
      <RightOperationsPanel />
      <BottomKpiBar />
      <div id="phaser-game" ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
```

### `src/ui/components/hud/TopHud.tsx`
```tsx
export function TopHud() {
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: 12, zIndex: 10 }}>
      Top HUD Placeholder
    </div>
  );
}
```

### `src/ui/components/panels/LeftToolPanel.tsx`
```tsx
export function LeftToolPanel() {
  return (
    <div style={{ position: "absolute", top: 64, left: 0, width: 220, padding: 12, zIndex: 10 }}>
      Left Tool Panel Placeholder
    </div>
  );
}
```

### `src/ui/components/panels/RightOperationsPanel.tsx`
```tsx
export function RightOperationsPanel() {
  return (
    <div style={{ position: "absolute", top: 64, right: 0, width: 280, padding: 12, zIndex: 10 }}>
      Right Operations Panel Placeholder
    </div>
  );
}
```

### `src/ui/components/panels/BottomKpiBar.tsx`
```tsx
export function BottomKpiBar() {
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 12, zIndex: 10 }}>
      Bottom KPI Bar Placeholder
    </div>
  );
}
```

### `src/ui/components/dialogs/MonthlyPlanningDialog.tsx`
```tsx
export function MonthlyPlanningDialog() {
  return <div>Monthly Planning Dialog Placeholder</div>;
}
```

### `src/ui/components/alerts/AlertsCenter.tsx`
```tsx
export function AlertsCenter() {
  return <div>Alerts Center Placeholder</div>;
}
```

### `src/ui/components/tooltips/MetricTooltip.tsx`
```tsx
import { PropsWithChildren } from "react";

export function MetricTooltip({ children }: PropsWithChildren) {
  return <>{children}</>;
}
```

### `src/ui/store/uiStore.ts`
```ts
import { create } from "zustand";

interface UiState {
  activeTool: string;
  setActiveTool: (tool: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeTool: "select",
  setActiveTool: (tool) => set({ activeTool: tool }),
}));
```

### `src/ui/hooks/useSimulation.ts`
```ts
export function useSimulation() {
  return {
    connected: true,
  };
}
```

---

## 14. Data Config Stubs

### `src/data/config/freightClasses.json`
```json
[
  {
    "id": "standard",
    "name": "Standard Freight",
    "baseRevenuePerCubicFoot": 0.3
  }
]
```

### `src/data/config/zoneTypes.json`
```json
[
  {
    "id": "standard-storage",
    "name": "Standard Storage",
    "capacityPerTile": 500
  }
]
```

### `src/data/config/laborRoles.json`
```json
[
  {
    "id": "switch-driver",
    "name": "Switch Driver",
    "baseRate": 1
  }
]
```

### `src/data/config/difficultyModes.json`
```json
[
  {
    "id": "amateur",
    "name": "Amateur",
    "startingCash": 250000
  }
]
```

---

## 15. Persistence Layer

### `src/persistence/SaveLoadService.ts`
```ts
export class SaveLoadService {
  save(_slotId: string): void {
    // Serialize current game state.
  }

  load(_slotId: string): void {
    // Deserialize saved game state.
  }
}
```

### `src/persistence/ConfigRepository.ts`
```ts
import freightClasses from "../data/config/freightClasses.json";

export class ConfigRepository {
  getFreightClasses() {
    return freightClasses;
  }
}
```

---

## 16. Test Stub

### `src/tests/simulation/SimulationRunner.test.ts`
```ts
import { describe, expect, it } from "vitest";
import { SimulationRunner } from "../../game/simulation/core/SimulationRunner";

describe("SimulationRunner", () => {
  it("advances the simulation clock", () => {
    const runner = new SimulationRunner();
    runner.tick();
    expect(runner.getState().currentTick).toBe(1);
  });
});
```

---

## 17. Recommended First Real Implementation Steps

After creating the repository from these stubs, the first real coding steps should be:

1. wire `SimulationProvider` so React and Phaser can both access the same simulation runner
2. render the 64x64 tile grid in Phaser
3. implement tile selection and click-drag zone painting
4. connect `PaintZoneCommand` to actual tile updates
5. create the first overlay for dock, travel, and storage zones
6. hook the HUD to simulation selectors
7. add a ticking loop with pause/slow/medium/fast speed control
8. begin implementing queue and labor systems one at a time

---

## 18. Notes

This layout is intentionally minimal. It is meant to provide:
- a clean starting point
- file ownership boundaries
- a stable project skeleton for rapid prototyping

The stubs do not yet include:
- complete type wiring
- dependency injection
- real selector subscriptions
- full pathfinding
- real save/load serialization
- production CSS or art pipeline

Those can be added incrementally once the core prototype loop is working.

