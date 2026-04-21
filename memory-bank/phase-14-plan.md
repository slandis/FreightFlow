# Phase 14 Plan: Labor Analysis and Forecast Dialog

## Summary

Phase 14 should turn the current labor dialog from a staffing-only control surface into a decision-support tool. The player should be able to open a labor analysis view, understand which roles are expensive or productive, see where freight volume is outrunning staffing, and get a short list of practical suggestions aimed at improving profitability.

This phase should stay grounded in the current FreightFlow architecture:

- simulation remains the authoritative source of labor and throughput data
- labor analysis is derived from simulation-owned counters and selectors
- the UI presents analysis and suggestions, but does not invent gameplay rules
- forecasted labor demand uses accepted-contract throughput already tracked in simulation state

This should be an operations-analysis phase, not a full workforce planning suite. The goal is actionable clarity, not enterprise BI depth.

## Goals

- Add a labor analysis dialog or labor-analysis tab reachable from the current labor UI flow.
- Present a breakdown for every labor role:
  - load
  - pick
  - storage
  - unload
  - switch driver
  - sanitation
  - management
- Show the requested metrics per role:
  - cost per throughput cube
  - average throughput cube processed per head
  - total cube processed by this labor type
  - average task ticks
  - total labor cost per tick
- Add a brief labor-wide summary with profitability-oriented guidance.
- Generate short boilerplate suggestions based on real bottlenecks and labor/economy conditions.
- Add a graph or chart showing expected headcount at maximum KPI scores for the freight volume forecasted across all accepted contracts.
- Keep the first-pass implementation readable, lightweight, and dependency-conscious.

## Non-Goals

- Do not build a full spreadsheet-style workforce management module.
- Do not add employee-level scheduling, shifts, overtime, or absenteeism.
- Do not build a full charting dashboard with zoom, export, or historical drilldown.
- Do not attempt accounting-perfect labor attribution for support roles in the first pass.
- Do not replace the current labor assignment controls; this phase should extend them.

## Current Starting Point

- `LaborDialog.tsx` already exists, but it currently focuses on live headcount assignment only.
- `laborSelectors.ts` exposes summary, bottleneck, and role-detail data, but not analysis metrics.
- `LaborState` tracks assigned headcount, rates, utilization, pressure, and modifiers, but not role-level throughput/cost history.
- Productive roles already process real work in simulation systems, so direct instrumentation points exist for unload, storage, pick, load, and switch work.
- Sanitation and management already affect global modifiers, but their work is support-oriented rather than directly tied to cube movement.
- Accepted contracts already carry `expectedMonthlyThroughputCubicFeet`, which is enough to drive a forecast model.
- There is no existing chart library pattern in the UI, so Phase 14 should prefer inline SVG or lightweight CSS charting.

## Recommended Scope Decision

Implement Phase 14 in three linked passes:

1. Add authoritative labor analytics counters and month-to-date aggregation.
2. Expand the labor dialog with an analysis view, role breakdown, and suggestion engine.
3. Add a forecast headcount chart based on accepted-contract freight volume under ideal KPI conditions.

This keeps the feature vertically integrated while avoiding a giant reporting rewrite.

## Core Design Decisions

### 1. Extend The Existing Labor Dialog

Recommended first version:

- keep the current labor entry point
- add two views inside the same modal:
  - `Assignments`
  - `Analysis`

This avoids introducing a second overlapping labor modal and keeps staffing controls close to the analysis they inform.

### 2. Use Month-To-Date As The Primary Analysis Window

For the first implementation, the labor analysis should be based on current month-to-date metrics plus live current-state context.

Reasons:

- monthly planning is already a core cadence in FreightFlow
- profitability and staffing decisions are already framed monthly
- current-month aggregation is easier to explain than arbitrary rolling windows
- this avoids needing a large new time-series subsystem in the first pass

### 3. Treat Support Roles As Estimated Attribution

Load, pick, storage, unload, and switch driver can be measured directly from completed work.

Sanitation and management need estimated attribution because they support site performance rather than moving discrete cube directly.

Recommended rule:

- direct roles use actual processed work
- support roles use attributed throughput tied to total facility throughput and modifier influence
- UI labels support-role throughput metrics as estimated so players are not misled

### 4. Keep The Chart Dependency-Free

Because the project does not currently use a chart library, the forecast graph should use:

- inline SVG
- or a simple CSS bar chart

This keeps the feature lightweight and stylistically consistent with the existing React HUD/dialog surfaces.

## Proposed Simulation Model

Add a lightweight analysis branch that stores month-to-date counters rather than per-tick raw history.

Suggested direction:

```ts
export interface LaborRoleAnalytics {
  roleId: LaborRole;
  directCubicFeetProcessed: number;
  attributedCubicFeetProcessed: number;
  completedTaskCount: number;
  totalTaskTicks: number;
  totalLaborCost: number;
  totalHeadcountTicks: number;
  activeHeadcountTicks: number;
}

export interface LaborAnalyticsSummary {
  monthKey: string;
  lastResetTick: number;
  roles: LaborRoleAnalytics[];
}
```

Recommended placement:

- nested under `state.labor`
- or a new `state.laborAnalytics` branch if separation is cleaner

Recommended scope choice:

Keep it adjacent to `LaborState`, but distinct from real-time staffing pools so the current labor runtime model stays focused.

## Metric Definitions

The dialog should be explicit about how each metric is computed.

Recommended role metric formulas:

- `total cube processed`
  - direct roles: actual cube or trailer cube completed by that role this month
  - support roles: attributed supported throughput this month

- `average throughput cube processed per head`
  - `processedCube / averageAssignedHeadcount`
  - where `averageAssignedHeadcount = totalHeadcountTicks / ticksElapsedInWindow`

- `cost per throughput cube`
  - `totalLaborCost / max(processedCube, 1)`

- `average task ticks`
  - `totalTaskTicks / max(completedTaskCount, 1)`

- `total labor cost per tick`
  - `totalLaborCost / ticksElapsedInWindow`

Recommended UI note:

- mark sanitation and management throughput metrics as estimated
- show `--` instead of fake precision when a role truly has no meaningful completed work yet

## Role Instrumentation Plan

The current simulation already has clear processing systems. Instrument them where work completes.

Recommended direct-role instrumentation:

- `SwitchDriverSystem`
  - record completed trailer moves
  - attribute trailer cubic feet moved when a trailer reaches its destination

- `UnloadSystem`
  - record unloaded cubic feet
  - record unload task duration from unload start to unload completion

- `StorageSystem`
  - record stored cubic feet
  - record storage task duration from dock-ready to successful putaway

- `PickSystem`
  - record picked cubic feet
  - record pick task duration from order-ready to pick completion

- `LoadSystem`
  - record loaded cubic feet
  - record load task duration from trailer-ready-to-load to shipment-ready completion

Recommended support-role instrumentation:

- `Sanitation`
  - attribute supported throughput from facility throughput during ticks when sanitation headcount is active
  - record support-cycle ticks using daily or continuous support windows

- `Management`
  - attribute supported throughput from facility throughput during ticks when management headcount is active
  - record support-cycle ticks similarly

Important note:

Support-role task duration should be presented as an estimated support-cycle average, not as if sanitation and management were processing discrete freight batches.

## Cost Attribution Plan

Labor cost attribution should reuse the same wage assumptions already reflected in the economy system.

Recommended first-pass approach:

- each tick, add the role’s per-tick labor cost into its month-to-date analytics counter
- use assigned headcount and existing labor-cost formulas to keep analysis aligned with finance

This gives the player a role-by-role operational cost view without building a separate payroll model.

## Profitability Summary And Suggestion Engine

The dialog should open with a short whole-labor summary before the detailed role breakdown.

Recommended summary outputs:

- total labor cost this month
- labor cost per throughput cube this month
- most strained labor role
- most expensive role by month-to-date spend
- lowest-efficiency productive role
- forecast staffing gap versus accepted-contract demand

Recommended suggestion format:

- cap at 3 suggestions at a time
- use short plain-language boilerplate
- tie each suggestion to a simulation-authored condition

Suggested rule examples:

- high inbound queue or dock freight plus strained unload role
  - "Look into adding more unloader labor."

- high dock freight plus strained storage role
  - "Storage crews are behind. More storage labor should improve dock turnover."

- rising pick queue or blocked outbound orders plus strained pick role
  - "Outbound picking is falling behind. Consider increasing pick labor."

- high load queue plus strained load role
  - "Outbound trailers are waiting on loading. More loaders may protect revenue."

- repeated switch backlog plus strained switch drivers
  - "Yard and dock movement is constrained. Add switch-driver coverage."

