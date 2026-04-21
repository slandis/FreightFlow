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
9. add contract offer planning and live portfolio management

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
- Phase 13: Contract Offers and Portfolio Management

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
- add command-time capital costs for travel, storage, and erase actions
- define per-tile storage cost factors so specialized storage is more expensive than standard storage
- create zone overlay renderer
- create travel tile representation
- add immediate validation for storage tiles within 3 tiles of travel
- add invalid tile overlay/hatching
- implement basic `ZoneManager` to aggregate tile groups

### Deliverables
- travel tiles can be painted
- storage zones can be painted
- travel, storage, and erase actions immediately deduct cash when the player can afford them
- zones visually update on the map
- invalid zones are visibly marked
- right-side panel can inspect a selected tile/zone

### Validation Checklist
- click-drag painting works repeatedly and consistently
- repainting overwrites previous zone assignment correctly
- invalid zone feedback appears immediately after edits
- outer dock edge remains protected from unintended reassignment
- no-op or protected edits do not charge cash
- insufficient cash blocks the zone edit without mutating the map

### Dependencies
- tile hit testing from Phase 2
- command processing from Phase 1

### Implementation Notes
At first, zone aggregation may be rebuilt fully after each paint operation. Optimize later only if necessary.
Build/edit costs should be calculated in the simulation layer against only the tiles that actually change, so drag-painting never partially applies because of per-tile UI logic.

---

## 9. Phase 4: Time Controls and Basic Tick Loop

### Goal
Introduce the running simulation clock and speed controls.

### Tasks
- implement speed state changes
- wire UI speed controls to `ChangeSpeedCommand`
- add pause/slow/medium/fast handling
- add hyper speed for rapid month-cycle testing
- create a simulation loop tied to browser time
- map real time to in-game ticks
- surface current tick/date/time in HUD
- add start/stop lifecycle handling for the loop

### Deliverables
- running simulation
- speed buttons in the HUD
- hyper speed can cycle a full 30-day month in roughly 5-10 seconds
- visible time progression
- simulation pauses and resumes correctly

### Validation Checklist
- paused state fully stops simulation updates
- slow/medium/fast produce visibly different progression rates
- hyper speed advances a month fast enough for planning-loop testing
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
- add player-facing door placement/removal commands for dock-edge tiles
- charge cash immediately when players place doors while keeping removal free and non-refundable
- support flex, inbound, outbound, and remove-door tools from the left tool panel
- validate door edits through simulation commands, including dock-edge-only placement, duplicate prevention, and idle-only removal
- render door states and trailer markers
- implement switch queue and switch movement state
- implement unload queue and unload state
- add basic yard dwell and door dwell timers
- create `FreightBatch` model for inbound contents

### Deliverables
- inbound trailers appear over time
- trailers can be assigned to doors
- players can add or remove idle dock-edge doors
- door placement spends cash immediately and fails loudly when the player cannot afford it
- newly placed doors mark their tiles active, render immediately, and participate in inbound/outbound assignment
- trailers progress through yard -> door -> unload stages
- queue sizes and dwell times are tracked

### Validation Checklist
- trailers spawn without breaking the loop
- only available doors receive new inbound work
- placed doors are available to freight assignment immediately
- busy doors cannot be removed while reserved, occupied, loading, or unloading
- door removal remains free and provides no refund
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
- add dock storage-needs diagnostics for freight waiting on the dock
- report compatible storage types, usable capacity, largest available compatible opening, and blocked reason

### Deliverables
- inbound freight can be stored
- stored freight can generate outbound demand
- outbound demand can be picked and loaded
- completed shipments update throughput KPIs
- operations panel identifies which storage zone types are needed for blocked dock freight
- diagnostics distinguish missing storage, invalid storage, insufficient capacity, and whole-batch fit problems

### Validation Checklist
- freight only stores in compatible valid zones
- zones respect capacity limits
- outbound orders fail gracefully if inventory is unavailable
- throughput changes as work completes
- dock storage-needs diagnostics match the same compatibility, validity, capacity, and whole-batch rules used by storage processing

### Dependencies
- zone validation and capacity logic
- door and trailer logic from Phase 5

### Implementation Notes
Start with only 1–2 freight classes if needed, then expand after the loop works.
Dock storage diagnostics should remain selector-driven and read-only. They should explain why freight is stranded without letting React own any storage rules.

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
- add a separate capital-cost bucket for one-time build/edit spending
- surface key scores in HUD and panels
- add alert generation for critical thresholds

