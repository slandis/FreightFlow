# Detailed Implementation Plan

## 1. Purpose

This document provides a detailed implementation plan for building the warehouse/logistics simulation game as a **web-based application** using:

- **Phaser 3** for map rendering and game presentation
- **React** for UI and management screens
- **TypeScript** for the full codebase
- **Vite** for local development and builds

The plan is intended to:
- guide engineering execution
- define build order and dependencies
- reduce rework by establishing sequence and ownership
- identify validation points at each stage
- provide a roadmap from empty repository to playable MVP

---

## 2. Delivery Goals

The implementation should reach the following major outcomes in order:

1. establish a working web application shell
2. render a navigable warehouse map
3. support tile zoning and zone validation
4. implement the core simulation loop and time controls
5. process inbound and outbound freight flows
6. implement labor, queues, and bottlenecks
7. implement planning, budgets, and KPI systems
8. deliver a stable MVP suitable for playtesting

---

## 3. Guiding Principles

### 3.1 Build Vertical Slices
Do not build every system to full depth before testing. Build thin, end-to-end slices first.

Example:
- a simple painted zone visible on the map and reflected in the UI is better than a perfect unfinished zone subsystem

### 3.2 Keep Simulation Authoritative
All gameplay rules should be applied in the simulation core. Phaser and React should only send commands and render state.

### 3.3 Prefer Simple First Implementations
Use the simplest version that proves the mechanic.

Examples:
- simple queue accumulators before detailed job objects
- simple path distance caches before aggressive optimization
- local saves before cloud saves

### 3.4 Instrument Early
Build debugging, logs, and overlay support early. Simulation-heavy games are difficult to tune without visibility.

---

## 4. Implementation Phases Overview

Recommended execution order:

- Phase 0: Project Setup and Foundations
- Phase 1: Simulation Core Skeleton
- Phase 2: Phaser Map Rendering and Camera
- Phase 3: Zone Painting and Map Validation
- Phase 4: Time Controls and Basic Tick Loop
- Phase 5: Inbound Freight Flow Slice
- Phase 6: Storage, Inventory, and Outbound Flow Slice
- Phase 7: Labor Pools and Queue Processing
- Phase 8: Core Scores and Economy
- Phase 9: Monthly Planning Flow
- Phase 10: UI/UX Expansion and Readability Pass
- Phase 11: Save/Load, Testing, and Stability Pass
- Phase 12: MVP Balancing and Playtest Preparation

---

## 5. Phase 0: Project Setup and Foundations

### Goal
Create the initial repository, install dependencies, and establish the architectural skeleton.

### Tasks
- initialize Vite React TypeScript project
- install Phaser
- install Zustand
- install Vitest and test dependencies
- add repository structure from the starter layout
- add ESLint/formatting if desired
- configure TypeScript strict mode
- add JSON config loading support
- create README with setup instructions

### Deliverables
- project runs locally
- React app renders
- Phaser bootstrap file exists
- repository structure is in place
- test runner executes at least one sample test

### Validation Checklist
- `npm run dev` starts successfully
- `npm run build` succeeds
- `npm run test` succeeds
- root page loads without runtime errors

### Risks
- too much time spent on tooling polish before gameplay begins

### Mitigation
- keep setup lean; only add tooling that accelerates iteration immediately

---

## 6. Phase 1: Simulation Core Skeleton

### Goal
Create the simulation runtime foundation and a minimal authoritative state container.

### Tasks
- implement `GameState` baseline shape
- implement `SimulationClock`
- implement `SimulationRunner`
- implement `CommandBus`
- implement `EventBus`
- implement `RandomService`
- create base enums and ids
- define initial command interfaces and event interfaces
- define selectors for reading key state

### Deliverables
- simulation runner exists and can tick
- commands can be dispatched through a shared interface
- events can be emitted from simulation systems
- baseline state can be read from React and Phaser

### Validation Checklist
- simulation tick increments correctly
- state can be retrieved from a single source of truth
- commands and events compile and pass sample tests

### Implementation Notes
At this stage, the state can be intentionally small:
- tick
- speed
- cash
- warehouse map
- placeholder KPI values

Do not wait to define every future field before moving on.

---

## 7. Phase 2: Phaser Map Rendering and Camera

### Goal
Render the warehouse map and establish navigation inside the main gameplay surface.

### Tasks
- implement Phaser boot and main scenes
- mount Phaser inside the React shell
- create a visible 64x64 map representation
- render dock edge tiles differently from interior tiles
- implement camera pan
- implement camera zoom
- implement tile hover feedback
- create helper functions for tile-to-screen and screen-to-tile mapping

### Deliverables
- visible warehouse map
- basic isometric or pseudo-isometric tile rendering
- smooth pan and zoom
- selected and hovered tile feedback

