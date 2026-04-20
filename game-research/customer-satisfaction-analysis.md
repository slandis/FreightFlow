# Customer Satisfaction Analysis

Customer satisfaction is currently driven by the `updateCustomerSatisfaction()` branch inside `src/game/simulation/systems/SatisfactionSystem.ts`.

It starts at `82` in `createInitialScoreState()` in `src/game/simulation/core/GameState.ts`.

Customer satisfaction changes every simulation tick after queues, labor, condition, morale, and safety have updated.

## Current Flow

1. `QueueManager` updates freight queue summaries.
2. Labor pressure is recalculated.
3. Condition, morale, and safety update.
4. `SatisfactionSystem.update()` runs.
5. `updateCustomerSatisfaction()` calculates a delta.
6. `updateScore()` applies the delta, clamps the score to `0..100`, sets the trend, and records active drivers.
7. `KPIService` copies `state.scores.customerSatisfaction.value` into `state.kpis.customerSatisfactionScore`.

## Current Customer Satisfaction Drivers

### Baseline Shipment Service

Every tick starts with a small positive drift:

```ts
+0.03
```

This represents basic service recovery when no major outbound problems are active.

### Blocked Outbound Orders

The system counts outbound orders where:

```ts
order.state === "blocked"
```

Penalty:

```ts
-Math.min(0.8, blockedOrders * 0.25)
```

Each blocked order costs `-0.25` per tick, capped at `-0.8`.

Blocked orders are created by `PickSystem` when an order cannot reserve enough matching stored inventory. The current blocked reason is:

```ts
"Inventory unavailable"
```

### Overdue Outbound Orders

The system counts outbound orders where:

```ts
order.state !== "complete" && order.dueTick < state.currentTick
```

Penalty:

```ts
-Math.min(0.8, overdueOrders * 0.25)
```

This includes any incomplete overdue order, including open, picking, picked, loading, or blocked orders.

### Load Queue Pressure

If outbound load work is waiting, customer satisfaction drops.

The queue comes from outbound orders in `picked` or `loading` states, using their `remainingLoadCubicFeet`.

Penalty:

```ts
-Math.min(0.4, loadQueueCubicFeet / 5000)
```

### Safety Score

If safety is below `75`, customer satisfaction gets a penalty:

```ts
-((75 - safety) / 75) * 0.35
```

Bad safety indirectly affects customers.

### Warehouse Condition

If warehouse condition is below `70`, customer satisfaction gets a penalty:

```ts
-((70 - condition) / 70) * 0.25
```

Poor condition indirectly affects customer satisfaction.

## Score Application

All customer satisfaction drivers are summed into a single per-tick delta.

`updateScore()` then:

- adds the delta to the previous value
- clamps the score to `0..100`
- sets the trend to `rising`, `stable`, or `falling`
- stores non-zero drivers for UI explanations

## Important Distinction

Customer satisfaction and client satisfaction are separate scores.

Customer satisfaction is currently outbound-service focused. It is driven by:

- blocked outbound orders
- overdue outbound orders
- loading backlog
- safety
- warehouse condition

Client satisfaction is the score that currently responds to contract/service-level pressure.

## Current Limits

Customer satisfaction is not directly driven by:

- revenue
- inbound freight service
- contract health
- explicit customer complaints
- safety incidents
- delivery appointment windows beyond the simple due-tick check

Those richer mechanics are still future design space.
