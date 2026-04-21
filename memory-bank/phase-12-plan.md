# Phase 12 Plan: MVP Balancing and Playtest Preparation

## Summary

Phase 12 should turn the current FreightFlow build into a first real playtest candidate. The core systems are now present: zone painting and validation, doors, inbound and outbound freight, labor allocation, economy and score systems, monthly planning, diagnostic overlays, save/load, config validation, and a working browser UI. This phase should focus on tuning, onboarding, and measurement so a fresh tester can play several months, understand what is happening, and give useful feedback.

This should be a balancing-and-clarity phase, not a new-systems phase. Prefer config-driven changes, targeted UI wording improvements, lightweight tutorial hints, and small telemetry hooks over deep feature expansion.

## Goals

- Tune the current systems so early play feels understandable and responsive.
- Establish at least one approachable difficulty and one clearly challenging difficulty.
- Improve the connection between player choices and outcomes in throughput, cash, labor pressure, and scores.
- Add a lightweight tutorial hint flow for the first few player decisions and failure states.
- Add simple playtest telemetry and review surfaces so internal sessions produce actionable balancing notes.
- Produce a stable build that can be played for multiple months without catastrophic failure or confusion.

## Non-Goals

- Do not add major new gameplay systems.
- Do not redesign the core UI shell from scratch.
- Do not add advanced analytics infrastructure or remote telemetry.
- Do not build full campaign progression, achievements, or narrative content.
- Do not overfit the balance to one “perfect” layout; the goal is readable range, not a solved meta.

## Current Starting Point

- Zone, door, labor, freight, economy, score, planning, diagnostics, and save/load systems are implemented.
- Config files already exist for freight classes, zone types, labor roles, difficulty modes, contracts, seasonal curves, and client profiles.
- Alerts, overlays, KPI pills, and the operations panel already provide strong diagnosis tooling.
- Phase 11 added local save/load and config validation, which makes repeated balance testing easier and safer.
- The game already supports Hyper speed for fast monthly loop testing.

## Recommended Scope Decision

Implement Phase 12 in four linked passes:

1. Tune core config values and formula thresholds.
2. Improve player-facing guidance for the first few months.
3. Add lightweight playtest telemetry and review notes.
4. Run structured internal playtests and capture resulting adjustments.

This keeps the phase grounded in the current build while still producing a credible MVP candidate.

## Balance Pass 1: Config Tuning

Primary tuning surfaces:

- `src/data/config/freightClasses.json`
- `src/data/config/zoneTypes.json`
- `src/data/config/laborRoles.json`
- `src/data/config/difficultyModes.json`
- `src/data/config/contracts.json`
- `src/data/config/seasonalCurves.json`
- `src/data/config/clientProfiles.json`

Recommended tuning targets:

- freight arrival cadence and volume ranges
- outbound demand generation pressure
- zone capacities per tile
- labor base rates and effective bottleneck thresholds
- baseline labor headcount and pressure breakpoints
- budget effect strengths for maintenance, safety, training, and operations support
- score decay/recovery thresholds for morale, safety, condition, client satisfaction, and customer satisfaction
- contract service targets and health thresholds
- starting cash and difficulty volatility ranges

## Recommended Difficulty Targets

Create two intentionally different presets:

### Relaxed / Introductory

- higher starting cash
- lower demand volatility
- slightly more forgiving score decay
- lower contract pressure
- room to recover from early storage or labor mistakes

### Standard / Challenging

- current balance or slightly tighter cash
- higher demand volatility
- stronger consequences for blocked storage and labor bottlenecks
- meaningful pressure to use planning and diagnostics well

If a third preset emerges naturally, add it only after the first two feel distinct and understandable.

## Balance Pass 2: Early-Game Clarity

The first 1-2 in-game months should teach the loop without a manual.

Recommended early-game goals:

- player understands that travel is required for valid storage
- player understands doors matter and can be placed/edited
- player sees freight move from yard to dock to storage to outbound
- player learns labor shortages create visible bottlenecks
- player encounters monthly planning and understands it changes the next month

Add lightweight guidance rather than a heavy scripted tutorial:

- first-run hint when no valid storage exists
- hint when dock freight is blocked for missing compatible storage
- hint when labor bottlenecks go critical for the first time
- hint when planning opens the first time
- hint when save/load becomes relevant or available

Hints should be dismissible, brief, and tied to real simulation state. Use existing alerts/recommendation patterns where possible.

## Tutorial Hint Flow Plan

Add a minimal onboarding flow under UI state or a small tutorial service:

- no travel painted near storage
- no usable door for inbound or outbound work
- blocked dock freight due to storage mismatch
- repeated critical labor bottleneck
- first monthly planning open
- first negative monthly net

Recommended approach:

- trigger each hint once per run
- allow reset via save/load only if the hint state is intentionally excluded from saves
- keep text short and player-action oriented
- prefer tying hints to existing operational issue selectors rather than duplicating business logic

## Telemetry And Playtest Review Plan