### Validation Checklist
- player can pan around the full map
- player can zoom in and out without rendering artifacts
- dock edge is clearly visible
- a tile can be identified under the pointer

### Implementation Notes
A simple color-block isometric render is sufficient initially. Do not wait on finalized art.

---

## 8. Phase 3: Zone Painting and Map Validation

### Goal
Enable player editing of warehouse layout through travel and storage zoning.

### Tasks
- implement active tool selection in UI store
- implement tile painting input in Phaser
- implement `PaintZoneCommand`
- implement erase/unassign behavior
- create zone overlay renderer
- create travel tile representation
- add immediate validation for storage tiles within 3 tiles of travel
- add invalid tile overlay/hatching
- implement basic `ZoneManager` to aggregate tile groups

### Deliverables
- travel tiles can be painted
- storage zones can be painted
- zones visually update on the map
- invalid zones are visibly marked
- right-side panel can inspect a selected tile/zone

### Validation Checklist
- click-drag painting works repeatedly and consistently
- repainting overwrites previous zone assignment correctly
- invalid zone feedback appears immediately after edits
- outer dock edge remains protected from unintended reassignment

### Dependencies
- tile hit testing from Phase 2
- command processing from Phase 1

### Implementation Notes
At first, zone aggregation may be rebuilt fully after each paint operation. Optimize later only if necessary.

---

## 9. Phase 4: Time Controls and Basic Tick Loop

### Goal
Introduce the running simulation clock and speed controls.

### Tasks
- implement speed state changes
- wire UI speed controls to `ChangeSpeedCommand`
- add pause/slow/medium/fast handling
- create a simulation loop tied to browser time
- map real time to in-game ticks
- surface current tick/date/time in HUD
- add start/stop lifecycle handling for the loop

### Deliverables
- running simulation
- speed buttons in the HUD
- visible time progression
- simulation pauses and resumes correctly

### Validation Checklist
- paused state fully stops simulation updates
- slow/medium/fast produce visibly different progression rates
- HUD updates time correctly
- no duplicate loops are created on rerender

### Implementation Notes
Keep date/time conversion logic centralized so monthly transitions are easier later.

---

## 10. Phase 5: Inbound Freight Flow Slice

### Goal
Create the first fully simulated freight workflow from yard arrival to dock unload.

### Tasks
- implement `Trailer` model
- implement inbound trailer spawning logic
- add trailer yard queue representation
- create active door model and initial door assignment logic
- render door states and trailer markers
- implement switch queue and switch movement state
- implement unload queue and unload state
- add basic yard dwell and door dwell timers
- create `FreightBatch` model for inbound contents

### Deliverables
- inbound trailers appear over time
- trailers can be assigned to doors
- trailers progress through yard -> door -> unload stages
- queue sizes and dwell times are tracked

### Validation Checklist
- trailers spawn without breaking the loop
- only available doors receive new inbound work
- dwell times increment as expected
- visible map state reflects trailer progression

### Dependencies
- active doors and zoneable map
- working tick loop

### Implementation Notes
Do not implement full storage logic yet. End the first slice at dock-unloaded freight if needed to validate the inbound chain.

---

## 11. Phase 6: Storage, Inventory, and Outbound Flow Slice

### Goal
Complete the freight lifecycle from dock to storage to outbound shipment.

### Tasks
- implement zone capacity in cubic feet
- implement storage compatibility by freight class
- add `StorageSystem`
- move unloaded freight from dock queue to valid storage zones
- track stored inventory by class and volume
- implement outbound order generation
- implement pick queue and load queue
- implement outbound trailers and shipment completion
- add throughput measurement

### Deliverables
- inbound freight can be stored
- stored freight can generate outbound demand
- outbound demand can be picked and loaded
- completed shipments update throughput KPIs

### Validation Checklist
- freight only stores in compatible valid zones
- zones respect capacity limits
- outbound orders fail gracefully if inventory is unavailable
- throughput changes as work completes

### Dependencies
- zone validation and capacity logic
- door and trailer logic from Phase 5

### Implementation Notes
Start with only 1–2 freight classes if needed, then expand after the loop works.

---

## 12. Phase 7: Labor Pools and Queue Processing

### Goal
Make labor allocation meaningful and create operational bottlenecks.

### Tasks
- implement `LaborPool` model
- implement `LaborManager`
- create labor roles: switch, unload, storage, pick, load, sanitation, management
- implement role-specific systems with simple processing formulas
- connect processing rates to queue depletion
- add queue growth and wait time metrics
- expose labor assignment controls in UI
- add congestion score baseline
- allow management and sanitation to modify other systems

### Deliverables
- each queue is processed by a relevant labor pool
- labor shortages create backlogs
- labor reassignment changes operational performance
- queue bottlenecks become visible to the player

