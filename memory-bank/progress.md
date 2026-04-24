### Progress report (phases laid out in implementation-plan.md)

Phase 0: Completed
    - `npm install` completed successfully
    - `npm run test` completed successfully
    - `npm run dev` completed successfully
        - React app booted with no errors or exceptions

Phase 1: Implemented
    - Implemented baseline authoritative `GameState` with clock, calendar, speed, cash, KPI placeholders, debug metadata, and warehouse map.
    - Implemented `SimulationClock`, `SimulationRunner`, `CommandBus`, `EventBus`, and deterministic `RandomService`.
    - Added typed command context/results, `ChangeSpeedCommand`, base event interfaces, enums, ids, and key selectors.
    - Added tests for ticking, command dispatch, event emission, state subscriptions, selectors, and deterministic random behavior.
    - Verification is pending in Codex shell because `node` / `npm` are not on PATH there; run `npm run test` from the IDE terminal to confirm.

Phase 2: Completed
    - Mounted Phaser with the shared `SimulationRunner` from the React shell so the map reads from the authoritative simulation state.
    - Replaced the placeholder main scene with a visible 64x64 pseudo-isometric warehouse map.
    - Rendered dock edge tiles distinctly from interior unassigned tiles, using centralized map/tile size constants.
    - Added pure isometric coordinate helpers for tile-to-screen and screen-to-tile mapping.
    - Implemented camera navigation: right/middle mouse drag panning, pointer-centered wheel zoom, camera bounds, and an initial centered view.
    - Implemented tile hover feedback and click selection through `MapInputController`.
    - Added React UI state for hovered and selected tile summaries.
    - Updated the right operations panel to show hovered tile coordinates and selected tile details.
    - Added Vitest coverage for the isometric coordinate helpers.
    - Verification completed: `npm run test` passed with 12 tests, and `npm run build` passed. The build emits a large bundle warning because Phaser is bundled directly, which is expected for now.
    - Local dev server was started and verified at `http://127.0.0.1:5173`.

Phase 3: Completed
    - Implemented authoritative zone painting through `PaintZoneCommand` for travel, all modeled storage zones, and erase/unassign behavior.
    - Protected dock-edge tiles from repainting while allowing interior tiles to be reassigned repeatedly.
    - Extended tile state with zone id, storage validity, invalid reason, and nearest travel distance.
    - Implemented full zone rebuilding after paint actions, including contiguous same-type zone aggregation and capacity from `zoneTypes.json`.
    - Added immediate storage validation using Manhattan distance: storage within 3 tiles of travel is valid; storage with no travel access or farther access is marked invalid.
    - Emitted `zone-invalidated` events for invalid storage zones after paint updates.
    - Wired Phaser left-click/drag painting to simulation commands, including interpolated drag painting so fast pointer movement fills skipped tiles.
    - Preserved select-to-inspect behavior, right/middle drag camera panning, and pointer-centered wheel zoom.
    - Implemented invalid storage hatching/outline through `ZoneOverlayRenderer` and refreshed map/overlay layers from simulation state changes.
    - Expanded the left tool panel to include all Phase 3 tools with readable labels and descriptions.
    - Expanded the right operations panel to show selected/hovered tile zone id, validity, invalid reason, nearest travel distance, and dock protection status.
    - Added Vitest coverage for painting, erasing, dock protection, repainting, storage validation, zone aggregation, and invalidation event metadata.
    - Verification completed: `npm run test` passed with 21 tests, and `npm run build` passed. The build still emits the expected Phaser bundle-size warning.
    - Local dev server was started and verified at `http://127.0.0.1:5173`.

Phase 4: Completed
    - Added reactive simulation subscriptions for React through `SimulationRunner` revision tracking and `useSimulationState`.
    - Added a browser-owned `requestAnimationFrame` simulation loop that runs from `SimulationProvider` and keeps the simulation core manually tickable for tests.
    - Implemented speed-to-tick-rate handling for paused, slow, medium, and fast simulation speeds.
    - Added catch-up protection so returning from a paused browser tab cannot run an unbounded number of ticks in one frame.
    - Wired top HUD speed buttons to `ChangeSpeedCommand` for pause, slow, medium, and fast.
    - Updated the HUD to show formatted calendar time, cash, current tick, and active speed state.
    - Added tests for speed tick rates, elapsed-time tick calculation, paused behavior, catch-up capping, runner revision updates, change subscriptions, and HUD time formatting.
    - Verification completed: `npm run test` passed with 30 tests, and `npm run build` passed. The build still emits the expected Phaser bundle-size warning.
    - Local dev server was started and verified at `http://127.0.0.1:5173`.