Add lightweight local/internal telemetry, not remote analytics.

Suggested telemetry signals:

- month-end snapshot summary
- average and peak queue pressure
- average and peak dock freight
- invalid storage count over time
- blocked outbound order count over time
- labor bottleneck frequency by role
- cash, net, and score trend summaries by month
- active difficulty mode
- planning budget allocations by month

Recommended implementation shape:

- add a small per-month telemetry record in simulation state or a derived playtest log service
- keep raw event history shallow; prefer monthly summaries over huge tick logs
- expose a compact playtest review section in the right panel, a dialog, or a debug export area
- support copyable text or JSON summary for internal review

## UI Polish For Playtesting

Make small targeted adjustments based on what a fresh tester needs:

- polish alert and recommendation wording for the most common failure states
- make top score/economy drivers easier to interpret in plain language
- ensure tutorial hints and save/load do not obscure the main map excessively
- reduce duplicate metrics if some now feel noisy after Phase 10 and 11
- consider one small “Month Summary” section or modal at planning open if monthly outcomes are too easy to miss

Keep the UI compact. This phase should improve comprehension, not add dashboard sprawl.

## Suggested Internal Playtest Structure

Run short structured sessions rather than one long freeform round.

### Session A: First-Time Learnability

- start from a fresh save
- play 1-2 months at normal speed
- note where the player stalls or misreads the system

### Session B: Recovery From Failure

- intentionally create invalid storage, labor shortages, and blocked dock freight
- verify the player can diagnose and recover

### Session C: Strategic Pressure

- use harder difficulty
- play 3-4 months
- verify planning choices, layout quality, and labor allocation produce meaningful differences

### Session D: Stability Regression

- use save/load mid-month, during planning, and after several months
- verify the playtest build remains stable through repeated runs

## Test Plan

Add focused tests where formulas become stable enough to lock down:

- balance-sensitive score threshold behavior
- difficulty preset application
- contract health threshold behavior
- tutorial hint trigger conditions
- telemetry snapshot creation at month boundary
- playtest summary generation if added

Do not over-snapshot volatile UI text. Favor selector and system tests.

## Manual Validation Plan

After implementation:

- run `npm run test`
- run `npm run build`
- run a browser pass on the dev server

Manual checks:

- relaxed difficulty is clearly more forgiving than standard
- a fresh player can understand the first month without external explanation
- alerts and hints point to useful corrective actions
- planning choices create visible next-month consequences
- different layouts and labor allocations produce meaningfully different results
- multiple months can be played without catastrophic spirals unless the player makes clear mistakes
- save/load still works after balancing and onboarding changes

## Implementation Order

1. Review current configs and identify the highest-friction balance points.
2. Tune difficulty presets, freight volumes, zone capacities, and labor rates.
3. Tune score and budget effect thresholds.
4. Tune contract pressure and service expectations.
5. Improve alert/recommendation wording for the most common failure states.
6. Add the first-run tutorial hint flow tied to real simulation conditions.
7. Add lightweight month-end telemetry summaries or a playtest review export.
8. Run structured internal playtests across at least two difficulty presets.
9. Apply final config/UI wording adjustments based on findings.
10. Validate with tests, build, browser pass, and save/load regression.
11. Update `memory-bank/progress.md` when Phase 12 is complete.

## Risks And Mitigations

- Risk: balancing becomes endless.
  - Mitigation: set explicit session goals and only tune the values that materially affect comprehension, pressure, and recovery.

- Risk: tutorial hints duplicate alerts and clutter the UI.
  - Mitigation: reuse existing diagnostic selectors and only show one-time hints for core concepts.

- Risk: telemetry becomes a second debug UI project.
  - Mitigation: keep it to month summaries and a compact export/review surface.

- Risk: the game is only balanced for one optimal layout.
  - Mitigation: test multiple warehouse layouts and labor plans before locking values.

- Risk: late-phase config changes destabilize established tests.
  - Mitigation: prefer adjusting config values first and only rewrite formulas when clearly necessary.

## Review Questions

- Do you want two difficulty presets as the Phase 12 minimum, or should we target three?
- Should tutorial hints be always-on for MVP, or only for a dedicated introductory difficulty?
- Do you want month-end telemetry shown in-game, exported as text/JSON, or both?
- Should the playtest build prioritize recovery friendliness, or is sharper punishment acceptable if the diagnostics are clear?
- Do you want Phase 12 to include a lightweight month summary modal, or should we keep feedback inside the existing HUD/panels?

## Completion Criteria

Phase 12 is complete when:

- at least one approachable and one challenging difficulty are clearly differentiated
- early play teaches the core loop without outside explanation
- alerts, hints, and recommendations help the player recover from common failures
- multiple months can be played with meaningful variation from layout, labor, and planning decisions
- lightweight telemetry or playtest review output exists for internal balancing review
- `npm run test` and `npm run build` pass
- browser validation and save/load regression pass
- `memory-bank/progress.md` documents the final MVP balancing and playtest-prep work
