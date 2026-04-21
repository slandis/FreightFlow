# Phase 11 Plan: Save/Load, Testing, and Stability Pass

## Summary

Phase 11 should harden FreightFlow into a repeatable playtest build. The current game has the main systems in place: zoning, doors, freight flow, storage, outbound orders, labor, economy, scores, alerts, monthly planning, Hyper speed, and Phase 10 diagnostics. This phase should focus on resilience: players can save and resume, tests protect the full gameplay loop, config failures surface clearly, and repeated sessions do not accumulate duplicate loops or stale UI/rendering state.

The recommended scope is a stability vertical slice, not a final production persistence system. Use browser-local saves, a versioned schema, focused validation, and clear failure handling.

## Goals

- Add browser-local save/load that can round-trip the authoritative simulation state.
- Keep the simulation core authoritative after load; React and Phaser should redraw from the loaded state.
- Add a versioned save schema with validation and explicit failure messages.
- Replace persistence stubs with testable services that avoid direct hard dependencies on `window`.
- Add config repository validation so malformed balancing data fails loudly.
- Expand automated coverage around save/load, month transitions, freight lifecycle, and config loading.
- Add basic stability checks for duplicate loops, subscriptions, and long-session runtime behavior.
- Add simple player-facing save/load controls suitable for MVP playtesting.

## Non-Goals

- Do not add cloud saves or account profiles.
- Do not implement multiple named campaigns beyond a small slot list.
- Do not build a full migration framework beyond schema-version detection and a first migration hook.
- Do not rebalance gameplay numbers; Phase 12 owns tuning.
- Do not redesign the UI shell; keep controls compact and practical.
- Do not persist purely transient UI state such as hover tile, active tooltip, or open/closed panels unless it is needed for gameplay continuity.

## Current Starting Point

- `src/persistence/SaveLoadService.ts` exists as a stub.
- `src/persistence/LocalSaveRepository.ts` writes and reads raw strings from `window.localStorage`.
- `src/persistence/ConfigRepository.ts` reads several JSON configs but does not validate shape.
- `SimulationRunner` owns the authoritative `GameState` and dispatch/tick lifecycle.
- `GameState` contains class instances such as `WarehouseMap`, so load needs reconstruction, not just `JSON.parse`.
- Phase 10 added UI-only overlay/focus state that should not be treated as simulation save data.
- The test suite currently covers 87 tests across simulation, timing, phaser helpers, freight flow, labor, planning, economy, diagnostics, and doors.

## Recommended Scope Decision

Implement Phase 11 in four tightly connected slices:

1. Versioned save schema and serializer.
2. Browser local save/load controls.
3. Config validation and failure reporting.
4. Integration/stability tests for repeated play sessions.

This gives the next phase a stable base for balancing and playtesting without overbuilding persistence.

## Save Schema Plan

Add a new save model under `src/persistence/`:

- `SaveGameSchema.ts`
  - `SAVE_SCHEMA_VERSION = 1`
  - `SaveGamePayload`
  - `SerializedGameState`
  - `SaveMetadata`
  - validation result types

Suggested top-level payload:

```ts
interface SaveGamePayload {
  schemaVersion: 1;
  savedAt: string;
  slotId: string;
  gameState: SerializedGameState;
  metadata: {
    currentTick: number;
    calendarLabel: string;
    cash: number;
    activeAlertCount: number;
    warehouseName?: string;
  };
}
```

Use plain JSON-compatible objects. Do not serialize methods or class prototypes.

## Serialization Plan

Add a serializer/deserializer pair:

- `GameStateSerializer.ts`
  - `serializeGameState(state: GameState): SerializedGameState`
  - `deserializeGameState(serialized: SerializedGameState): GameState`
  - `validateSerializedGameState(input: unknown): ValidationResult`

Important reconstruction rules:

- Rebuild `WarehouseMap` as a real `WarehouseMap` instance, then apply serialized tile state and rebuilt zones.
- Re-run zone aggregation/storage validation after load so zone capacity and validity stay consistent with map rules.
- Preserve used storage capacity, inventory, freight batches, trailers, outbound orders, doors, labor pools, economy, scores, contracts, alerts, planning state, calendar, speed, cash, KPIs, and debug metadata.
- Load games should resume paused by default unless we explicitly decide to preserve speed. Recommended: save the stored speed but load into `paused` with a "loaded paused" message so players do not lose control.
- Do not serialize Phaser objects, React store state, hover/selection highlights, tooltip state, or pending map focus requests.

## Save/Load Service Plan

Replace the stub `SaveLoadService` with an injectable service:

- Constructor inputs:
  - `repository: SaveRepository`
  - `getState: () => GameState`
  - `replaceState: (state: GameState) => void`
  - optional `clock: () => Date`
- Methods:
  - `save(slotId: string): SaveResult`
  - `load(slotId: string): LoadResult`
  - `listSlots(): SaveSlotSummary[]`
  - `delete(slotId: string): SaveResult`
  - `hasSave(slotId: string): boolean`

Add a small repository interface:

```ts
interface SaveRepository {
  write(slotId: string, payload: string): void;
  read(slotId: string): string | null;
  remove(slotId: string): void;
  list(): SaveSlotSummary[];
}
```

Update `LocalSaveRepository`:

- Accept a `Storage`-like dependency for tests.
- Add `remove`.
- Add `list` using the `freightflow.save.` key prefix.
- Handle malformed slot payloads without crashing the slot list.

## Simulation Runner Integration

Add controlled state replacement to `SimulationRunner`:

- `replaceState(nextState: GameState): void`
- emit or trigger subscribers after replace so React and Phaser rerender immediately.
- ensure existing event bus/debug behavior still works after load.
- decide load speed behavior:
  - recommended: force `GameSpeed.Paused` on loaded state and leave saved speed in metadata only for display/future use.

Potential load flow:

1. UI calls `saveLoadService.load(slotId)`.
2. Service reads and validates payload.
3. Service deserializes to a real `GameState`.
4. Runner replaces state and notifies subscribers.
5. UI closes save/load dialog and displays result.
6. Phaser rerenders map, overlays, doors, hover/selection state refreshes naturally.

## UI Plan

Add a compact save/load dialog rather than spreading controls across the HUD:

- `src/ui/components/dialogs/SaveLoadDialog.tsx`
- add UI store fields:
  - `isSaveLoadDialogOpen`
  - `saveLoadMessage`
- add top-HUD button: `Save/Load`
- dialog features:
  - three local slots: `slot-1`, `slot-2`, `slot-3`
  - show slot metadata: date saved, tick/date, cash, alerts
  - buttons: Save, Load, Delete
  - disabled Load/Delete when empty
  - confirmation for overwrite/delete can be lightweight text-state, not a custom modal inside the modal
  - clear error/success messages

Keep the dialog practical and compact. No nested card styling; use the existing modal visual language.

## Config Validation Plan

Upgrade `ConfigRepository` from passive JSON access to simple validation:

- validate required arrays and fields for:
  - `freightClasses.json`
  - `zoneTypes.json`
  - `laborRoles.json`
  - `difficultyModes.json`
  - `contracts.json`
  - `seasonalCurves.json`
  - `clientProfiles.json`
- expose:
  - `validateAll(): ConfigValidationResult`
  - typed getters where practical
- fail loudly in development when required IDs, numeric fields, or compatibility references are missing.

Initial validation checks:

- unique IDs per config file
- zone type IDs referenced by freight classes exist
- labor roles include every `LaborRole`
- numeric balancing fields are finite and non-negative where expected
- contracts include usable throughput and service-level values

## Testing Plan

Add focused tests rather than giant brittle snapshots.

Persistence tests:

