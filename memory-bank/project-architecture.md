# Proposed Project Architecture

## 1. Purpose

This document defines a practical architecture for building the warehouse/logistics simulation game as a **web-based application** using a hybrid game-plus-app structure.

The goal is to:
- keep simulation logic maintainable
- separate rendering from business logic
- support a rich management UI
- allow fast iteration during prototype development
- scale from MVP to a larger production game without major rewrites

---

## 2. Recommended Tech Stack

### Core Stack
- **Phaser 3** for the game surface and rendering layer
- **React** for application UI and management screens
- **TypeScript** across the entire codebase
- **Vite** for development and build tooling

### Optional Supporting Tools
- **Zustand** for lightweight UI/shared state
- **Web Workers** for off-main-thread simulation later if needed
- **LocalStorage / IndexedDB** for browser saves in MVP
- **Node.js + PostgreSQL** only if cloud saves, accounts, or online features are added later

---

## 3. Architectural Principles

### 3.1 Separation of Concerns
The codebase should be split into distinct layers:
- **Simulation Core** handles all game rules and state transitions
- **Game Rendering Layer** displays the warehouse and map-based visuals
- **UI Layer** handles menus, dialogs, HUD, and planning screens
- **Persistence Layer** handles save/load and configuration

### 3.2 Data-Driven Design
Core game values should come from configuration data rather than being hardcoded.

Examples:
- freight classes
- labor rates
- zone capacities
- difficulty settings
- contract templates
- client profile definitions

### 3.3 Deterministic Simulation Where Possible
The simulation should be structured so that given the same seed and inputs, results are as reproducible as possible.

This improves:
- debugging
- balancing
- testing
- save/load reliability

### 3.4 Presentation Does Not Own Rules
Phaser and React should **display** state and **send player input**, but the actual rules should live in the simulation core.

---

## 4. High-Level Application Model

The application should be organized around three main runtime areas:

### A. Simulation Core
Plain TypeScript systems and data structures.

Responsibilities:
- game clock
- freight generation
- labor processing
- pathing queries
- storage validation
- queue management
- monthly planning effects
- KPI and score calculations
- financial calculations

### B. Phaser Runtime
Responsible for the interactive map and game-world presentation.

Responsibilities:
- render isometric grid
- show overlays and status visuals
- capture map input
- support pan/zoom
- present doors, zones, trailers, congestion, and selections

### C. React Application Shell
Responsible for app-style UI.

Responsibilities:
- HUD panels
- monthly planning dialog
- alerts center
- labor assignment screens
- budgeting screen
- tool palette
- settings and save/load UI

---

## 5. Recommended Runtime Communication Model

Use a **single authoritative simulation state**.

### Recommended flow
1. Player input is captured from Phaser or React
2. Input is translated into commands
3. Commands are sent to the simulation core
4. Simulation core updates authoritative game state
5. Phaser and React read the updated state and re-render

### Example command flow
- Player paints travel tiles in Phaser
- Phaser emits a `PaintZoneCommand`
- Simulation updates map data and zone validity
- Updated state is published
- React updates right-side panel and alerts
- Phaser redraws overlays and valid/invalid tiles

This keeps all rule enforcement centralized.

---

## 6. Proposed Project Folder Structure

