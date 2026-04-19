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
