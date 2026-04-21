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
