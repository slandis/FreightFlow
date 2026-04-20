# Revenue System Analysis

Revenue is currently recognized only when an outbound order reaches `complete`. Inbound unloading and storage do not directly earn money yet.

The main logic lives in `src/game/simulation/systems/FinanceSystem.ts`.

## Current Flow

1. Freight is unloaded, stored, picked, then loaded onto an outbound trailer.
2. When loading finishes, `LoadSystem` sets:
   - `order.state = "complete"`
   - `trailer.state = "complete"`
   - outbound shipped volume metrics are increased
   - a `shipment-completed` event is emitted
3. Later in the same simulation tick, `FinanceSystem.update()` runs and looks for completed outbound orders whose revenue has not already been recognized.

## Revenue Formula

For each completed, unrecognized outbound order:

```ts
revenue += batch.cubicFeet * freightClassBaseRate * satisfactionMultiplier
```

Revenue is summed across all freight batches attached to that completed outbound order.

## Freight Class Rates

Freight class revenue rates come from `src/data/config/freightClasses.json`.

| Freight Class | Revenue Per Cubic Foot |
| --- | ---: |
| `standard` | `$0.30` |
| `fast-turn` | `$0.38` |
| `bulk` | `$0.24` |
| `oversize` | `$0.42` |
| `special-handling` | `$0.50` |

## Satisfaction Multiplier

Revenue is adjusted by average client/customer satisfaction.

| Average Satisfaction | Multiplier |
| --- | ---: |
| Below `50` | `0.85x` |
| `50` through below `90` | `1.00x` |
| `90` or higher | `1.10x` |

The multiplier is calculated from:

```ts
(state.scores.clientSatisfaction.value + state.scores.customerSatisfaction.value) / 2
```

## Double-Counting Protection

Once revenue is recognized, the order records:

```ts
order.revenueRecognizedTick = state.currentTick;
order.recognizedRevenue = orderRevenue;
```

Future finance ticks skip any completed order with a non-null `revenueRecognizedTick`, so the same completed order cannot pay out again.

There is test coverage for this in `src/tests/simulation/EconomyScores.test.ts`. The test uses `900` cubic feet of standard freight at `$0.30` per cubic foot, producing `$270`, then confirms the next tick does not add another `$270`.

## Cash And Economy Updates

Each tick, finance also applies costs:

```ts
cash += revenue - laborCost - operatingCost
```

Labor cost is currently:

```ts
assignedHeadcount * 2
```

Operating cost is:

```ts
20
  + conditionPressure * 0.1
  + Math.max(0, 100 - conditionScore) * 0.05
  + Math.max(0, 100 - safetyScore) * 0.05
```

Revenue is accumulated into:

- `state.economy.lifetimeRevenue`
- `state.economy.currentMonthRevenue`
- `state.economy.revenuePerTick`
- `state.economy.lastRevenueTick`

Then `KPIService` copies current-month revenue into `state.kpis.revenue` for display.

## Current Limits

The design documents mention richer modifiers like contract modifiers, safety modifiers, budgets, incident costs, and deeper monthly planning effects.

Right now, revenue is simpler:

```ts
completed outbound freight volume
  * freight-class rate
  * satisfaction multiplier
```

Safety and condition affect operating cost, but they do not directly affect the revenue multiplier yet.