Phase 5: Completed
    - Added the first inbound freight flow slice: trailers spawn over time, enter the yard, reserve dock doors, switch to doors, unload, and leave freight on the dock.
    - Added `freightFlow` state with trailers, freight batches, dock doors, queue summaries, dwell metrics, and inbound counters.
    - Created 8 initial flex dock doors on the north dock edge and marked their map tiles as active doors.
    - Implemented deterministic inbound trailer generation every 120 ticks using configured freight classes and cubic-foot ranges.
    - Implemented oldest-yard-trailer door assignment, fixed 8-tick switch movement, and prototype unload processing at 120 cubic feet per tick.
    - Added queue and metric recalculation for yard, switching, unloading, dock freight, average yard dwell, and average door dwell.
    - Updated inbound and throughput KPIs when freight unloads to the dock.
    - Added freight-flow events for trailer arrival, door assignment, trailer arrival at door, and freight unload completion.
    - Implemented Phaser door/trailer markers for idle, reserved, occupied, and unloading dock-door states.
    - Updated the bottom KPI bar and right operations panel with live inbound queue, door, dock freight, dwell, and trailer totals.
    - Added Vitest coverage for door initialization, spawn timing, freight batch generation, door assignment, switch duration, unloading, queue/KPI updates, deterministic generation, and freight-flow events.
    - Verification completed: `npm run test` passed with 40 tests, and `npm run build` passed. The build still emits the expected Phaser bundle-size warning.
    - Local dev server was verified at `http://127.0.0.1:5173`.

Phase 6: Completed
    - Saved the implementation plan to `memory-bank/phase-6-plan.md`.
    - Extended freight batches, outbound orders, trailers, and freight-flow state to support storage, inventory, picking, loading, and shipment completion.
    - Implemented dock-to-storage movement for whole freight batches using valid compatible storage zones, zone capacity, and freight-class compatibility from config.
    - Added stored inventory tracking by freight class and zone used-capacity recalculation.
    - Implemented outbound order generation from stored inventory, including deterministic seeded order selection and requested cubic-foot sizing.
    - Implemented pick processing for outbound orders, including whole-batch reservation and graceful blocked-order handling when inventory is unavailable.
    - Implemented outbound trailer loading through available flex/outbound doors and shipment completion.
    - Updated outbound and throughput KPIs after completed shipments.
    - Added storage/outbound selectors and expanded the bottom KPI bar and right operations panel with stored freight, capacity, dock blockage, order counts, pick/load queues, loading doors, and shipped freight.
    - Added freight-flow events for freight storage, outbound order creation, blocked orders, picked orders, outbound trailer loading, and shipment completion.
    - Added Vitest coverage for storage compatibility/capacity, inventory tracking, outbound generation, blocked orders, picking, loading, KPI updates, and the full dock-to-shipment lifecycle.
    - Verification completed: `npm run test` passed with 49 tests, and `npm run build` passed. The build still emits the expected Phaser bundle-size warning.

Phase 6 Polish: Completed
    - Added a dock storage-needs diagnostic selector that groups on-dock freight by freight class and reports compatible storage zone types, valid compatible capacity, largest available compatible opening, missing cubic feet, readiness, and the blocking reason.
    - Accounted for whole-batch storage constraints so the diagnostic can flag freight when total capacity exists but no single compatible zone can fit the largest dock batch.
    - Added the dock storage-needs readout to the right operations panel, including readable zone names and immediate “Dock is clear” feedback when no freight is waiting.
    - Added focused Vitest coverage for missing compatible storage, invalid compatible storage, whole-batch capacity mismatch, and ready compatible storage.
    - Updated `memory-bank/implementation-plan.md` so Phase 6 now includes dock storage-needs diagnostics in tasks, deliverables, validation, and implementation notes.
    - Verification completed: `npm run test` passed with 53 tests, and `npm run build` passed. The build still emits the expected Phaser bundle-size warning.

Phase 7: Completed
    - Saved the finalized Phase 7 plan to `memory-bank/phase-7-plan.md`.
    - Added authoritative `labor` state with 18 default headcount across switch-driver, unload, storage, pick, load, sanitation, and management roles.
    - Expanded labor pools with effective rates, utilization, pressure labels, modifiers, support-role penalties, and bottleneck summaries.
    - Implemented `AssignLaborCommand` with real-time role assignment, loud failures for invalid or over-total assignments, debug metadata, and `labor-assigned` events.
    - Refactored switch, unload, storage, pick, and load systems to consume labor capacity instead of fixed processing assumptions.
    - Added storage putaway progress so storage labor can become an actual dock bottleneck while preserving compatibility, validity, capacity, and whole-batch rules.
    - Added sanitation and management support modifiers that create visible condition, congestion, and coordination pressure when understaffed.
    - Added labor selectors for summaries, role details, critical warnings, queue pressure, and top bottleneck.
    - Added a real-time labor dialog with per-role assignment controls and failure feedback.
    - Updated the right operations panel and bottom KPI bar with labor totals, role pressure, critical warnings, and top bottleneck visibility.
    - Added Vitest coverage for default staffing, live assignment, assignment failures, labor events, switch-driver stoppage, unload scaling, storage bottlenecks, pick/load stoppage, and support-role penalties.
    - Updated existing freight-flow tests for labor-scaled unload and storage putaway timing.
    - Verification completed: `npm run test` passed with 62 tests, and `npm run build` passed. The build still emits the expected Phaser bundle-size warning.
    - Local dev server was verified at `http://127.0.0.1:5173`.