### Validation Checklist
- zero headcount in a role causes expected stoppage
- increasing headcount improves processing rate
- queue wait times rise under overload
- at least one visible bottleneck scenario can be reproduced intentionally

### Dependencies
- queues defined in phases 5 and 6

### Implementation Notes
Use aggregated queue volumes rather than highly granular tasks in MVP.

---

## 13. Phase 8: Core Scores and Economy

### Goal
Introduce secondary management systems that affect performance and long-term outcomes.

### Tasks
- implement `FinanceSystem`
- implement `KPIService`
- implement `ConditionSystem`
- implement `MoraleSystem`
- implement `SafetySystem`
- implement `SatisfactionSystem`
- implement `ContractSystem` baseline
- wire throughput to revenue
- wire payroll and budgets to cost
- surface key scores in HUD and panels
- add alert generation for critical thresholds

### Deliverables
- money changes over time
- morale, condition, safety, and satisfaction update over time
- KPI metrics are visible and reactive
- critical operational failures trigger alerts

### Validation Checklist
- throughput affects revenue correctly
- labor costs affect cash correctly
- poor conditions reduce performance in a visible way
- low morale or safety can be observed affecting outcomes

### Dependencies
- throughput loop functioning end to end
- labor and queue systems working

### Implementation Notes
Early formulas can be intentionally simple as long as cause and effect are visible.

---

## 14. Phase 9: Monthly Planning Flow

### Goal
Implement the strategic month boundary and business-planning loop.

### Tasks
- implement month transition detection in clock/calendar logic
- implement `PlanningSystem`
- generate planning snapshot data
- create React monthly planning dialog shell
- add Forecast page
- add Workforce page
- add Warehouse Condition page
- add Satisfaction page
- add Budgeting page
- add Productivity/Labor page
- implement “confirm plan” flow
- auto-shift speed to slow at month start
- pause or gate simulation-changing actions while planning is active

### Deliverables
- beginning of each month triggers planning flow
- player can review business pages
- budget and labor changes are applied on confirmation
- simulation resumes after planning completion

### Validation Checklist
- planning opens exactly once per month boundary
- values shown in planning reflect recent simulation state
- confirmed changes affect the next month of play
- cancel/confirm behavior is consistent and safe

### Dependencies
- economy, labor, and KPI systems from earlier phases

### Implementation Notes
The first planning version can be text-heavy and data-first. Improve visuals after functionality is stable.

---

## 15. Phase 10: UI/UX Expansion and Readability Pass

### Goal
Make the game understandable during normal play without heavy developer interpretation.

### Tasks
- expand top HUD metrics
n- implement bottom KPI bar interactions
- implement right operations panel tabs
- implement left tool palette with zone descriptions
- implement alerts center
- add contextual tooltips
- add overlays: invalid zones, congestion, path distance, door utilization
- add click-to-focus from alerts/KPIs to map areas
- improve map readability and visual hierarchy

### Deliverables
- main screen supports most player decisions
- bottlenecks can be diagnosed visually
- alerts are actionable and specific
- key systems are understandable without opening debug tools

### Validation Checklist
- player can identify a broken area quickly
- UI does not obscure important map regions excessively
- overlays are useful but not required for basic comprehension
- warnings correspond to real simulation conditions

### Dependencies
- underlying systems must already exist

### Implementation Notes
This phase is critical. A good simulation with poor readability will test badly.

---

## 16. Phase 11: Save/Load, Testing, and Stability Pass

### Goal
Make the project resilient, testable, and suitable for repeated play sessions.

### Tasks
- implement save serialization
- implement load deserialization
- add versioned save schema
- create `ConfigRepository` loading and validation pass
- expand unit tests for formulas and systems
- add integration tests for freight lifecycle
- add tests for month transitions and planning application
- fix duplicated state ownership problems
- add internal debug panels and logs
- identify and remove memory leaks or loop duplication

### Deliverables
- browser save/load works
- simulation can resume from saved state
- core systems have baseline automated coverage
- major runtime crashes are eliminated

### Validation Checklist
- save during active play and reload into the same operational state
- repeated long sessions do not crash or degrade badly
- test suite catches at least one intentionally introduced regression

### Dependencies
- most gameplay systems implemented

### Implementation Notes
Do not postpone stability too long. Save/load often exposes architectural weaknesses.

---

## 17. Phase 12: MVP Balancing and Playtest Preparation

### Goal
Prepare the first structured playable build.

### Tasks
- tune initial labor rates
- tune zone capacities
- tune freight arrival ranges
- tune basic difficulty mode presets
- tune budget effect strengths
- tune morale/safety/condition/satisfaction thresholds
- polish alerts and recommendations
- assemble a basic tutorial hint flow
- create internal playtest checklist
- instrument key metrics for playtest review

### Deliverables
- MVP candidate build
- at least one approachable difficulty
- at least one challenging difficulty
- playtest questions and telemetry plan