```text
src/
  app/
    App.tsx
    main.tsx
    routes/
    providers/
    styles/

  game/
    phaser/
      GameBootstrap.ts
      scenes/
        BootScene.ts
        MainScene.ts
        UIScene.ts
      camera/
      input/
      rendering/
        TileRenderer.ts
        ZoneOverlayRenderer.ts
        DoorRenderer.ts
        QueueOverlayRenderer.ts
        HeatmapRenderer.ts
      debug/

    simulation/
      core/
        GameState.ts
        SimulationRunner.ts
        SimulationClock.ts
        CommandBus.ts
        EventBus.ts
        RandomService.ts

      world/
        WarehouseMap.ts
        Tile.ts
        DoorNode.ts
        Zone.ts
        ZoneManager.ts
        DoorManager.ts
        TravelGraph.ts

      freight/
        FreightBatch.ts
        Trailer.ts
        OutboundOrder.ts
        FreightGenerator.ts
        OrderGenerator.ts

      labor/
        LaborPool.ts
        LaborManager.ts
        SwitchDriverSystem.ts
        UnloadSystem.ts
        StorageSystem.ts
        PickSystem.ts
        LoadSystem.ts
        SanitationSystem.ts
        ManagementSystem.ts

      systems/
        QueueManager.ts
        PathfindingService.ts
        FinanceSystem.ts
        KPIService.ts
        ConditionSystem.ts
        MoraleSystem.ts
        SafetySystem.ts
        SatisfactionSystem.ts
        ContractSystem.ts
        PlanningSystem.ts
        AlertSystem.ts

      commands/
        PaintZoneCommand.ts
        AssignLaborCommand.ts
        ChangeSpeedCommand.ts
        ApplyBudgetPlanCommand.ts
        ConfirmMonthlyPlanCommand.ts

      events/
        MonthStartedEvent.ts
        QueueCriticalEvent.ts
        AlertRaisedEvent.ts
        ZoneInvalidatedEvent.ts
        TrailerArrivedEvent.ts

      selectors/
        mapSelectors.ts
        kpiSelectors.ts
        laborSelectors.ts
        queueSelectors.ts

      types/
        enums.ts
        ids.ts
        dto.ts

    shared/
      constants/
      utils/
      math/

  ui/
    components/
      hud/
      panels/
      dialogs/
      alerts/
      charts/
      tooltips/
    screens/
      MainGameScreen.tsx
      MonthlyPlanningDialog.tsx
      SaveLoadDialog.tsx
      SettingsDialog.tsx
    store/
      uiStore.ts
    hooks/

  data/
    config/
      freightClasses.json
      zoneTypes.json
      laborRoles.json
      difficultyModes.json
      contracts.json
      clientProfiles.json
      seasonalCurves.json

  persistence/
    SaveLoadService.ts
    LocalSaveRepository.ts
    ConfigRepository.ts

  workers/
    simulation.worker.ts

  tests/
    simulation/
    ui/
    integration/
```

---

## 7. Layer Responsibilities in Detail

## 7.1 Simulation Core
The simulation core is the heart of the game and should not depend on Phaser or React.

### Responsibilities
- maintain authoritative game state
- process commands
- execute tick updates
- resolve freight state transitions
- calculate KPIs and scores
- emit simulation events
- expose read-only selectors for UI and rendering layers

### Rules
- no DOM access
- no direct canvas or rendering logic
- no React component logic
- no Phaser scene logic

This allows simulation systems to be unit-tested independently.

---

## 7.2 Phaser Layer
Phaser should be treated as the visual and interactive map shell.

### Responsibilities
- render map and overlays
- capture pointer input on tiles
- show tile selection, drag painting, path highlights, and queue visuals
- animate transitions if needed
- focus camera on alerts or selected objects

### Rules
- Phaser does not own long-term simulation state
- Phaser reads state snapshots/selectors
- Phaser sends player actions as commands to the simulation layer

---

## 7.3 React UI Layer
React handles interface-heavy systems outside the map.

### Responsibilities
- render HUD and KPI panels
- monthly planning workflow
- budget sliders
- labor assignment controls
- contract and satisfaction panels
- alerts center
- settings and save/load panels

### Rules
- React can hold ephemeral UI state
- React should not own authoritative game rules
- any gameplay-affecting change should dispatch a simulation command

---

## 8. State Management Strategy

Use two distinct categories of state:

### 8.1 Authoritative Game State
Owned by the simulation core.

Examples:
- current date/time
- money
- map tiles
- zones
- doors
- trailers
- freight inventory
- queues
- labor allocations
- morale/safety/condition/satisfaction
- contracts
- monthly planning values

### 8.2 UI State
Owned by the UI layer, preferably through a lightweight store.

Examples:
- currently open panel
- selected overlay
- hovered tile
- active paint tool
- dialog visibility
- chart filter selection

### Recommended Store Pattern
- simulation state lives in a simulation container/service
- UI state lives in a small store like Zustand
- React and Phaser both subscribe to simulation selectors

---

## 9. Command-Based Simulation Architecture

Use a **command pattern** for any state-changing player input.

### Example commands
- `PaintZoneCommand`
- `EraseZoneCommand`
- `AssignLaborCommand`
- `SetSpeedCommand`
- `SetBudgetAllocationCommand`
- `ConfirmMonthlyPlanCommand`
- `PauseGameCommand`
- `LoadSaveCommand`