- saving creates a versioned payload with useful metadata
- loading reconstructs a usable `GameState`
- loading invalid JSON fails cleanly
- loading unsupported schema version fails cleanly
- loading missing slot reports an explicit error
- save/load round-trip preserves:
  - painted zones and rebuilt zone ids
  - storage validity
  - doors and active door tiles
  - trailers and freight batches
  - inventory and outbound orders
  - labor assignments and pressure state
  - economy, scores, contracts, alerts
  - planning state and current month plan
- loaded state can tick without crashing

Repository tests:

- `LocalSaveRepository` writes, reads, lists, and removes slots using an injected storage object
- malformed slot metadata does not break `list`

Config tests:

- current config files pass validation
- duplicate IDs fail validation
- invalid freight-zone compatibility references fail validation
- missing labor roles fail validation

Integration/stability tests:

- save mid-freight lifecycle, load, tick, and complete storage/outbound flow
- save during monthly planning, load, confirm plan, and proceed to active play
- Hyper speed reaches planning without duplicate month-open events
- replacing state notifies subscribers exactly once
- repeated subscribe/unsubscribe cycles do not leave stale listeners

## Manual Validation Plan

After implementation:

- Run `npm run test`.
- Run `npm run build`.
- Start or reuse the dev server.
- Browser check:
  - paint zones, place doors, and create a small operational layout
  - run time until freight exists
  - save to slot 1
  - make visible changes
  - load slot 1 and verify map, doors, freight, KPIs, overlays, and panels return to saved state
  - save during monthly planning and reload
  - delete a save slot
  - verify bad/empty slot actions show clear messages
  - verify no blank page or console runtime errors

## Implementation Order

1. Define save schema and repository interfaces.
2. Make `LocalSaveRepository` injectable/testable and add list/remove.
3. Implement `GameStateSerializer` and reconstruction helpers.
4. Add `SaveLoadService` behavior and result types.
5. Add `SimulationRunner.replaceState`.
6. Add unit tests for repository, schema, serializer, and service.
7. Add UI store state and `SaveLoadDialog`.
8. Wire dialog into `SimulationProvider`/top HUD.
9. Add config validation to `ConfigRepository` and tests.
10. Add integration/stability tests.
11. Run validation and manual browser smoke.
12. Update `memory-bank/progress.md` with Phase 11 completion notes when implementation is finished.

## Risks And Mitigations

- Risk: loaded objects lose class behavior.
  - Mitigation: explicitly reconstruct `WarehouseMap` and any other class-backed structures instead of trusting raw parsed objects.

- Risk: save files drift as `GameState` evolves.
  - Mitigation: version the schema immediately and keep serialized types separate from runtime types.

- Risk: UI state becomes mixed into gameplay saves.
  - Mitigation: only serialize authoritative simulation state and metadata.

- Risk: localStorage tests become browser-environment dependent.
  - Mitigation: inject a minimal storage adapter and test against an in-memory fake.

- Risk: load during active simulation causes surprising motion.
  - Mitigation: force loaded games to pause and notify subscribers immediately.

- Risk: stability work expands indefinitely.
  - Mitigation: stop at save/load, config validation, targeted integration tests, and basic lifecycle leak checks. Defer tuning and tutorial polish to Phase 12.

## Review Questions

- Should loaded games always resume paused, or should they preserve the saved speed?
- Are three save slots enough for MVP playtesting?
- Should monthly planning saves reopen the planning dialog immediately after load?
- Should save metadata include warehouse layout stats such as painted storage capacity and active door count?
- Should config validation fail the app startup in development, or surface a blocking alert in the UI?

## Completion Criteria

Phase 11 is complete when:

- Players can save, load, list, and delete browser-local save slots.
- Loaded games reconstruct a working authoritative simulation state.
- Save payloads are versioned and invalid loads fail with clear messages.
- Config validation covers current balancing JSON.
- Tests cover persistence, config validation, state replacement, and at least one save/load gameplay lifecycle.
- `npm run test` and `npm run build` pass.
- A browser smoke test verifies save/load during active play and monthly planning.
- `memory-bank/progress.md` documents completed Phase 11 work and validation.