### Deliverables
- money changes over time
- morale, condition, safety, and satisfaction update over time
- KPI metrics are visible and reactive
- critical operational failures trigger alerts
- one-time build/edit spending is tracked separately from recurring operating cost

### Validation Checklist
- throughput affects revenue correctly
- labor costs affect cash correctly
- poor conditions reduce performance in a visible way
- low morale or safety can be observed affecting outcomes
- baseline labor, budget, and fixed operating costs stay within a believable range relative to baseline contract revenue
- economy constants are shared across finance, planning analysis, and contract analysis to avoid scale drift
- capital spending persists through save/load without being folded into recurring operating cost

### Dependencies
- throughput loop functioning end to end
- labor and queue systems working

### Implementation Notes
Early formulas can be intentionally simple as long as cause and effect are visible.
Keep recurring labor, budget, and fixed operating cost constants on the same unit scale as baseline freight revenue so the default operation is strained but viable.
Capital spending for map edits should hit cash immediately through authoritative commands and be recorded separately from recurring monthly operating expenses.

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
- open the first monthly planning dialog when a new live game starts
- add a manual `Plan` entry point in the right HUD Business section
- auto-shift speed to slow at month start
- pause or gate simulation-changing actions while planning is active
- support planning-time total headcount changes in addition to role assignment
- apply confirmed planning changes on the next tick after planning closes

### Deliverables
- beginning of each month triggers planning flow
- new live games begin with the planning dialog visible
- player can reopen planning during the month without forcing a month rollover
- player can review business pages
- budget, labor-assignment, and total-headcount changes are queued when planning closes and become authoritative on the next tick
- simulation resumes after planning completion

### Validation Checklist
- planning opens exactly once per month boundary
- first-run planning opens without requiring the player to wait through an entire month
- values shown in planning reflect recent simulation state
- confirmed changes affect the next month of play
- manually opened planning preserves the current month economy snapshot
- planned total headcount cannot be set below planned assigned labor
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
- implement bottom KPI bar interactions
- implement right operations panel tabs
- make right operations panel sections collapsible so growing diagnostics stay readable
- implement left tool palette with zone descriptions
- implement alerts center
- add contextual tooltips
- add overlays: invalid zones, congestion, path distance, door utilization
- add click-to-focus from alerts/KPIs to map areas
- improve map readability and visual hierarchy
- add selector-driven operational issues so alerts and panels share the same simulation-authored diagnosis
- add UI-only overlay and focus state for React-to-Phaser map diagnosis
- add per-zone storage-capacity summaries in the operations panel so storage utilization is visible without map-art overlays

### Deliverables
- main screen supports most player decisions
- bottlenecks can be diagnosed visually
- alerts are actionable and specific
- key systems are understandable without opening debug tools
- dense operational diagnostics can be expanded only when needed
- map overlays can be switched between storage, zone, travel, capacity, door, and queue views
- alerts and urgent panel issues can focus relevant map tiles when a location exists
- storage zones can be scanned from the HUD by utilization, capacity, validity, and zone id

### Validation Checklist
- player can identify a broken area quickly
- UI does not obscure important map regions excessively
- long panels remain usable without constant scrolling
- overlays are useful but not required for basic comprehension
- warnings correspond to real simulation conditions
- diagnostic selectors have focused unit coverage
- production build and local browser smoke check pass
- storage-zone summaries match authoritative zone usage and validity state

### Dependencies
- underlying systems must already exist

### Implementation Notes
This phase is critical. A good simulation with poor readability will test badly.
Diagnostic rendering should remain mode-aware and disposable: Phaser redraws from the latest simulation snapshot and UI overlay mode, while React only requests overlays or map focus.
When map-art experiments are too noisy or visually ambiguous, prefer selector-driven HUD diagnostics such as compact progress bars over adding decorative rendering complexity.

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

## 18. Phase 13: Contract Offers and Portfolio Management

### Goal
Turn contracts into explicit monthly business decisions with live portfolio tracking during play.

### Tasks
- generate 3-4 bounded contract offers when monthly planning opens
- add a `Contracts` page to monthly planning
- allow accept/reject decisions through authoritative planning commands
- present each offer with length, freight class, expected throughput, revenue rate, service target, and dwell/well-time penalty terms
- include lightweight labor, budget, storage, and operational-strain analysis for each offer
- expand contract state so accepted offers become individually tracked active contracts
- tag inbound freight, outbound orders, and useful trailer surfaces with `contractId`
- attribute contract-aware throughput, service level, revenue, inventory, and dwell penalties
- add a right-panel contract portfolio section with 3 cards per page and carousel pagination
- expose per-contract KPI score, current inventory cube, rolling weekly/monthly throughput, and estimated labor/headcount per day
- preserve offers, decisions, active contracts, and contract-tagged freight through save/load

