# Phase 9 Plan: Monthly Planning Flow

## Summary

Implement Phase 9 as the first strategic month-boundary loop. At the start of each new month, the simulation should shift to slow speed, open a monthly planning dialog, present a snapshot of the previous/current business state, let the player adjust monthly budget and labor targets, and apply the confirmed plan authoritatively through simulation commands.

This phase should stay data-first and playable. The dialog does not need final art polish, charts, or deep forecasting AI yet. It does need to make planning feel connected to the real freight, labor, score, and finance systems already in place.

## Current Starting Point

- `SimulationClock` already tracks a 30-day month and rolls month/year forward.
- `GameState` currently has economy, score, contract, alert, labor, freight, and calendar state, but no planning state.
- `MonthlyPlanningDialog.tsx` exists as a stub.
- `ApplyBudgetPlanCommand` and `ConfirmMonthlyPlanCommand` exist as stubs.
- `ChangeSpeedCommand` already supports authoritative speed changes.
- `LaborDialog` already provides real-time labor editing; Phase 9 should reuse command-based labor assignment patterns rather than inventing a separate UI-only labor state.
- Current Phase 8 finance uses per-tick costs, while fuller monthly budget effects are still simplified.

## Goals

- Month rollover opens planning exactly once per new month.
- Planning state lives in the simulation core, not only React UI.
- The player can review a useful snapshot before making changes.
- Budget and labor choices are confirmed through commands.
- Confirmed plans affect the next month through visible cost/score/productivity modifiers.
- Simulation-changing map/tools/labor input is gated while planning is active.
- Tests cover month transition detection, dialog state, command application, and budget effects.

## Non-Goals

- Do not implement advanced forecast misses or difficulty-specific demand curves yet.
- Do not build final charting/visual polish.
- Do not implement full save/load for planning state; Phase 11 owns persistence hardening.
- Do not replace the existing real-time labor dialog. Phase 9 can add planning labor controls, but real-time labor editing remains available outside planning.
- Do not introduce complex monthly accounting periods if simple current-month counters are enough for this slice.

## Proposed Simulation Model

Add a planning branch to `GameState`.

Suggested shape:

```ts
export interface PlanningState {
  isPlanningActive: boolean;
  activePlanId: string | null;
  lastOpenedMonthKey: string | null;
  lastConfirmedMonthKey: string | null;
  pendingPlan: MonthlyPlan | null;
  currentPlan: MonthlyPlan;
  latestSnapshot: PlanningSnapshot | null;
}

export interface MonthlyPlan {
  monthKey: string;
  budget: BudgetPlan;
  laborAssignments: Record<LaborRole, number>;
}

export interface BudgetPlan {
  maintenance: number;
  training: number;
  safety: number;
  operationsSupport: number;
  contingency: number;
}
```

Keep budget values as simple monthly allocation units at first. They can later become dollars or percentages after balancing.

## Planning Snapshot

Create selector-friendly `PlanningSnapshot` data from existing systems:

- month/year being planned
- previous/current month revenue, labor cost, operating cost, net result
- cash on hand
- inbound, outbound, and throughput totals
- queue summary: yard, dock freight, storage, pick, load
- score summary: morale, condition, safety, client satisfaction, customer satisfaction
- contract service level and health
- labor assignments, pressure, top bottleneck, unassigned headcount
- storage capacity/usage and dock storage needs
- active alert count and critical alert count

This should be produced by a `PlanningSystem` or selector in the simulation layer, not assembled ad hoc inside React.

## Budget Effects For First Slice

Keep the effects clear, modest, and testable.

Recommended Phase 9 behavior:

- Maintenance budget reduces condition decline pressure and can provide a small condition recovery bonus.
- Training budget slightly improves productive labor throughput by increasing a planning/training modifier.
- Safety budget gives a small safety recovery/support modifier.
- Operations support reduces operating pressure from queues or management/sanitation support pressure.
- Contingency has no direct score effect yet, but remains visible as reserved cash/spend.

Implementation options:

- Add budget modifiers to `EconomyState` or a new `PlanningState.currentPlan`.
- Have `ConditionSystem`, `SafetySystem`, and `LaborManager` read those modifiers.
- Have `FinanceSystem` include budget allocations in operating cost.

Keep the formulas centralized and document constants near the systems that use them.

## Month Transition Flow

1. `SimulationRunner.tick()` advances the clock.
2. `PlanningSystem.update()` detects a new month key, such as `Y1-M2`.
3. If the month has not already opened planning:
   - set `planning.isPlanningActive = true`
   - create `pendingPlan` from `currentPlan`
   - generate `latestSnapshot`
   - set speed to `GameSpeed.Slow`
   - emit `monthly-planning-opened`
4. While planning is active:
   - simulation ticks can continue slowly, or the loop can be gated. For this phase, prefer gating gameplay changes while allowing UI interaction.
   - player-facing mutation commands should fail with a clear error if they are unsafe during planning.
5. Player confirms the plan.
6. `ConfirmMonthlyPlanCommand`:
   - validates budget and labor assignment totals
   - applies labor assignments through the same rules as `AssignLaborCommand`/`LaborManager`
   - commits `pendingPlan` into `currentPlan`
   - marks the month confirmed
   - closes planning
   - emits `monthly-plan-confirmed`

Open question for review: should the simulation fully pause while the planning dialog is active, or should it sit at slow speed with operational mutation commands gated? The implementation plan says auto-shift to slow; the UI spec says modal planning states can lock speed. My recommendation is: set speed to slow on open, then prevent speed changes until confirmation.

## Command Plan

Implement or update:

- `OpenMonthlyPlanningCommand` if manual/debug opening is useful.
- `ApplyBudgetPlanCommand` to update `planning.pendingPlan.budget`.
- `AssignPlannedLaborCommand` or extend `ConfirmMonthlyPlanCommand` to commit pending labor assignments.
- `ConfirmMonthlyPlanCommand` to validate and finalize the plan.
- Optional `CancelMonthlyPlanCommand` only if review decides cancellation should exist. For a month-start required planning flow, the safer first version is no cancel, only confirm.

Command rules:

- Budget values must be finite non-negative integers.
- Total planned labor assignments cannot exceed total headcount.
- Planning commands require `isPlanningActive`.
- Operational commands that mutate map/freight/labor should fail while planning is active unless explicitly allowed.

## UI Plan

Replace the `MonthlyPlanningDialog` stub with a modal planning shell mounted from `MainGameScreen`.

Add UI store state:

- `isMonthlyPlanningDialogOpen` if React needs a local override, or derive visibility directly from `state.planning.isPlanningActive`.
- `activePlanningPage` for Forecast, Workforce, Warehouse Condition, Satisfaction, Budgeting, and Productivity/Labor.

Recommended pages:

### Forecast

Show:

- planned month
- current contract target throughput
- recent inbound/outbound/throughput totals
- service level and missed/fulfilled demand
- simple risk notes based on current queues and alerts

### Workforce

Show:

- current headcount and planned assignments
- bottlenecks and pressure labels
- unassigned headcount
- simple warnings when planned headcount is low for active workload

### Warehouse Condition

Show:

- condition score and trend
- invalid storage count or capacity pressure
- dock storage needs
- sanitation pressure
- maintenance budget preview

### Satisfaction

Show:

- client and customer satisfaction scores
- top score drivers
- blocked/overdue order counts
- safety and condition contribution notes

### Budgeting

Show editable controls for:

- maintenance
- training
- safety
- operations support
- contingency

Show:

- total planned monthly budget
- estimated per-tick/per-month cost impact
- concise effect preview per category

### Productivity & Labor

Show:

- planned labor stepper controls by role
- total headcount guard
- projected productive capacity using current known modifiers
- explicit support-role warnings if sanitation/management are under target

## Styling Plan

Use the existing modal styling direction from `LaborDialog`, but create planning-specific classes:

- `.monthly-planning-dialog`
- `.planning-nav`
- `.planning-page`
- `.planning-summary-bar`
- `.planning-warning`
- `.budget-control`
- `.planning-role`

Keep the dialog readable and compact. Avoid heavy charting and keep the first version text/table driven.

## Events And Debugging

Add events:

- `monthly-planning-opened`
- `budget-plan-updated`
- `planned-labor-updated`
- `monthly-plan-confirmed`

Update debug metadata through normal command/event flow.

Optional but useful:

- expose the current month key and last confirmed month in the right panel or debug area
- include active planning status in the top HUD

## Testing Plan

Add or extend Vitest coverage for:

- clock rollover from day 30 to day 1 opens planning exactly once
- planning does not reopen repeatedly during the same month
- planning open sets speed to slow
- `ApplyBudgetPlanCommand` rejects invalid negative/non-finite budget values
- `ApplyBudgetPlanCommand` updates pending budget only while planning is active
- planned labor changes fail if they exceed total headcount
- confirming a plan commits budget and labor assignments
- confirming a plan closes planning and records the confirmed month key
- budget modifiers affect at least one score/cost path visibly
- operational mutation commands fail or are gated during active planning, based on chosen policy
- planning events update debug command/event metadata

Run:

```powershell
npm run test
npm run build
```

If Node is missing from PATH:

```powershell
$env:PATH = 'C:\Program Files\nodejs;' + $env:PATH
& 'C:\Program Files\nodejs\npm.cmd' --prefix 'y:\FreightFlow' run test
& 'C:\Program Files\nodejs\npm.cmd' --prefix 'y:\FreightFlow' run build
```

## Manual Browser Check

Use the dev server and verify:

- planning appears at the month boundary
- the dialog opens only once for the new month
- speed visibly shifts/locks as designed
- budget controls update previews without crashing
- invalid budget and labor inputs show clear errors
- confirmed labor changes affect the live labor panel after closing
- confirmed budget choices affect next-month costs/scores
- map painting, door editing, and other simulation-changing actions are blocked while planning is active
- dialog layout is usable without needing final visual polish

## Suggested Implementation Order

1. Add planning types and initial state to `GameState`.
2. Add `PlanningSystem` month-boundary detection and snapshot creation.
3. Wire `PlanningSystem` into `SimulationRunner.tick()`.
4. Add planning events.
5. Make `ApplyBudgetPlanCommand` real.
6. Make planned labor updates real, either through a new command or the confirm command.
7. Make `ConfirmMonthlyPlanCommand` validate and commit the pending plan.
8. Add command gating for unsafe gameplay mutations during active planning.
9. Replace `MonthlyPlanningDialog` stub with the multi-page shell.
10. Mount the dialog in `MainGameScreen` from simulation planning state.
11. Add planning/budget styling.
12. Add tests.
13. Run build/test validation.
14. Update `memory-bank/progress.md` after implementation.

## Review Questions

- Should planning pause the simulation entirely, or set speed to slow and lock speed/mutations until confirmation?
- Should Phase 9 include a manual planning button/debug opener, or only automatic month-start opening?
- Should the first budget values be abstract allocation points or explicit dollars?
- Should planned labor assignments apply immediately on confirm, or schedule for the next in-game day/month tick?
- Should there be a cancel/defer option, or should confirming a monthly plan be mandatory?

## Recommended Scope Decision

For the first implementation, use mandatory month-start planning with no cancel button. Set speed to slow, lock speed changes while planning is active, block simulation-changing commands, and require confirmation to resume normal operations. Use abstract budget points for now, but show estimated cost impact so the player understands cash consequences.