Phase 8: Completed
    - Saved the finalized Phase 8 plan to `memory-bank/phase-8-plan.md`.
    - Added economy, score, contract, and alert state branches to authoritative `GameState`.
    - Expanded KPIs with revenue, labor cost, operating cost, net operating result, morale, condition, safety, client satisfaction, and customer satisfaction.
    - Implemented `FinanceSystem` with one-time outbound shipment revenue recognition, freight-class revenue rates, satisfaction multipliers, recurring labor costs, operating costs, cash updates, and monthly/lifetime totals.
    - Added revenue recognition fields to outbound orders so completed shipments cannot be paid twice.
    - Implemented `KPIService` as the centralized source for freight, economy, and score KPI updates.
    - Implemented `ConditionSystem`, `MoraleSystem`, `SafetySystem`, and `SatisfactionSystem` with simple driver-based score movement from labor pressure, sanitation, management, queue pressure, condition, safety, blocked orders, and service level.
    - Implemented a baseline `ContractSystem` with one default general freight contract, service-level tracking, missed demand, fulfilled demand, and contract health.
    - Implemented `AlertSystem` with stable alert keys, severity, active/resolved state, low-cash and low-score warnings, contract service alerts, and de-duplicated alert events.
    - Added economy, score, contract, alert, and finance breakdown selectors.
    - Updated the top HUD, bottom KPI bar, right operations panel, and alerts center to expose Phase 8 business health, scores, service level, and active alerts.
    - Added Vitest coverage for one-time revenue recognition, freight-class revenue rates, recurring costs, KPI updates, condition pressure, morale/safety pressure, satisfaction pressure, baseline contract service level, and alert de-duplication.
    - Verification completed: `npm run test` passed with 70 tests, and `npm run build` passed. The build still emits the expected Phaser bundle-size warning.

Phase 8 UI Polish: Completed
    - Converted the right operations panel into collapsible sections for Flow, Business, Scores, Labor, Dock Storage Needs, and Selected/Hover Tile details.
    - Kept Flow and Selected/Hover Tile open by default while starting heavier diagnostic sections collapsed for readability.
    - Added accordion styling for compact scanning without moving simulation state into UI presentation controls.
    - Updated `memory-bank/implementation-plan.md` so the Phase 10 readability pass explicitly includes collapsible right-panel diagnostics.
    - Verification completed: `npm run build` passed and the local dev server responded at `http://127.0.0.1:5173`. The build still emits the expected Phaser bundle-size warning.

Door Placement Polish: Completed
    - Added authoritative `PlaceDoorCommand` and `RemoveDoorCommand` for dock-edge door editing.
    - Door placement validates mode, bounds, dock-edge-only placement, and duplicate doors.
    - Door removal is limited to idle doors so active/reserved/loading/unloading doors cannot be removed while work is in progress.
    - Added flex, inbound, outbound, and remove-door tools to the left tool panel and wired Phaser clicks to simulation commands.
    - Updated selected/hover tile details to show door id, mode, and state.
    - Placed doors mark their dock-edge tiles active, render through the existing door renderer, and are immediately available to trailer assignment.
    - Added Vitest coverage for placement, invalid placement, removal, busy-door protection, and trailer assignment to a newly placed door.
    - Updated `memory-bank/implementation-plan.md` so the Phase 5 door workflow includes player-facing door placement/removal.
    - Expanded the Phase 5 plan notes with the supported door tools, dock-edge validation rules, idle-only removal behavior, and assignment expectations.
    - Verification completed: `npm run test` passed with 75 tests, and `npm run build` passed. The build still emits the expected Phaser bundle-size warning.

Phase 9: Completed
    - Saved the finalized Phase 9 plan to `memory-bank/phase-9-plan.md`.
    - Added authoritative monthly planning state to `GameState`, including active/pending/current plan data, budget allocations, labor assignment plans, month keys, and planning snapshots.
    - Implemented `PlanningSystem` month-boundary detection so a new month opens planning once, shifts speed to slow, records the opened month, creates a snapshot, and resets current-month economy counters for the next period.
    - Replaced the stub budget and confirmation commands with real `ApplyBudgetPlanCommand` and `ConfirmMonthlyPlanCommand` behavior, including validation, event emission, pending-plan updates, labor assignment commits, and plan finalization.
    - Added `AssignPlannedLaborCommand` for planning-time labor assignment changes with total-headcount validation.
    - Added planning budget effects: maintenance supports condition, safety supports safety, training can improve productive labor after the default baseline, operations support reduces support pressure, and budget allocations increase operating cost.
    - Locked simulation speed, zone painting, door editing, and live labor assignment commands while monthly planning is active.
    - Replaced the monthly planning dialog stub with a multi-page React modal for Forecast, Workforce, Warehouse Condition, Satisfaction, Budgeting, and Productivity/Labor.
    - Added planning selectors, planning UI store state, top-HUD planning status, speed-control locking, and planning dialog styling.
    - Added monthly planning events for planning opened, budget updated, planned labor updated, and plan confirmed.
    - Updated inbound freight tests to match the current 60-tick freight generator interval and 2,500 cubic-foot maximum.
    - Added Vitest coverage for month rollover, one-time planning opening, slow-speed shift, budget validation, pending budget updates, planned labor validation, confirmation commits, budget effects, and planning-time command gating.
    - Verification completed: `npm run test` passed with 82 tests, and `npm run build` passed. The build still emits the expected Phaser bundle-size warning.
    - Local dev server was verified at `http://127.0.0.1:5173`.

