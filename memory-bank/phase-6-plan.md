# Phase 6 Plan: Storage, Inventory, And Outbound Flow Slice

## Summary

Phase 6 completes the first end-to-end freight lifecycle:

`inbound trailer -> dock freight -> compatible valid storage -> outbound order -> picked freight -> outbound trailer loaded -> shipment complete`

The implementation stays simple and aggregated, but player-visible. Labor allocation remains always available for this slice; Phase 7 will make labor meaningful.

## Core State Changes

- Extend `FreightBatch` with outbound lifecycle fields:
  - `storageZoneId`
  - `outboundOrderId`
  - `storedTick`
  - `pickedTick`
  - `loadedTick`
- Expand `OutboundOrder` with requested/fulfilled cubic feet, state, batch assignments, trailer assignment, due tick, and blocked reason.
- Extend `FreightFlowState` with outbound orders, inventory summary, storage/pick/load queues, outbound metrics, and next outbound order sequence.
- Update zone `usedCubicFeet` from stored freight batches after storage movement.

## Tick Pipeline

After Phase 5 inbound systems run, add:

1. Storage system moves dock freight into valid compatible storage.
2. Outbound order generator creates orders from stored inventory.
3. Pick system reserves and picks stored freight for outbound orders.
4. Load system loads picked freight into outbound trailers and completes shipments.
5. Queue and inventory summaries recalculate.
6. KPI updates include outbound shipped cubic feet and throughput.

## Storage And Outbound Rules

- Store whole freight batches only; no partial splitting in Phase 6.
- Storage requires a valid compatible storage zone with enough remaining capacity.
- Storage chooses valid compatible zones by nearest travel distance, then lowest used capacity.
- Outbound orders generate every 180 ticks only when stored inventory exists.
- Order size is `min(random 300-900, available inventory for selected class)`.
- Picking reserves whole matching stored batches until the order request is satisfied or blocks gracefully.
- Loading uses outbound/flex doors and completes shipments at a prototype 120 cubic feet per tick.

## UI And Rendering

- Bottom KPI bar shows stored inventory, open outbound orders, outbound shipped cubic feet, and existing queue/KPI values.
- Right operations panel shows storage capacity, blocked dock freight, outbound order counts, and shipped cubic feet.
- Door markers continue to show occupied/loading states for outbound trailers.

## Tests

- Storage accepts only compatible valid zones with capacity.
- Inventory by freight class updates after storage.
- Outbound generation waits for stored inventory and respects available volume.
- Picking reserves matching stored batches and blocks unavailable inventory.
- Loading creates/uses outbound trailers, completes shipments, returns doors to idle, and updates outbound/throughput KPIs.
- End-to-end test covers dock freight -> storage -> order -> pick -> load -> shipment complete.

## Assumptions

- Phase 6 uses whole freight batches, not partial batch splitting.
- Phase 6 keeps labor always available; Phase 7 will add labor constraints.
- Orders are generated only from stored inventory.
- Capacity comes from `zoneTypes.json`.
- Compatibility comes from `freightClasses.json`.
- Rich visual animation for stored freight/outbound movement can wait; text summaries plus door markers are enough.