### Benefits
- centralizes validation
- makes save/load safer
- supports replay/debugging later
- easier to test than direct mutation from UI

### Command lifecycle
1. command created by UI or Phaser
2. command validated
3. simulation applies command
4. resulting state changes recorded
5. downstream events emitted if needed

---

## 10. Event-Based Notification Architecture

Use an internal event bus for game events that other systems react to.

### Example events
- month started
- trailer arrived
- zone invalidated
- queue became critical
- safety incident occurred
- contract target missed
- alert raised

### Recommended use
- systems publish domain events
- alert system subscribes and creates notifications
- UI listens for events that should produce visible prompts
- analytics/debug tools listen for telemetry

This keeps systems loosely coupled.

---

## 11. Suggested Simulation Update Pipeline

Each game tick should run through a stable update sequence.

### Suggested update order
1. advance simulation clock
2. detect time boundaries (hour/day/month)
3. generate inbound trailers and outbound demand
4. refresh map validity if zoning changed
5. assign new work into queues
6. process labor systems
7. resolve freight and trailer state changes
8. update congestion and queue metrics
9. update morale, safety, condition, satisfaction
10. update KPIs and finance
11. raise alerts and events
12. publish state snapshot to presentation layers

### Why this matters
A fixed update order prevents strange bugs where systems evaluate stale or partially updated data.

---

## 12. Rendering Architecture

Phaser rendering should be organized into dedicated renderer modules.

### Recommended renderer components
- `TileRenderer`
- `ZoneOverlayRenderer`
- `TravelRenderer`
- `DoorRenderer`
- `TrailerRenderer`
- `QueueOverlayRenderer`
- `HeatmapRenderer`
- `SelectionRenderer`

### Rendering approach
- each renderer reads from selectors, not raw global mutation
- only re-render changed regions or layers where practical
- debug overlays can be toggled independently

### Camera responsibilities
- pan
- zoom
- center on selected object
- focus on alert location

---

## 13. Map Representation

Use a fixed grid model for the warehouse.

### Suggested implementation
- `tiles: Tile[]` as a flat array of 4096 items
- helper functions for x/y conversion
- dock edge auto-generated at map initialization

### Why flat arrays are attractive
- easy serialization
- efficient iteration
- simpler memory layout
- straightforward indexing

### Tile fields
Suggested tile data:
- id/index
- x, y
- zone type
- tile class
- active door reference if any
- travel enabled
- valid for storage flag
- capacity contribution
- local overlay/debug metadata

---

## 14. Zone and Storage Architecture

A tile-based assignment should coexist with aggregated zone objects.

### Per-tile data
Used for:
- painting
- rendering
- direct spatial queries

### Aggregated zone data
Used for:
- capacity calculations
- average distance calculations
- compatibility summaries
- UI inspection panels

### Recommended process
- painting updates tiles
- zone manager reclusters connected compatible storage areas
- zone objects are rebuilt or partially recalculated
- capacity and validity are recomputed

---

## 15. Pathfinding Architecture

Use a dedicated `PathfindingService`.

### Responsibilities
- build travel graph from travel tiles
- answer shortest path and path length queries
- determine reachability
- cache repeated path calculations
- invalidate cache when travel zoning changes

### Optimization strategy
For the MVP, pathfinding can be simplified by caching:
- distance from each door to each zone access point
- travel validity per zone

This avoids recomputing full paths too often.

---

## 16. Labor System Architecture

Each labor function should be implemented as its own simulation system.

### Systems
- `SwitchDriverSystem`
- `UnloadSystem`
- `StorageSystem`
- `PickSystem`
- `LoadSystem`
- `SanitationSystem`
- `ManagementSystem`

### Shared behavior pattern
Each system should:
1. read relevant queue workload
2. read assigned labor pool
3. compute effective processing rate
4. consume work from queue
5. produce outputs and side effects

Example:
- unload system consumes inbound dock queue volume
- moves completed work to storage queue
- updates KPI counters

---

## 17. Monthly Planning Architecture

The monthly planning experience should be driven by a planning system, not by ad hoc UI state.

### PlanningSystem responsibilities
- detect start-of-month planning state
- assemble planning snapshot data
- accept temporary adjustments during editing
- validate final plan
- apply approved plan to authoritative game state