Hyper Speed Polish: Completed
    - Added a new `Hyper` game speed for fast month-cycle testing.
    - Hyper runs at 7,200 ticks per second, targeting one 30-day month, or 43,200 simulation ticks, in 6 seconds under normal frame pacing.
    - Raised the per-frame catch-up cap to 120 ticks so Hyper can reach its target without changing slow, medium, or fast speed rates.
    - Added Hyper to the top-HUD speed controls.
    - Updated the simulation loop to stop remaining same-frame ticks when monthly planning opens, preventing Hyper from overshooting the month boundary after planning activates.
    - Added timing coverage for Hyper speed and the 5-10 second month target.
    - Verification completed: `npm run test` passed with 83 tests, and `npm run build` passed. The build still emits the expected Phaser bundle-size warning.

Monthly Planning Startup Fix: Completed
    - Fixed live game startup so the first monthly planning dialog opens immediately instead of waiting for the first month rollover.
    - Added an `openInitialPlanning` option to `SimulationRunner` and enabled it from the React `SimulationProvider`, keeping non-UI simulation tests free to start without planning command locks.
    - Added regression coverage for the initial planning dialog state.
    - Tuned Hyper timing to use a higher cap only for Hyper speed while preserving the normal catch-up cap for paused, slow, medium, and fast speeds.
    - Verification completed: `npm run test` passed with 84 tests, and `npm run build` passed. The build still emits the expected Phaser bundle-size warning.

Phase 10: Completed
    - Saved the finalized Phase 10 plan to `memory-bank/phase-10-plan.md`.
    - Added UI overlay and map-focus state so React diagnostics can request Phaser camera focus without owning simulation rules.
    - Added selector-driven operational diagnostics for invalid storage, blocked dock storage needs, labor bottlenecks, door readiness, outbound blockage, negative net, door utilization, queue pressure, and focusable issue targets.
    - Expanded `ZoneOverlayRenderer` into a mode-aware diagnostic renderer for invalid storage, zone types, travel network, storage capacity, door utilization, queue pressure, and hidden overlays.
    - Wired Phaser to rerender overlays on simulation/UI state changes and pan/zoom the camera to focus requests from alerts and operations panels.
    - Added overlay controls to the left tool panel while keeping zone and door tools grouped with readable tooltips.
    - Reworked the alerts center into actionable operational issues with severity counts, recommendations, and focus buttons when a map target exists.
    - Converted the bottom KPI strip into compact interactive pills with tooltips and overlay shortcuts for queue, storage, and dock diagnostics.
    - Expanded top-HUD context with metric tooltips, active overlay status, and most-severe issue guidance.
    - Added a right-panel urgent issue summary and focus controls for blocked dock storage needs while preserving collapsible diagnostic sections.
    - Added reusable `MetricTooltip` behavior and Phase 10 UI styling for tooltips, issue summaries, KPI pills, overlay controls, and action buttons.
    - Added Vitest coverage for diagnostic selector issues, severity ordering, door utilization, and queue pressure.
    - Verification completed: `npm run test` passed with 87 tests, and `npm run build` passed. The build still emits the expected Phaser bundle-size warning.
    - Local dev server was verified at `http://127.0.0.1:5173` with HTTP 200.

Phase 11: Completed
    - Saved the finalized Phase 11 plan to `memory-bank/phase-11-plan.md`.
    - Added a versioned save schema with slot metadata, serialized warehouse map data, and a JSON-compatible authoritative game-state payload.
    - Implemented `GameStateSerializer` to serialize runtime state and reconstruct loaded games with a real `WarehouseMap`, rebuilt zones, restored zone usage, and paused resume behavior.
    - Replaced the save/load stub with an injectable `SaveLoadService` that can save, load, list, delete, validate, and report explicit errors for missing, malformed, or unsupported save payloads.
    - Upgraded `LocalSaveRepository` with an injected storage adapter, slot listing, delete support, malformed metadata handling, and three MVP save slots.
    - Added `SimulationRunner.replaceState` and `SimulationClock.restore` so loaded state can replace the authoritative simulation while notifying React and Phaser subscribers immediately.
    - Added a compact Save/Load dialog with slot metadata, Save, Load, and Delete actions, plus a top-HUD entry point.
    - Expanded UI store state and styling for save/load dialog visibility and player-facing save/load result messages.
    - Upgraded `ConfigRepository` with validation for config arrays, duplicate ids, freight-zone compatibility references, required labor roles, and core non-negative numeric balancing fields.
    - Added persistence and config Vitest coverage for save payloads, reconstructed loads, invalid loads, slot listing/deletion, subscriber notification, monthly-planning saves, active freight lifecycle saves, and checked-in config validity.
    - Verification completed: `npm run test` passed with 97 tests, and `npm run build` passed. The build still emits the expected Phaser bundle-size warning.
    - Local dev server was verified at `http://127.0.0.1:5173` with HTTP 200.

