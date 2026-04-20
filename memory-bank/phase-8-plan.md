# Phase 8: Core Scores And Economy

## Summary

Phase 8 introduces the first playable economy and score layer on top of the Phase 5-7 freight and labor loop. The goal is not deep financial simulation yet; it is visible cause and effect. Throughput should earn revenue, labor should create costs, poor operational pressure should degrade scores, and critical score thresholds should create actionable alerts.

The simulation remains authoritative. Systems update `GameState`; React renders selectors and dispatches commands; Phaser does not own economy, score, or alert rules.

## Player-Facing Goals

- Cash changes over time as freight ships and labor costs accrue.
- Throughput, revenue, labor cost, and net operating result are visible.
- Morale, condition, safety, client satisfaction, and customer satisfaction move in response to real operational conditions.
- Critical failures create clear alerts.
- Players can connect labor, congestion, storage problems, and queue pressure to business outcomes.

## Scope Decisions

- Keep formulas simple, centralized, and easy to tune.
- Treat Phase 8 as the first economic vertical slice, not final balancing.
- Use existing `freightClasses.json` `baseRevenuePerCubicFoot` for revenue.
- Add baseline contract/client state because `contracts.json` and `clientProfiles.json` are currently empty.
- Deeper monthly budget controls remain Phase 9, but Phase 8 should prepare state fields for payroll, maintenance, training, safety, and operations spending.
- Economy updates should be deterministic and testable.

## State Model

Add or expand state for the following domains.

```ts
interface EconomyState {
  lifetimeRevenue: number;
  lifetimeLaborCost: number;
  lifetimeOperatingCost: number;
  lifetimeNet: number;
  currentMonthRevenue: number;
  currentMonthLaborCost: number;
  currentMonthOperatingCost: number;
  currentMonthNet: number;
  revenuePerTick: number;
  laborCostPerTick: number;
  operatingCostPerTick: number;
  lastRevenueTick: number | null;
}
```

```ts
interface ScoreState {
  morale: ScoreMetric;
  condition: ScoreMetric;
  safety: ScoreMetric;
  clientSatisfaction: ScoreMetric;
  customerSatisfaction: ScoreMetric;
}

interface ScoreMetric {
  value: number;
  trend: "rising" | "stable" | "falling";
  drivers: ScoreDriver[];
}

interface ScoreDriver {
  label: string;
  impact: number;
}
```

```ts
interface ContractState {
  activeContracts: ContractSummary[];
  serviceLevel: number;
  missedDemandCubicFeet: number;
  fulfilledDemandCubicFeet: number;
}
```

```ts
interface AlertState {
  alerts: Alert[];
  nextAlertSequence: number;
}
```

Keep existing `kpis` fields, but expand them only where needed.

Recommended additions:

- `revenue`
- `laborCost`
- `operatingCost`
- `netOperatingResult`
- `moraleScore`
- `conditionScore`
- `clientSatisfactionScore`
- `customerSatisfactionScore`

The existing `safetyScore` should remain compatible.

## Finance System

Implement `FinanceSystem`.

Revenue:

- Revenue is earned when outbound shipments complete.
- Use each completed freight batch's `freightClassId` and `cubicFeet`.
- Revenue formula:

```text
batch cubic feet * freight class baseRevenuePerCubicFoot * satisfaction multiplier
```

- Satisfaction multiplier should be simple for Phase 8:

```text
0.85 at very low satisfaction
1.00 near neutral/healthy
1.10 at very high satisfaction
```

- Avoid double-counting revenue by tracking whether a completed batch/order has already been paid. Options:
  - add `revenueRecognizedTick` to outbound orders, or
  - keep an internal processed shipment id set in economy state.

Recommendation: add explicit state fields to outbound orders so save/load later remains straightforward.

Costs:

- Labor cost accrues each tick from assigned headcount.
- Suggested starting formula:

```text
assigned headcount * laborCostPerWorkerPerTick
```

- Use a constant first, such as `2` cash per worker per tick.
- Add operating cost from support pressure:

```text
base facility cost per tick + condition penalty + safety penalty
```

- Keep budget-specific costs simple until Phase 9.

Cash:

- Cash increases from recognized revenue.
- Cash decreases from labor and operating costs.
- Current month and lifetime totals update together.

## KPI Service

Refactor KPI updates out of `SimulationRunner.updateFreightKpis()` into `KPIService`.

Responsibilities:

- calculate inbound cubic feet
- calculate outbound cubic feet
- calculate throughput cubic feet
- copy economy totals into KPI fields
- copy score values into KPI fields
- keep one source of truth for the HUD/KPI strip

`SimulationRunner` should call `KPIService.update(state)` after freight, labor, score, and finance systems run.

## Condition System

Implement `ConditionSystem`.

Inputs:

- sanitation pressure from Phase 7 labor
- storage utilization
- invalid storage zones
- dock/storage/pick/load queue pressure
- congestion penalty from labor modifiers

Simple formula:

```text
condition delta =
  sanitation recovery
  - congestion wear
  - invalid zone penalty
  - over-utilization penalty
```

Clamp condition to `0..100`.

Effects:

- Low condition should reduce effective operational quality in later phases.
- For Phase 8, it should influence safety, morale, and satisfaction.

## Morale System

Implement `MoraleSystem`.

Inputs:

- critical labor bottlenecks
- strained workload pressure
- management pressure
- safety score
- condition score
- cash stress, if cash falls below a threshold

Simple formula:

```text
morale delta =
  management support
  + stable workload bonus
  - critical bottleneck penalty
  - low condition penalty
  - low safety penalty
```

Clamp morale to `0..100`.

## Safety System

Implement `SafetySystem`.

Inputs:

- condition score
- sanitation pressure
- labor pressure
- queue congestion
- management pressure

Simple formula:

```text
safety delta =
  management support
  + stable workload bonus
  - congestion penalty
  - low condition penalty
  - critical labor pressure penalty
```

Clamp safety to `0..100`.

Incident events can wait unless easy, but alerts should fire when safety crosses critical thresholds.

## Satisfaction System

Implement `SatisfactionSystem`.

Client satisfaction:

- Tracks the business/client view of reliability and capacity.
- Inputs:
  - throughput stability
  - storage capacity pressure
  - dock storage-needs diagnostics
  - queue bottlenecks
  - condition score

Customer satisfaction:

- Tracks end-service quality.
- Inputs:
  - outbound order delays
  - blocked outbound orders
  - load queue pressure
  - safety score
  - condition score

Clamp both to `0..100`.

## Contract System Baseline

Implement a minimal `ContractSystem` even if config is empty.

Baseline contract:

```text
id: baseline-general-freight
targetThroughputCubicFeetPerDay: simple target derived from inbound generation rate
minimumServiceLevel: 80
```

Track:

- fulfilled demand cubic feet
- missed or delayed demand cubic feet
- service level
- contract health label

This does not need a full contract marketplace. It just gives satisfaction and alerts a stable business target.

## Alert System

Implement actionable alerts from score/economy thresholds.

Alert examples:

- `Cash is running low`
- `Morale is critical`
- `Safety is declining`
- `Warehouse condition is critical`
- `Customer satisfaction is falling`
- `Client service level is below target`

Rules:

- Avoid creating duplicate alerts every tick.
- Use stable alert keys.
- Resolve or hide alerts when conditions recover.
- Alerts should include severity: `info`, `warning`, `critical`.

## Selectors

Add or extend selectors:

- `selectEconomySummary(state)`
- `selectScoreSummary(state)`
- `selectFinanceBreakdown(state)`
- `selectConditionDetails(state)`
- `selectSatisfactionSummary(state)`
- `selectContractSummary(state)`
- `selectActiveAlerts(state)`
- `selectCriticalAlertCount(state)`

Selectors should expose driver breakdowns so UI wording can explain causes.

## UI Work

Top HUD:

- show cash
- show throughput
- show morale
- show safety
- show condition
- show alert count or critical alert count

Bottom KPI bar:

- show revenue
- show labor cost
- show net operating result
- show client/customer satisfaction if space allows

Right operations panel:

- add economy summary
- add score summary with top drivers
- add contract/service-level summary
- keep labor and dock diagnostics visible but avoid turning the panel into a wall of numbers

Alerts center:

- render active alerts from simulation state
- show severity
- show short actionable message

No deep planning/budget modal yet; that belongs in Phase 9.

## Events

Add events only where they provide useful debug or alert boundaries:

- `revenue-recognized`
- `cash-low`
- `score-threshold-crossed`
- `alert-raised`
- `alert-resolved`
- optional `contract-service-level-changed`

Avoid event spam; threshold events should fire only when crossing a boundary.

## Test Plan

Add or extend Vitest coverage for:

- revenue is recognized exactly once for completed outbound shipments
- revenue uses freight class `baseRevenuePerCubicFoot`
- cash increases from shipment revenue
- labor cost decreases cash over ticks
- operating cost decreases cash over ticks
- current month and lifetime economy totals update together
- KPI service reports inbound, outbound, throughput, revenue, cost, and net
- condition declines under sanitation/congestion pressure
- condition recovers or stabilizes with adequate sanitation
- morale declines under critical labor pressure
- management support improves or stabilizes morale pressure
- safety declines under poor condition/congestion
- client satisfaction responds to blocked dock/storage pressure
- customer satisfaction responds to blocked orders or outbound delays
- baseline contract service level changes with throughput
- alerts are raised when cash, morale, safety, condition, or satisfaction cross thresholds
- duplicate alerts are not emitted every tick
- alerts resolve or deactivate when the condition recovers, if implemented
- selectors return score drivers and finance summaries

Keep the existing Phase 5-7 tests green.

## Validation

Run:

```powershell
npm run test
npm run build
```

Manual browser check:

- run the simulation with default labor and confirm cash changes over time
- complete outbound shipments and verify revenue appears
- over-stress labor or storage and verify morale/condition/satisfaction pressure appears
- understaff sanitation and verify condition pressure becomes visible
- create a critical score or low cash scenario and verify alerts appear
- confirm top HUD, bottom KPI bar, right panel, and alerts center stay readable
- confirm normal freight flow still completes when labor and storage are adequate

## Implementation Order

1. Add economy, score, contract, and alert state models to `GameState`.
2. Add config constants or minimal balancing data for revenue multipliers, labor cost, operating cost, and score thresholds.
3. Implement `FinanceSystem` with shipment revenue recognition and recurring costs.
4. Implement `KPIService` and move freight KPI calculation out of `SimulationRunner`.
5. Implement `ConditionSystem`.
6. Implement `MoraleSystem`.
7. Implement `SafetySystem`.
8. Implement `SatisfactionSystem`.
9. Implement baseline `ContractSystem`.
10. Implement `AlertSystem` with stable alert keys and threshold handling.
11. Wire systems into `SimulationRunner` in a deterministic order.
12. Add selectors for economy, scores, contracts, and alerts.
13. Update HUD, KPI bar, right panel, and alerts center.
14. Add/extend tests.
15. Run test/build validation.
16. Perform manual browser validation.
17. Update `memory-bank/progress.md` with Phase 8 completed work.

## Proposed System Order

Run systems in this order each tick:

1. freight generation and freight processing
2. labor workload and pressure recalculation
3. condition update
4. morale update
5. safety update
6. satisfaction update
7. contract update
8. finance update
9. KPI update
10. alert update

Finance should run after satisfaction so revenue can use the current satisfaction multiplier. Alerts should run after all scores and economy fields settle for the tick.

## Assumptions

- Phase 8 should make scores meaningful but not perfectly balanced.
- Budget sliders, monthly planning pages, and headcount purchasing belong in Phase 9.
- Contracts can start as a single baseline service target while config remains empty.
- Score trends can be simple previous-value comparisons.
- Alerts should be actionable and sparse; noisy alerts are worse than missing minor warnings.
- Existing Phase 7 labor pressure is the main input for morale, safety, condition, and satisfaction.

