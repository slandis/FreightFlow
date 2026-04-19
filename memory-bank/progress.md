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