Phase 12: Implemented
    - Wired real difficulty presets into simulation startup instead of leaving `difficultyModes.json` as validation-only data.
    - Added two Phase 12 presets: `Relaxed` for onboarding and recovery, and `Standard` for tighter cash and pressure.
    - Applied difficulty effects to starting cash, inbound cadence/volume, outbound cadence/volume, score decay severity, contract service pressure, save metadata, and live HUD/planning displays.
    - Added a top-HUD new-run flow so playtesters can restart directly into a chosen difficulty without leaving the main game shell.
    - Tuned freight revenue, storage capacities, and labor role base rates so config changes now create clearer throughput and bottleneck differences.
    - Updated productive labor throughput to respect configured role base rates instead of treating most labor config as cosmetic.
    - Added a lightweight tutorial coach card with one-time-per-run hints for first planning, invalid storage, blocked dock freight, missing doors, critical labor bottlenecks, and negative monthly net.
    - Kept tutorial state out of authoritative saves so onboarding remains a lightweight playtest aid rather than a save-schema feature.
    - Added local month-review telemetry capture with queue, dock, invalid-storage, blocked-order, and bottleneck summaries, plus a compact export surface in the Operations panel.
    - Extended the right operations panel with difficulty visibility and a playtest review section for recent month summaries and copyable review output.
    - Expanded the monthly planning forecast page and save-slot metadata so testers can see the active difficulty more clearly.
    - Added focused Vitest coverage for difficulty behavior, tutorial hint selection, month-review telemetry formatting, and save metadata.
    - Verification completed: `npm run test` passed with 105 tests, and `npm run build` passed. The build still emits the expected Phaser bundle-size warning.
    - Manual browser verification and structured internal playtest sessions are still recommended to finish the full Phase 12 checklist.

Phase 12 HUD Accessibility Polish: Completed
    - Reworked the left tool palette into four collapsible sections: `Tools`, `Storage`, `Doors`, and `Overlays`.
    - Anchored both the left and right HUD panels below the measured bottom edge of the top HUD instead of relying on fixed top offsets.
    - Exposed the top HUD element for measurement and updated the main game shell layout to keep side panels responsive as the top HUD height changes.
    - Removed the duplicate lower-right Issues panel to reduce clutter.
    - Converted the right-panel issue summary into a carousel with previous/next controls, issue counts, and retained focus actions.
    - Verification completed: `npm run build` passed. The build still emits the expected Phaser bundle-size warning.

Dock Capacity Polish: Completed
    - Added authoritative dock-capacity support with a default `5,000` cubic feet for each dock-edge tile within one tile of an active door.
    - Extended inbound trailer and freight-batch state with dock-tile reservations so door assignment respects real dock space instead of only door availability.
    - Updated switch, unload, storage, and outbound freight flows so trailers only claim doors with enough nearby dock capacity for the full unload.
    - Kept trailers in the yard when no eligible door has enough dock space and added a critical alert for inbound trailers blocked by full dock capacity.
    - Prevented removing an idle door when it is still the only support for occupied dock-space capacity.
    - Added dock-capacity summaries to operations diagnostics so players can see used versus total dock space directly in the right HUD panel.
    - Expanded simulation coverage for alternate-door fallback, full-dock blockage alerts, protected door removal, and the new dock reservation fields.
    - Verification completed: `npm run test` passed with 109 tests, and `npm run build` passed. The build still emits the expected Phaser bundle-size warning.

Dock Capacity Indicator Polish: Completed
    - Added a dock-capacity warning light to each dock indicator in Phaser without removing the existing door-state colors.
    - Dock indicators now stay white under normal load, turn yellow when any supported dock tile is more than 75% full, and turn red when a supported dock tile is full.
    - Wired the door renderer to live warehouse-map dock-capacity data so the warning light updates as trailers reserve, unload, and clear dock space.
    - Verification completed: `npm run test` passed with 109 tests, and `npm run build` passed. The build still emits the expected Phaser bundle-size warning.

Hyper Speed Responsiveness Polish: Completed
    - Added batched simulation ticking through `SimulationRunner.tickMany()` so multiple Hyper-speed ticks can execute with one state-change notification pass.
    - Moved the browser animation loop to use batched ticks per frame instead of notifying React and Phaser after every individual Hyper-speed tick.
    - Preserved the monthly-planning guard so Hyper still stops accumulated frame time once planning opens.
    - Added regression coverage confirming grouped ticks only notify change subscribers once per batch.
    - Verification completed: `npm run test` passed with 110 tests, and `npm run build` passed. The build still emits the expected Phaser bundle-size warning.