### Validation Checklist
- multiple months can be played without catastrophic bugs
- the game is understandable to a fresh tester
- different layouts and labor choices produce meaningfully different outcomes
- throughput and money feel connected to player skill

### Implementation Notes
Balance for clarity first, realism second. The player must be able to learn the system before they can appreciate complexity.

---

## 18. Cross-Cutting Workstreams

These workstreams should run throughout implementation rather than only in a single phase.

### 18.1 Config and Data Workstream
- maintain freight class definitions
- maintain zone types and capacities
- maintain labor role rates
- maintain difficulty presets
- validate all config changes

### 18.2 Debugging and Telemetry Workstream
- add logs for state transitions
- add queue and path overlays
- add KPI trend inspection tools
- add event tracing for alerts and incidents

### 18.3 UI Feedback Workstream
- improve readability based on internal testing
- reduce clutter and duplicate information
- improve wording for invalid states and alerts

### 18.4 Testing Workstream
- add unit tests whenever new formulas become stable
- add integration tests whenever a full workflow completes
- protect month transitions, queue processing, and save/load paths aggressively

---

## 19. Suggested Team Breakdown

If multiple developers are involved, work can be divided broadly like this:

### Engineer A: Simulation Core
- simulation runner
- commands/events
- freight flow
- labor/queue systems
- economy/scores

### Engineer B: Map and Rendering
- Phaser scenes
- map rendering
- camera/input
- overlays
- map interaction

### Engineer C: UI and Planning
- React shell
- HUD
- panels
- monthly planning dialog
- alerts center
- UI state store

### Shared Ownership
- data schema
- save/load
- balancing config
- testing
- integration issues

If solo-developed, this breakdown can still be used as swim lanes for task organization.

---

## 20. Dependency Map

Below is the rough dependency order for major systems.

### Foundational Dependencies
- project setup -> simulation core skeleton -> map rendering -> input mapping

### Core Gameplay Dependencies
- map rendering + input -> zone painting -> validation -> doors -> freight flow

### Operational Dependencies
- freight flow -> storage/inventory -> outbound flow -> labor pools -> queues -> congestion

### Strategic Dependencies
- labor + economy + KPI systems -> monthly planning -> alerts and dashboards

### Stabilization Dependencies
- all major systems -> save/load -> tests -> balance pass -> playtest build

This order should be respected as much as possible to avoid building features on unstable foundations.

---

## 21. Risks and Mitigations

### Risk 1: Overengineering Too Early
**Problem:** spending too long on abstractions before proving the game loop

**Mitigation:** build thin vertical slices and only harden abstractions after the first end-to-end flows work

### Risk 2: UI and Simulation Drift Apart
**Problem:** React and Phaser each begin owning separate versions of truth

**Mitigation:** enforce the simulation core as the only authoritative state source

### Risk 3: Pathfinding and Validation Become Expensive
**Problem:** map edits or fast simulation cause performance issues

**Mitigation:** use coarse caching and recompute only on relevant map changes

### Risk 4: Systems Become Hard to Balance
**Problem:** too many interacting modifiers with no visibility

**Mitigation:** keep formulas centralized, add telemetry, and expose modifier breakdowns in debug tools

### Risk 5: Monthly Planning Feels Detached
**Problem:** planning screen becomes a spreadsheet disconnected from moment-to-moment play

**Mitigation:** ensure every budget/labor decision has a visible operational consequence next month

### Risk 6: Readability Fails at Fast Speed
**Problem:** player cannot tell what is going wrong under load

**Mitigation:** prioritize alerts, overlays, bottleneck panels, and pause/slow-speed diagnosis tools

---

## 22. Suggested Milestone Review Questions

At the end of each phase, ask:
- what new player-visible behavior exists now?
- what assumptions were disproved?
- what parts of the architecture became awkward?
- what needs simplification before the next phase?
- what must be tested immediately before proceeding?

This prevents silent accumulation of technical debt and design drift.

---

## 23. Recommended Immediate Next Actions

To begin implementation immediately, the first concrete actions should be:

1. create the actual Vite repository
2. paste in the starter repository layout stubs
3. confirm React and Phaser mount together successfully
4. implement a visible 64x64 map with dock edge tiles
5. wire a minimal simulation runner to the HUD
6. implement tile hover and click-drag zone painting
7. implement `PaintZoneCommand` and tile state updates

These steps establish the first meaningful vertical slice and create momentum quickly.

---

## 24. Summary

This implementation plan is designed to move the project from architecture and design into a practical build sequence.

The plan emphasizes:
- authoritative simulation state
- thin vertical slices
- fast proof of core mechanics
- strong debugging support
- gradual expansion toward a stable MVP

If followed in order, it should produce a playable warehouse simulation prototype with enough technical structure to grow into a full production web game.