- sanitation pressure below target with falling condition/safety
  - "Sanitation support is light. A small increase may stabilize condition and safety."

- management pressure low while multiple productive roles are strained
  - "Coordination is stretched across several teams. More management support could improve overall flow."

- negative monthly net while one or more roles are underutilized
  - "Labor spend is outpacing current throughput. Rebalance underused roles before expanding headcount."

Recommended scope choice:

Use a selector-driven suggestion engine, not event spam or a new alert family.

## Forecast Headcount Model

The chart should answer:

"If accepted contracts perform at their forecasted freight volume under ideal KPI conditions, how many people should each labor role need?"

Recommended forecast inputs:

- all `activeContracts`
- each contract’s `expectedMonthlyThroughputCubicFeet`
- freight class mix from accepted contracts
- current role base rates
- ideal KPI profile:
  - morale 100
  - condition 100
  - safety 100
  - client satisfaction 100
  - customer satisfaction 100
  - no coordination penalty
  - no congestion penalty
  - full productivity multiplier at best supported value

Recommended forecast outputs per role:

- current assigned headcount
- expected ideal headcount
- surplus or shortfall

Recommended conversion rules:

- unload and storage headcount derive from expected inbound monthly cube
- pick and load headcount derive from expected outbound monthly throughput
- switch-driver headcount derives from expected trailer movements, using a forecast cube-per-trailer assumption
- sanitation and management headcount derive from total productive headcount bands or configurable staffing ratios

This gives the player a staffing target grounded in contract volume, while explicitly assuming ideal KPI conditions instead of current operational friction.

## Forecast Chart Plan

Recommended first version:

- show one horizontal bar per labor role
- include:
  - current assigned headcount
  - ideal forecast headcount
  - difference label such as `+2 needed` or `1 over`

Recommended rendering:

- inline SVG bar chart
- current staffing in one neutral color
- forecast staffing in a second accent color
- shortfall highlight when forecast exceeds current

Recommended placement inside the analysis view:

- below the summary and suggestions
- above the detailed per-role metric table/cards

This keeps the player oriented: first the big picture, then the target, then the detail.

## UI Plan

Recommended labor dialog structure:

- header
  - dialog title
  - current month label
  - close button
- segmented control or tab buttons
  - `Assignments`
  - `Analysis`
- analysis view sections
  - labor summary
  - suggestion cards
  - forecast headcount chart
  - per-role analysis list or compact table

Recommended role card/table contents:

- role name
- assigned headcount
- pressure label
- cost per throughput cube
- average cube processed per head
- total cube processed
- average task ticks
- labor cost per tick
- note when metrics are estimated for support roles

Recommended accessibility note:

- the chart should include textual labels and not rely on color alone
- summary suggestions should remain readable without opening tooltips

## Selector And Service Plan

Recommended new selectors:

- `selectLaborAnalysisSummary`
- `selectLaborAnalysisRoles`
- `selectLaborAnalysisSuggestions`
- `selectLaborForecastHeadcountChart`

Recommended small services/helpers:

- `LaborAnalyticsRecorder`
  - updates month-to-date counters from simulation systems

- `LaborForecastService`
  - converts accepted-contract volume into ideal-role headcount targets

- `LaborSuggestionService`
  - turns summary conditions into a short ordered suggestion list

Recommended scope choice:

Keep the forecast math and suggestion rules in plain TypeScript helpers so they are easy to test and tune.

## Monthly Reset And Persistence Considerations

Recommended first-pass behavior:

- labor analytics counters are month-to-date
- counters reset when a new monthly planning cycle opens
- save/load preserves the active month’s current analytics snapshot

This gives continuity within the month without introducing unnecessary historical storage.

If later needed, this can expand into weekly/monthly labor history, but that is outside the first implementation.

## Config Considerations

Recommended optional config additions:

- support-role staffing ratios for sanitation and management
- forecast cube-per-trailer assumptions for switch-driver estimation
- suggestion thresholds for when a role becomes recommendation-worthy

Recommended scope choice:

Start with centralized TypeScript constants if the formulas are still moving quickly, then move them to config once tuning stabilizes.

## UI/UX Notes

The labor analysis should answer:

- Which roles are costing the most right now?
- Which roles are producing the least throughput for their cost?
- Which bottleneck is hurting profitability first?
- How far is current staffing from ideal contract-driven demand?
- What simple staffing move should I try next?

