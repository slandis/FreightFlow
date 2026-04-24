# Budgeting Reference

This document explains what each Budgeting line item actually does in the current FreightFlow implementation, how it affects game scores, and why `Client` and `Customer` can still collapse even when most budget values are left at the default `5`.

## Core Rule

Budget points mostly do not feed `Client` or `Customer` directly.

Instead, budget lines usually affect one of these intermediate systems:

- labor productivity
- congestion and condition pressure
- safety
- condition
- morale
- cash burn

`Client` and `Customer` then react to the operational outcomes created by those systems.

## Default Budget Values

The default monthly plan starts with:

- `maintenance: 5`
- `training: 5`
- `safety: 5`
- `operationsSupport: 5`
- `inventorySupport: 5`
- `contingency: 0`

Each budget point costs cash every tick.

Current live cost:

- `0.01` cash per point per tick

So a default budget total of `25` points costs:

- `0.25` cash per tick

That is operating spend, not a score bonus by itself.

## Recommended Budget Ranges

These ranges are based on the current live formulas and hard caps.

### Quick Table

| Line Item | Low / Lean | Typical Working Range | High Useful Range | Hard Cap Value | Notes |
| --- | --- | --- | --- | --- | --- |
| `maintenance` | `5-8` | `8-14` | `15-18` | `18` | Above `18` gives no extra effect |
| `training` | `5` | `8-14` | `15-20` | `20` | `5` gives no bonus at all |
| `safety` | `5-8` | `8-12` | `13-15` | `15` | Above `15` gives no extra effect |
| `operationsSupport` | `4-6` | `6-12` | `13-20` | `20` | Best when congestion is the real issue |
| `inventorySupport` | `0-5` | `5-10` | `10-20` | `20` | Match to forecast recommendation first |
| `contingency` | `0` | `0` | `0` | none | No current gameplay benefit |

### Practical Guidance

- `maintenance`
  - run `8-14` for normal play
  - push toward `15-18` only if condition is a recurring problem
- `training`
  - leave at `5` only if cash is tight and throughput is already comfortable
  - `8-14` is the most generally useful range
  - above `20` is wasted
- `safety`
  - `8-12` is a good operating range
  - push toward `15` if safety keeps dragging morale or customer satisfaction
- `operationsSupport`
  - treat this as a congestion-relief lever
  - if the floor is flowing cleanly, keep it modest
  - if queues and sanitation pressure are compounding, move it up
- `inventorySupport`
  - do not treat this like a fixed always-on target
  - match the forecast recommendation first
  - extra points above the needed recommendation do not create extra condition or morale benefit
- `contingency`
  - keep at `0` until the game gives it a real mechanic

### Where Extra Points Stop Helping

- `maintenance`
  - caps at `18`
- `training`
  - caps at `20`
- `safety`
  - caps at `15`
- `operationsSupport`
  - caps at `20`
- `inventorySupport`
  - caps at `20`
- `contingency`
  - no current effect at any value

There is no current benefit to pushing any budget line above `25`, and most lines stop helping well before that.

## How Scores Are Actually Driven

### Condition

`Condition` is directly improved or damaged by several budget-linked systems.

Direct budget-linked drivers:

- `Maintenance budget`
  - adds `budget.maintenance * 0.02`
  - capped at `0.35`
- `Inventory support budget`
  - only matters when active non-baseline contracts create an inventory-support recommendation
  - fully funded inventory support adds `+0.04`
  - underfunded inventory support can subtract up to `0.28`, scaled by difficulty

Non-budget drivers that often matter more:

- sanitation understaffed
- congestion pressure
- invalid storage zones
- storage utilization above `85%`
- storage, pick, and load queue pressure

### Safety

`Safety` is directly affected by the `Safety` line item.

Direct budget-linked driver:

- `Safety budget`
  - adds `budget.safety * 0.02`
  - capped at `0.30`

Other important drivers:

- management pressure
- condition below `70`
- sanitation pressure
- critical labor bottlenecks
- congestion risk from queues and trailers

### Morale

`Morale` has no broad direct bonus from most budget lines, but `Inventory Support` can hurt it if the operation is forecast-heavy and the role is underfunded.

