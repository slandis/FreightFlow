# Travel Distance

This note maps out a low-risk first pass for making warehouse layout quality matter more by applying small travel-distance penalties to storage and picking work.

## Goal

Add travel-distance impact without introducing:

- worker path simulation
- route reservations
- explicit walking tasks
- pathfinding-driven labor state

The first pass should stay compatible with the current cubic-feet-per-tick labor model.

## Recommended Approach

### Core Rule

Keep the existing labor-capacity systems intact and apply a small throughput multiplier based on travel distance.

Instead of introducing new task phases, use:

- `effectiveCapacity = baseCapacity * distanceMultiplier`

for:

- storage
- picking

This keeps the implementation small and easy to tune.

## Storage

### Available Data

Storage already has the distance signal needed for a first pass:

- `zone.nearestTravelDistance`

That value is already calculated for storage validity.

### First-Pass Behavior

- valid storage still requires travel access
- when a batch is being stored, read the assigned zone’s `nearestTravelDistance`
- reduce storage throughput by a small multiplier based on that distance

### Recommended Storage Multipliers

- distance `0-1`: `1.00`
- distance `2`: `0.92`
- distance `3+`: `0.84`

Practical effect:

- close storage remains best
- farther valid storage is still usable
- travel adjacency starts to matter without becoming punitive

## Picking

### Available Data

Picking can derive distance from the source storage zones of the batches reserved to an order.

The needed data already exists:

- each reserved batch still has `storageZoneId` while the order is in `picking`
- each zone already has `nearestTravelDistance`

### First-Pass Behavior

- when an order is in `picking`, calculate the weighted average storage-zone distance of its reserved batches
- use batch cubic feet as the weight
- reduce pick throughput by a small multiplier based on that average distance

### Recommended Pick Multipliers

- distance `0-1`: `1.00`
- distance `2`: `0.95`
- distance `3+`: `0.90`

Practical effect:

- picks from deeper storage run slightly slower
- closer storage supports better outbound responsiveness
- the penalty stays lighter than storage to avoid making outbound feel sticky too early

## Why This Is Low Risk

- no new simulation entities
- no new path graph work
- no change to queue structure
- no UI dependency
- only two systems change:
  - storage
  - pick

## Systems To Leave Alone For Now

Do not change in the first pass:

- unloading
- loading
- switch-driving
- door assignment

Those can be revisited later if the game needs more spatial realism, but they are not required for a useful first travel-distance pass.

## Recommended Implementation Shape

Create a small helper module:

- `src/game/simulation/labor/travelDistance.ts`

Suggested helper functions:

- `getStorageDistanceMultiplier(distance)`
- `getPickDistanceMultiplier(distance)`
- `getWeightedStorageDistanceForOrder(order, freightFlow, warehouseMap)`

Then wire:

- `StorageSystem` to use the storage multiplier for `storing`
- `PickSystem` to use the pick multiplier for `picking`

## Test Coverage

Focused tests should prove:

- nearer storage zones finish putaway faster than farther valid zones
- nearer stored inventory picks faster than farther stored inventory
- invalid storage behavior does not change

## Summary

The low-risk version is not “workers walk tiles.”

It is:

- storage chooses and processes farther zones a bit more slowly
- picking from farther storage processes a bit more slowly

That is enough to make layout quality matter more while preserving the existing simulation structure.