Avoid:

- giant dense tables with no interpretation
- fake precision on estimated support-role metrics
- a graph that is visually rich but not decision-useful

## Test Plan

Add focused tests for:

- role analytics counters update when direct-role work completes
- support-role attributed throughput remains bounded and non-negative
- cost-per-cube and cube-per-head calculations handle zero-work cases safely
- average task-tick calculations match recorded completion durations
- month rollover resets the analysis window correctly
- save/load preserves current labor analytics state
- suggestion rules produce the right boilerplate for common bottlenecks
- accepted-contract forecast headcount calculations stay within expected ranges
- chart selectors return all seven labor roles in stable order
- labor dialog analysis view renders both direct and estimated support-role metrics

Run:

```powershell
npm run test
npm run build
```

## Manual Validation Plan

After implementation:

- open the labor dialog and confirm the new analysis view is reachable
- verify each labor role displays all requested metrics
- create an unload bottleneck and confirm the dialog suggests more unload labor
- create a pick or load bottleneck and confirm the matching suggestion appears
- verify sanitation and management show estimated support metrics with clear labeling
- accept contracts with higher forecast volume and confirm the forecast headcount chart rises accordingly
- compare current staffing against the forecast bars and verify shortfalls are readable
- save and reload mid-month and confirm labor analysis values are preserved

## Suggested Implementation Order

1. Define month-to-date labor analytics data structures.
2. Instrument direct labor systems to record processed cube, task counts, and task durations.
3. Add support-role attribution logic for sanitation and management.
4. Tie labor cost accumulation into role analytics using existing finance assumptions.
5. Reset labor analytics on monthly rollover and preserve them through save/load.
6. Create summary, role-breakdown, suggestion, and forecast selectors.
7. Implement accepted-contract forecast headcount formulas for all roles.
8. Extend `LaborDialog` with `Assignments` and `Analysis` views.
9. Add the forecast chart and role breakdown UI.
10. Add tests for metrics, forecast math, suggestions, reset behavior, and rendering.
11. Run test/build/manual validation.
12. Update `memory-bank/progress.md` when implementation is complete.

## Risks And Mitigations

- Risk: direct-role metrics are easy, but support-role metrics feel fake.
  - Mitigation: label support-role throughput and task metrics as estimated and keep the formulas simple and bounded.

- Risk: task-duration instrumentation becomes invasive across several systems.
  - Mitigation: record metrics at existing work-completion boundaries rather than inventing a full task object framework.

- Risk: the chart implies exact staffing truth.
  - Mitigation: label it as an ideal-KPI forecast and show current-versus-ideal comparison instead of pretending it is a precise requirement.

- Risk: suggestions become noisy or repetitive.
  - Mitigation: cap suggestions, prioritize by operational severity, and avoid surfacing more than the top few recommendations.

- Risk: the analysis dialog becomes overcrowded.
  - Mitigation: keep the existing assignment flow intact and split the modal into `Assignments` and `Analysis`.

## Review Questions

- Should the labor analysis stay month-to-date only in the first pass, or do you want a rolling 7-day view as well?
- Do you want the forecast chart to use only accepted contracts, or accepted contracts plus the baseline general-freight contract?
- Should sanitation and management show estimated throughput with an explicit badge, or would you rather replace those fields with support-specific metrics?
- Do you want the labor analysis accessible only from the labor dialog, or also from a shortcut in the right HUD panel later?

## Recommended Scope Decision

For the first implementation:

- extend the existing labor dialog rather than creating a separate modal
- use current month-to-date labor analytics
- show all seven labor roles in one analysis surface
- keep sanitation and management metrics estimated but clearly labeled
- build the forecast graph with inline SVG or simple CSS bars
- base forecast headcount on accepted-contract volume under ideal KPI assumptions

## Completion Criteria

Phase 14 is complete when:

- the player can open a labor analysis view from the current labor workflow
- all seven labor roles display the requested labor metrics
- the dialog includes a short labor summary and profitability-oriented suggestions
- suggestions respond to real labor and queue conditions
- the dialog shows a readable expected-headcount chart based on accepted-contract forecasts
- current staffing can be visually compared against ideal forecast staffing
- `npm run test` and `npm run build` pass
- `memory-bank/progress.md` can be updated from a completed implementation