Budget-linked morale effect:

- `Inventory support underfunded`
  - negative only when inventory support is recommended and budget coverage is below target

Other major morale drivers:

- management understaffed
- inventory team understaffed
- critical bottlenecks
- strained workload
- condition below `60`
- safety below `70`
- cash below `25,000`

### Client Satisfaction

`Client` does not read the budget plan directly.

It reacts to:

- dock storage pressure
- a critical labor bottleneck
- condition below `70`
- contract service level below `80`

This means budgeting only helps `Client` if it improves operations enough to:

- keep condition up
- reduce labor pressure
- maintain enough throughput to hold service level

### Customer Satisfaction

`Customer` also does not read the budget plan directly.

It reacts to:

- blocked outbound orders
- overdue outbound orders
- load queue pressure
- safety below `75`
- condition below `70`

This means budgeting only helps `Customer` if it improves:

- outbound flow
- safety
- warehouse condition

## Line-By-Line Breakdown

## Maintenance

What it does:

- gives direct positive support to `Condition`
- formula: `budget.maintenance * 0.02`
- cap: `0.35`

At default `5`:

- bonus = `0.10`

What it helps indirectly:

- higher `Condition`
- better `Client` retention once condition stays above `70`
- better `Customer` retention once condition stays above `70`
- better `Safety`, because low condition hurts safety too

What it does not do:

- it does not directly improve throughput
- it does not directly clear queues
- it does not directly improve service level

Practical read:

- this is a floor-protection line item
- useful, but not strong enough to offset severe congestion or bad sanitation staffing

## Training

What it does:

- improves labor productivity through the labor modifier system
- formula: `max(0, budget.training - 5) * 0.01`
- cap: `0.15`

At default `5`:

- bonus = `0.00`

This is the most important default-value trap in the budget system.

At `5`, training is not helping at all.

What it helps indirectly:

- unload, storage, pick, and load throughput
- lower queue pressure
- lower bottleneck pressure
- better contract service level
- fewer blocked and overdue outbound orders

What it does not do:

- it does not directly increase any score
- it does not help switch drivers, sanitation, inventory team, or management rates in the same cubic-feet way as core processing roles

Practical read:

- if `Client` and `Customer` are falling because the warehouse cannot keep up, training above `5` is one of the few budget levers that can actually increase operational pace

## Safety

What it does:

- gives direct positive support to `Safety`
- formula: `budget.safety * 0.02`
- cap: `0.30`

At default `5`:

- bonus = `0.10`

What it helps indirectly:

- `Customer`, because customer satisfaction takes a hit when safety falls below `75`
- `Morale`, because morale takes a hit when safety falls below `70`

What it does not do:

- it does not fix blocked orders
- it does not improve service level
- it does not directly reduce congestion

Practical read:

- safety budget is protective, not corrective
- it helps keep one failure mode from compounding, but it will not rescue poor outbound flow by itself

## Operations Support

What it does:

- reduces congestion penalty inside the labor modifier system
- reduces condition pressure caused by sanitation shortfall
- formula: `budget.operationsSupport * 0.008`
- cap: `0.16`

At default `5`:

- modifier = `0.04`

What it helps indirectly:

- labor productivity, because less congestion means the productivity multiplier stays healthier
- `Condition`, because sanitation-related condition pressure is reduced
- potentially `Client` and `Customer`, but only through better flow and better condition

What it does not do:

- it does not directly increase `Client`
- it does not directly increase `Customer`
- it does not directly add labor headcount

Practical read:

- this is a soft efficiency line
- useful when congestion is one of the main reasons the warehouse is stalling
- too small at low values to overcome severe staffing or layout problems

## Inventory Support

What it does:

- creates an inventory-support budget modifier
- participates directly in `Condition`
- participates directly in `Morale`
- only becomes meaningful when accepted non-baseline contract volume creates an inventory-support recommendation

Recommended target:

- `1` inventory team head for any positive forecast under `30,000,000` cubic feet per month
- recommended budget points are tied to suggested headcount
- current rule: `5` budget points per suggested inventory headcount

At default `5`:

- this may be enough for small forecasted volume
- this may be underfunded once contract volume grows

Direct score impact:

- if inventory support is adequately funded for the recommended target:
  - `Condition` gets `+0.04`
- if underfunded:
  - `Condition` takes a negative hit up to `0.28`, scaled by difficulty
  - `Morale` takes a negative hit up to `0.18`, scaled by difficulty

Important caveat:

- budget alone is not enough
- the `Inventory Team` headcount must also meet the suggested recommendation or `Condition` and `Morale` still fall

What it helps indirectly:

- better condition stability under larger contract portfolios
- less morale decay from inventory support shortfalls

What it does not do:

- it does not directly raise `Client`
- it does not directly raise `Customer`
- it does not directly speed outbound loading or picking

Practical read:

- this is a forecast-scaled support line
- it matters more as you accept more monthly volume
- if ignored during growth, it quietly drags condition and morale down

## Contingency

What it does right now:

- increases budget point total
- therefore increases budget cost per tick

What it does not do right now:

- no direct score effect
- no labor modifier
- no explicit emergency buffer mechanic
- no current hook into `Client`, `Customer`, `Condition`, `Safety`, or `Morale`

Practical read:

- as currently implemented, this is effectively a reserved budget bucket with no gameplay payoff yet

## Why Client And Customer Still Drop To Zero

This is the main gameplay interpretation issue.

Budgeting is not the main control surface for those two scores.

### Why Client Drops

`Client` usually collapses because one or more of these happen:

- contract service level falls below `80`
- dock storage pressure persists
- a critical labor bottleneck exists
- condition falls below `70`

The biggest driver is usually `serviceLevel`.

Service level is calculated from actual throughput versus expected contract throughput over elapsed contract days. If the warehouse cannot keep up with accepted contracts, `Client` will bleed down even if the budget looks reasonable.

### Why Customer Drops

`Customer` usually collapses because:

- outbound orders become blocked
- outbound orders become overdue
- load queue pressure builds
- safety falls below `75`
- condition falls below `70`

That means `Customer` is usually a pick/load/door/throughput problem first, and a budget problem only secondarily.

## What The Default Budget Of 5 Really Means

At the current defaults:

- `maintenance = 5` is helpful
- `safety = 5` is helpful
- `operationsSupport = 5` is modest
- `inventorySupport = 5` may or may not be enough depending on forecast volume
- `training = 5` is no bonus at all

So a plan with many `5`s is not a "healthy all-around plan." It is closer to:

- basic maintenance coverage
- basic safety coverage
- modest operations support
- baseline inventory support
- zero extra training investment

That is enough to prevent some passive decay, but not enough to guarantee:

- good service level
- clean outbound execution
- stable client satisfaction
- stable customer satisfaction

## Practical Recommendations

If `Client` is crashing:

- reduce accepted contract pressure until service level holds above `80`
- increase throughput capacity before taking more volume
- keep condition above `70`
- keep dock storage pressure down
- consider raising `training` above `5`

If `Customer` is crashing:

- add door and labor capacity for pick/load flow
- reduce blocked and overdue outbound orders
- keep safety above `75`
- keep condition above `70`
- use budget to support flow, not as a substitute for it

If `Condition` is crashing:

- keep sanitation staffed
- maintain valid storage layouts
- avoid pushing storage utilization above `85%`
- raise maintenance if condition is sagging
- match inventory support budget and inventory-team headcount to forecast volume

## Summary

Budgeting is a support system, not a direct satisfaction system.

- `Maintenance` and `Safety` directly prop up `Condition` and `Safety`
- `Training` improves processing throughput, but only above `5`
- `Operations Support` reduces congestion and sanitation-related pressure
- `Inventory Support` protects `Condition` and `Morale` when forecast volume justifies it
- `Contingency` currently has no gameplay effect beyond cost

If `Client` and `Customer` are falling to `0`, the root cause is usually:

- throughput is too low for accepted contracts
- outbound work is blocking or overdue
- condition or safety crossed the penalty thresholds

The budget can help stabilize those systems, but it cannot compensate for insufficient layout, labor, doors, or processing capacity.