### Deliverables
- monthly planning shows plausible contract offers tied to current warehouse conditions
- accepted offers become active contracts on monthly plan confirmation
- contract-tagged freight can be tracked through storage and shipment completion
- active contracts update health, service level, penalties, and performance over time
- the right operations panel exposes a readable live contract portfolio browser

### Validation Checklist
- planning opens with 3-4 offers and no impossible freight-class or throughput combinations
- accept/reject decisions persist correctly until confirmation
- accepted offers become active contracts and rejected offers do not
- contract-tagged freight retains attribution through unload, storage, pick, load, and shipment
- per-contract service level, KPI score, inventory, and penalty values update as play continues
- the portfolio view pages active contracts in groups of 3 without losing live updates
- save/load preserves pending offers, active contracts, completed contracts, and contract-attributed freight

### Dependencies
- monthly planning flow from Phase 9
- contract/economy baseline from Phase 8
- save/load support from Phase 11

### Implementation Notes
Keep offers plausible rather than generous: they should create explainable operational challenges instead of absurd requirements.
For the first pass, estimated labor and cost attribution is acceptable if it stays consistent and decision-useful.

---

## 19. Cross-Cutting Workstreams

These workstreams should run throughout implementation rather than only in a single phase.

### 19.1 Config and Data Workstream
- maintain freight class definitions
- maintain zone types and capacities
- maintain labor role rates
- maintain difficulty presets
- maintain contract offer/client generation bands
- validate all config changes

### 19.2 Debugging and Telemetry Workstream
- add logs for state transitions
- add queue and path overlays
- add KPI trend inspection tools
- add event tracing for alerts and incidents

### 19.3 UI Feedback Workstream
- improve readability based on internal testing
- reduce clutter and duplicate information
- improve wording for invalid states and alerts

### 19.4 Testing Workstream
- add unit tests whenever new formulas become stable
- add integration tests whenever a full workflow completes
- protect month transitions, queue processing, contract acceptance, and save/load paths aggressively

---

## 20. Suggested Team Breakdown

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

## 21. Dependency Map

Below is the rough dependency order for major systems.

### Foundational Dependencies
- project setup -> simulation core skeleton -> map rendering -> input mapping

### Core Gameplay Dependencies
- map rendering + input -> zone painting -> validation -> doors -> freight flow

### Operational Dependencies
- freight flow -> storage/inventory -> outbound flow -> labor pools -> queues -> congestion

### Strategic Dependencies
- labor + economy + KPI systems -> monthly planning -> contract offers/portfolio -> alerts and dashboards

### Stabilization Dependencies
- all major systems -> save/load -> tests -> balance pass -> playtest build

This order should be respected as much as possible to avoid building features on unstable foundations.

---

## 22. Risks and Mitigations

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

### Risk 7: Contract Offers Feel Arbitrary
**Problem:** monthly offers look random in a bad way and undermine business decision-making

**Mitigation:** generate offers from bounded throughput/rate bands and include concise operational analysis explaining the challenge

### Risk 8: Contract Attribution Adds Hidden Complexity
**Problem:** contract-aware freight, revenue, and labor reporting become difficult to reason about or maintain

**Mitigation:** tag freight/orders early, keep first-pass labor attribution estimated, and prefer selector/reporting aggregation over tick-heavy bookkeeping

---

## 23. Suggested Milestone Review Questions

At the end of each phase, ask:
- what new player-visible behavior exists now?
- what assumptions were disproved?
- what parts of the architecture became awkward?
- what needs simplification before the next phase?
- what must be tested immediately before proceeding?

This prevents silent accumulation of technical debt and design drift.

---

## 24. Recommended Immediate Next Actions

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

## 25. Summary

This implementation plan is designed to move the project from architecture and design into a practical build sequence.

The plan emphasizes:
- authoritative simulation state
- thin vertical slices
- fast proof of core mechanics
- strong debugging support
- gradual expansion toward a stable MVP

If followed in order, it should produce a playable warehouse simulation prototype with enough technical structure to grow into a full production web game.