### Recommended planning data model
- forecast summary
- prior-month KPI summary
- current workforce snapshot
- warehouse condition snapshot
- satisfaction summary
- editable budget allocations
- editable labor assignments

### Important rule
Changes inside the planning screen should not fully commit until the player confirms the plan.

---

## 18. Persistence Architecture

For MVP, use local browser persistence.

### Recommended approach
- `SaveLoadService` handles serialization/deserialization
- `LocalSaveRepository` writes save data to LocalStorage or IndexedDB
- one save schema version number included in every save

### Save data should include
- map state
- queues
- freight/trailer/order states
- labor and budget allocations
- scores and KPIs
- financial state
- random seed/state if deterministic continuation matters

### Save versioning
Include:
- `version`
- `timestamp`
- `buildVersion`

This will make future migration easier.

---

## 19. Configuration Architecture

Put balancing data in external config files.

### Suggested config files
- `freightClasses.json`
- `zoneTypes.json`
- `laborRoles.json`
- `difficultyModes.json`
- `contracts.json`
- `clientProfiles.json`
- `seasonalCurves.json`

### Config repository responsibilities
- load config at startup
- validate schema
- expose typed access to simulation systems

### Strong recommendation
Use runtime schema validation for config files so bad balance data does not silently break the game.

---

## 20. Testing Strategy

The architecture should support testing at multiple levels.

### 20.1 Unit Tests
Test pure simulation systems:
- throughput formulas
- queue growth
- morale/safety/condition updates
- storage validity
- path distance calculations
- budget application logic

### 20.2 Integration Tests
Test complete flows:
- inbound freight from trailer to storage
- storage to outbound order to shipped state
- month transition into planning
- save and reload preserves state

### 20.3 UI Tests
Test key UI behavior:
- planning dialog opens on month start
- zone painting mode changes correctly
- alerts focus correct map areas

### 20.4 Deterministic Simulation Tests
Seed the RNG and ensure expected outputs remain stable for known scenarios.

---

## 21. Performance Strategy

Performance matters because the game has a running simulation and many overlays.

### MVP performance priorities
- keep simulation logic lightweight
- avoid unnecessary path recalculation
- batch rendering updates where practical
- avoid deep React re-renders from large state trees

### Scaling strategy later
If simulation cost becomes too high:
- move simulation runner into a Web Worker
- publish snapshots back to the main thread
- keep rendering/input on main thread only

### Good trigger for worker migration
Move to a Web Worker if:
- fast speed stutters noticeably
- large queue calculations block input
- monthly turnover calculations become expensive

---

## 22. Save/Replay and Debugging Potential

A command/event architecture opens future options.

### Potential future benefits
- replay support
- simulation scrubbing for debugging
- automated scenario regression tests
- balancing analysis via logged runs

These are not required for MVP but the architecture should not block them.

---

## 23. Deployment Architecture

### MVP deployment
- static frontend bundle
- hosted on a static host or CDN
- browser-based saves only

### Later online architecture if needed
Add backend only when necessary for:
- user accounts
- cloud saves
- leaderboards
- analytics sync
- shared scenario distribution

A good default later would be:
- frontend: Vite app
- API: Node.js service
- database: PostgreSQL

---

## 24. Suggested Implementation Phases

### Phase 1
- boot Vite app
- mount React shell
- initialize Phaser game canvas
- create shared simulation container

### Phase 2
- implement tile grid and zone painting
- connect Phaser input to simulation commands
- render zones and travel overlays

### Phase 3
- implement queues, freight, doors, and labor systems
- begin ticking simulation
- expose KPIs to React HUD

### Phase 4
- build monthly planning flow
- add budget and labor reallocation systems
- add save/load and alert center

### Phase 5
- optimize performance
- add debug overlays and telemetry
- harden test coverage

---

## 25. Recommended Final Architecture Summary

The strongest architecture for this project is:

- **Phaser for the map and game presentation**
- **React for UI and management screens**
- **TypeScript simulation core as the single source of truth**
- **command-driven state changes**
- **event-driven notifications**
- **data-driven balancing through external config**
- **browser-local persistence for MVP**
- **optional Web Worker migration if simulation load grows**

This approach gives the game:
- strong maintainability
- clean separation of systems
- faster iteration
- easier balancing and testing
- a realistic path from prototype to full production web game