Phase 13: Implemented
    - Saved the finalized Phase 13 plan to `memory-bank/phase-13-plan.md` and folded the contract system into the main roadmap.
    - Expanded authoritative contract state to support pending offers, multiple active contracts, completed contracts, richer contract health/performance fields, and planning snapshot contract counts.
    - Added bounded monthly contract-offer generation with client, class, throughput, rate, service target, dwell-penalty, challenge, and operational-analysis details.
    - Added planning-time contract accept/reject decisions through `SetContractOfferDecisionCommand` and finalized accepted offers into active contracts during monthly plan confirmation.
    - Tagged inbound freight batches, outbound orders, and trailers with `contractId` so inventory, throughput, and shipment completion can be attributed back to contracts.
    - Updated inbound generation, outbound demand creation, picking, loading, finance, and contract evaluation so active contracts now shape freight mix, revenue, service level, and dwell-penalty exposure.
    - Reworked the contract system and related alerts from a single baseline contract assumption to multi-contract evaluation with per-contract health, performance score, and aggregate service pressure.
    - Added a `Contracts` page to monthly planning that presents offer details, forecast ranges, penalty terms, challenge notes, and operational analysis before the player confirms the month.

Build Costing: Completed
    - Added `src/data/config/buildCosts.json` as the source of truth for travel, erase, storage-by-type, and door-placement costs.
    - Added simulation-side build-cost helpers in `src/game/simulation/economy/buildCosts.ts` so cost calculation stays authoritative and shared across commands and UI labels.
    - Added separate capital-spend tracking to economy state with lifetime and current-month totals plus the last capital-spend tick.
    - Updated `PaintZoneCommand` and `PaintZoneAreaCommand` to charge only for tiles that actually change, including erase costs through the existing unassigned-zone path.
    - Added per-storage-type pricing so specialized storage costs more than standard storage.
    - Updated `PlaceDoorCommand` to spend cash immediately on successful door placement while keeping door removal free and non-refundable.
    - Added insufficient-cash failures for map edits so paint and door commands do not mutate simulation state when the player cannot afford the action.
    - Updated the left tool panel to show tile and door pricing directly in tool descriptions.
    - Bumped the save schema to version `4` so the new economy shape is treated as a new save format.
    - Added regression coverage for travel/storage/erase charging, changed-tile-only area pricing, unaffordable edits, door-placement spending, and save/load preservation of capital costs.
    - Verification completed: targeted `npm test -- --run src/tests/simulation/PaintZoneCommand.test.ts src/tests/simulation/DoorPlacement.test.ts src/tests/persistence/SaveLoadService.test.ts` passed.
    - Added contract portfolio selectors and a paginated right-panel contract browser that shows 3 live contract cards per page with KPI score, service level, inventory cube, rolling throughput, estimated labor/day, estimated headcount/day, and penalty totals.
    - Bumped the save schema version so the richer contract/planning state is preserved through save/load.
    - Added and updated simulation/UI coverage for planning offer generation, offer acceptance, contract activation, attribution, alert behavior, and selector output.
    - Verification completed: `npm run test` passed with 111 tests, and `npm run build` passed. The build still emits the expected Phaser bundle-size warning.

Phase 14: Implemented
    - Saved the finalized Phase 14 plan to `memory-bank/phase-14-plan.md`.
    - Expanded authoritative labor state with month-to-date analytics counters for all seven labor roles, including processed cube, task counts, task ticks, headcount ticks, and role-level labor cost accumulation.
    - Instrumented switch, unload, storage, pick, and load workflows so completed work now records direct labor-analysis metrics at the same simulation boundaries that move freight forward.
    - Added estimated support-role attribution for sanitation and management so the analysis dialog can report support productivity without pretending they process discrete freight directly.
    - Reset labor analytics on monthly planning rollover and preserved the new analytics state through save/load with a save schema bump to version 3.
    - Expanded labor selectors with per-role analysis metrics, labor-wide profitability summary, selector-driven staffing suggestions, and an ideal-KPI forecast headcount model based on accepted-contract throughput.
    - Reworked the labor dialog into `Assignments` and `Analysis` views, keeping live headcount controls while adding summary cards, suggestion cards, a current-versus-ideal staffing forecast chart, and detailed role metrics.
    - Implemented a dependency-free forecast chart using the existing React/CSS surface instead of adding a new charting library.
    - Added focused coverage for labor-analysis recording, suggestion behavior, forecast calculations, month rollover reset, and analytics serialization.
    - Verification completed: `npm run test` passed with 116 tests, and `npm run build` passed. The build still emits the expected Phaser bundle-size warning.

