# Safety Score Analysis

The current safety score is driven by `SafetySystem` once per simulation tick. It is not a manually edited KPI; the HUD KPI mirrors `state.scores.safety.value`.

## Core Flow

1. The simulation recalculates labor and queue state.
2. `ConditionSystem`, `MoraleSystem`, then `SafetySystem` run.
3. `SafetySystem` builds a per-tick delta from operational drivers.
4. `updateScore` applies the delta, clamps safety to `0..100`, sets the trend, and stores the visible driver list.
5. `KPIService` copies that safety value into the displayed KPI.

The main implementation is in `src/game/simulation/systems/SafetySystem.ts`.

Safety currently starts at `90`, from `createInitialScoreState()` in `src/game/simulation/core/GameState.ts`.

## Current Safety Drivers

### Management Coverage

Healthy management gives a small positive safety gain:

```ts
+0.05
```

Strained management applies:

```ts
-0.2
```

Critical management applies:

```ts
-0.45
```

This comes from labor support-role pressure.

### Warehouse Condition

If condition is below `70`, safety declines.

Formula:

```ts
-((70 - condition) / 70) * 0.5
```

Poor warehouse condition gradually drags safety down.

### Sanitation Coverage

Healthy sanitation has no direct safety penalty.

Strained sanitation applies:

```ts
-0.2
```

Critical sanitation applies:

```ts
-0.5
```

### Critical Labor Bottlenecks

Each critical labor bottleneck applies:

```ts
-0.25
```

This means safety drops when operational roles are badly understaffed or unable to keep up.

### Congestion Risk

Congestion risk is calculated from yard trailers, unload trailers, storage queue volume, pick queue volume, and load queue volume.

Formula:

```ts
yardTrailers * 0.08
  + unloadTrailers * 0.08
  + storageQueueCubicFeet / 5000
  + pickQueueCubicFeet / 5000
  + loadQueueCubicFeet / 5000
```

Safety impact is capped:

```ts
-Math.min(0.4, queuePressure * 0.12)
```

## Score Application

`updateScore` applies the delta, clamps the result to `0..100`, and sets the trend to `rising`, `stable`, or `falling`.

The score also keeps a driver list, which is used by UI summaries to explain why scores are moving.

## Player Visibility

Safety is displayed through the KPI system after `KPIService` copies `state.scores.safety.value` into `state.kpis.safetyScore`.

Low safety also participates in alert generation:

- safety below `50` raises a warning
- safety below `35` raises a critical alert

## Current Limits

The design documents mention future safety budget, training, and safety incident probability. Those are not implemented as active mechanics yet.

In the current build, safety is mostly an abstract operational-health score driven by:

- labor support coverage
- warehouse condition
- critical bottlenecks
- operational congestion