Monthly Planning Access and Workforce Headcount: Completed
    - Added a manual `Plan` button to the right HUD Business section so monthly review and planning can be opened during normal operations instead of only at month rollover.
    - Reworked monthly planning close behavior so confirmed plan changes are queued and become authoritative on the next simulation tick rather than applying immediately when the dialog closes.
    - Stopped simulation time from advancing while monthly planning is open, including batched Hyper-speed tick accumulation.
    - Extended authoritative monthly planning state to track queued plans and planned total headcount alongside budget and role assignments.
    - Added `SetPlannedTotalHeadcountCommand` and Workforce-page controls so the player can manage total employed headcount during planning.
    - Updated planning validation so planned role assignments cannot exceed the planned total headcount and planned total headcount cannot be set below already assigned labor.
    - Updated queued-plan activation so total headcount, labor assignments, budget, and accepted contract decisions all apply together at the start of the next tick.
    - Changed payroll accrual to charge total employed headcount instead of only currently assigned heads, making unassigned labor a real business cost.
    - Added and updated simulation coverage for manual planning open, next-tick plan activation, planning-time headcount changes, non-advancing time while planning is open, and payroll based on total employed headcount.
    - Verification completed: `npm test` passed with 124 tests, and `npm run build` passed. The build still emits the expected Phaser bundle-size warning.

Economy Scale Rebalance: Completed
    - Rebalanced the shared labor cost constant downward so employed-headcount payroll operates on the same unit scale as freight revenue.
    - Lowered the base operating-cost floor and scaled down condition and safety cost penalties so routine operating burn no longer overwhelms plausible monthly contract income by default.
    - Reduced budget cost-per-point so default planning budgets remain meaningful without dominating the entire operating-cost model.
    - Updated contract-offer labor delta estimates to derive from the shared labor-cost constants instead of a duplicated oversized monthly formula.
    - Added regression coverage to keep baseline fixed labor and operating costs within a believable range relative to baseline contract revenue.
    - Added and updated economy and labor-analysis coverage so finance, planning analysis, and contract analysis all reflect the rebalanced cost scale consistently.
    - Verification completed: `npm test` passed with 127 tests, and `npm run build` passed. The build still emits the expected Phaser bundle-size warning.

Storage Zone Capacity Display: Completed
    - Removed the prototype standard-storage tile-art experiment from Phaser rendering, preload, and tests after it proved visually noisy and not useful enough for gameplay readability.
    - Added selector-driven `selectStorageZoneSummaries` output so the UI can read authoritative zone id, zone type, tile count, used cube, total capacity, utilization, and validity state directly from the simulation.
    - Added a new `Storage Zones` section to the right Operations panel with compact progress bars, utilization percentages, used-versus-capacity totals, and invalid-zone messaging.
    - Kept the map renderer simple and unchanged so storage visualization now improves clarity without increasing render complexity or asset maintenance.
    - Added focused storage-flow coverage for zone summary and utilization calculations.
    - Verification completed: `npm test` passed with 131 tests, and `npm run build` passed. The build still emits the expected Phaser bundle-size warning.

HUD Layout Polish: Completed
    - Simplified the bottom KPI bar by removing the Bottleneck, Switching, and Unload indicators.
    - Moved the Dock indicator to the far left of the bottom HUD for faster scanning.
    - Gave the remaining KPI pills equal fixed widths so the bottom HUD no longer expands and contracts with changing values.
    - Corrected the resulting side-panel spacing regression by reserving bottom-HUD clearance in the left and right panel layout calculations.
    - Removed hover tooltips from the left HUD tool and overlay controls because their inline labels already carried the needed information and the popups were blocking clicks.
    - Converted the left HUD sections into accordion behavior so expanding one section collapses the others.
    - Set the top-HUD overlay badge to a fixed width sized to the longest current overlay label so it no longer shifts the surrounding header content.
    - Verification completed: `npm run build` passed after each HUD layout adjustment. The build still emits the expected Phaser bundle-size warning.

Run Types Expansion: Completed
    - Expanded the available difficulty presets from two to four by adding `Demanding` and `Brutal` on top of the existing `Relaxed` and `Standard` modes.
    - Added `initialHeadcount` to difficulty configuration so each run type now defines both its economic starting point and its opening labor pool.
    - Set starting headcount by mode to `Relaxed: 14`, `Standard: 12`, `Demanding: 9`, and `Brutal: 8`.
    - Updated simulation startup so the selected run mode determines initial labor headcount instead of using one fixed shared default.
    - Scaled starting labor-role assignments to fit the selected mode's total headcount while preserving the existing role-balance pattern as closely as possible.
    - Updated config validation and simulation coverage for the new run modes and the reduced standard-mode baseline headcount.
    - Verification completed: `npm test` passed with 132 tests. The existing Vite build warning remains unchanged.

Balance and Monthly Review Rework: Completed
    - Reworked the live simulation speed ladder to `Slow 4`, `Medium 10`, and `Fast 20`, and tuned `Hyper` to reach a 30-day month target in `4` seconds.
    - Updated month-boundary behavior so planning still opens once per month, but Hyper now drops into `Paused` for review instead of slow-playing through the boundary.
    - Added a persistent `skip future monthly reviews` planning option backed by authoritative simulation state, command handling, UI controls, and save/load preservation.
    - Lowered freight-class base revenue rates and raised recurring labor and operating costs so revenue growth no longer outruns warehouse friction as quickly.
    - Retuned the baseline contract throughput/revenue assumptions to fit the harsher recurring-cost scale without making the default business instantly insolvent.
    - Increased outbound friction by lowering harder-mode outbound order size multipliers, requiring at least `1,200` cubic feet of stored inventory before new outbound demand can spawn, and blocking new generation when `3` active outbound orders already exist.
    - Updated timing, planning, economy, outbound-flow, and save/load coverage to reflect the new speed, monthly-review, and balance behavior.
    - Verification completed: `npm test` passed with 134 tests, and `npm run build` passed. The build still emits the expected Vite chunk-size warning.

Playtest Quality-of-Life and Contract Pool Expansion: Completed
    - Added `memory-bank/gameplay-hints.md` with concrete staffing plans, layout patterns, score-recovery advice, and speed usage guidance for all four run types.
    - Fixed the top-HUD `New Run` dropdown styling so the selector and its options render with readable contrast.
    - Added a playtest cheat sequence so typing `ineedcashnow!` outside form fields resets cash to `250,000` through an authoritative simulation command.
    - Replaced the tiny procedural monthly contract-offer source with a data-backed pool of 50 distinct company templates covering all freight classes and challenge tags.
    - Expanded contract template data to include unique company names, fixed freight classes, volume ranges, term options, pricing/service modifiers, and per-account challenge notes.
    - Updated monthly offer generation to draw 4 surfaced offers from the larger pool while favoring diversity across freight class, difficulty tag, and volume band and avoiding immediate client-name repetition.
    - Added contract-template config validation plus focused coverage for offer diversity, anti-repetition behavior, and the new playtest cheat handling.
    - Verification completed: `npm test` passed with 139 tests, and `npm run build` passed. The build still emits the expected Vite chunk-size warning.

Storage Zone Parent Grouping: Completed
    - Changed the right-HUD `Storage Zones` panel to group capacity by parent storage-zone class instead of listing each contiguous child area as a separate capacity row.
    - Updated `selectStorageZoneSummaries` to aggregate authoritative child-zone usage, capacity, assigned tile count, area count, and invalid-area count into one summary per storage class.
    - Simplified the panel copy so each entry now shows total assigned tiles across grouped areas, which makes the display match higher-level storage planning decisions better than raw contiguous zone ids.
    - Added regression coverage for disconnected-area aggregation and grouped invalid-area messaging.
    - Verification completed: `npm test` passed with 143 tests, and `npm run build` passed. The build still emits the expected Vite chunk-size warning.

Paused Storage Tile-Art Preservation: Completed
    - Fixed paused zone editing so rebuilding storage zones no longer resets existing assigned areas to the default `00` capacity tile image.
    - Added storage-zone reconciliation after paint commands so stored freight remaps onto rebuilt zones by tile overlap before the next simulation tick.
    - Centralized zone-usage recalculation and applied it immediately after map edits so rendered utilization stays aligned with authoritative stored volume even while paused.
    - Added regression coverage for repainting unrelated areas while stored freight already exists in a storage zone.
    - Verification completed: `npm test` passed with 144 tests, and `npm run build` passed. The build still emits the expected Vite chunk-size warning.

Inbound Yard Dwell Tuning: Completed
    - Added difficulty-configured inbound yard dwell ranges so newly arrived inbound trailers wait a small randomized number of ticks before they can reserve a door.
    - Set the dwell windows to `Relaxed: 1-3`, `Standard: 2-5`, `Demanding: 3-6`, and `Brutal: 4-8` ticks to make the yard a visible operational buffer without overwhelming dock flow.
    - Extended inbound trailer state with `readyForDoorAssignmentTick`, updated inbound generation to stamp that value on arrival, and gated switch-driver door assignment on the trailer becoming ready.
    - Updated config validation and inbound-flow coverage so the new dwell configuration and staged yard -> switching -> unloading sequence are both enforced by tests.
    - Verification completed: `npm test` passed with 148 tests, and `npm run build` passed. The build still emits the expected Vite chunk-size warning.

Scenario Saves, Load Refresh, and Travel Distance: Completed
    - Added four seeded playtest scenario save slots for `Relaxed`, `Standard`, `Demanding`, and `Brutal`, surfaced through the existing Save/Load dialog with `Load` and `Reset` actions.
    - Centered the seeded scenario layouts on the map and changed scenario seeding to regenerate those built-in slots so they do not silently reuse stale payloads.
    - Fixed loaded-state rendering by rebuilding Phaser tile, overlay, door, and input bindings whenever save/load replaces the authoritative map or freight references.
    - Added a first-pass travel-distance throughput factor for storage and picking using conservative multipliers derived from storage-zone travel distance rather than explicit worker path simulation.
    - Added regression coverage for scenario payload validity/reset behavior, visible relaxed-scenario layout seeding, loaded-state renderer refresh, and distance-based storage/pick throughput differences.
    - Verification completed: `npm test` passed with 154 tests, and `npm run build` passed. The build still emits the expected Vite chunk-size warning.
