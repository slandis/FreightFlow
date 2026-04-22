# Gameplay Hints

## Purpose

These notes are practical opening plans for the current FreightFlow balance build. They are meant to reduce early trial-and-error and give a stable starting pattern for each run type.

Core principle:

- `Client satisfaction` is mostly protected by keeping dock freight moving into storage and maintaining contract service level.
- `Customer satisfaction` is mostly protected by keeping outbound orders from becoming blocked, overdue, or stuck in the load queue.

That means most runs should be built around:

- one compact door bank
- one short travel spine
- small valid storage blocks close to travel
- labor that can flex between inbound stability and outbound clearance

## Universal Layout Pattern

Use this layout pattern on every difficulty unless a contract forces a specialty deviation:

1. Activate a tight door cluster on one dock edge instead of scattering doors around the map.
2. Build a straight travel spine inward from that cluster.
3. Add one short cross-aisle so all storage stays within 3 tiles of travel.
4. Paint storage in compact blocks, not giant rooms.
5. Put standard storage first, then add a small fast-turn pocket before adding niche storage.

Recommended opening shape:

- 2-tile-wide travel spine from the main working door area
- 1 short cross-aisle 4-6 tiles in from the dock
- standard storage on both sides of the spine
- fast-turn storage closest to the door bank once outbound pressure appears

Avoid:

- painting large storage areas before you need them
- placing isolated doors with no shared travel corridor
- painting storage more than 2 tiles from the main travel path
- opening specialty storage before accepted contracts justify it

## Door Rules

Early game door pattern:

- `Relaxed`: `1 inbound`, `1 flex`, add `1 outbound` later
- `Standard`: `1 inbound`, `1 flex`, add `1 outbound` once open orders start building
- `Demanding`: start `1 flex`, add `1 inbound` first, add `1 outbound` only after storage is stable
- `Brutal`: start `1 flex` only, add `1 inbound` as the first expansion, add dedicated outbound last

Why:

- A flex door protects both client and customer pressure early.
- Dedicated inbound helps client score once dock/storage pressure starts rising.
- Dedicated outbound helps customer score only after real pick/load pressure exists.

## Storage Rules

Opening storage mix by default:

- mostly `standard-storage`
- add a small `fast-turn-storage` pocket next
- delay `bulk`, `oversize`, and `special-handling` until contracts or freight mix make them necessary

Recommended opening size:

- `Relaxed`: `8-12` standard tiles, `2-4` fast-turn later
- `Standard`: `6-10` standard tiles, `2-3` fast-turn later
- `Demanding`: `5-8` standard tiles, `2` fast-turn later
- `Brutal`: `4-6` standard tiles, `1-2` fast-turn only after cash stabilizes

Build small first because:

- storage painting costs cash immediately
- outbound generation now requires stored inventory to accumulate
- overbuilding storage too early slows your cash runway without protecting either score

## Staffing Plans

These are recommended live assignments, not just the boot defaults.

### Relaxed

Opening plan:

- `Switch`: `2`
- `Unload`: `2`
- `Storage`: `2`
- `Pick`: `2`
- `Load`: `2`
- `Sanitation`: `2`
- `Management`: `2`

Pattern:

- keep the balanced start
- do not rush extra outbound labor
- use the mode’s cash cushion to build clean travel and compact storage first

First headcount additions:

1. `Storage +1`
2. `Load +1`
3. `Management +1`

Why:

- relaxed failures usually come from mild overexpansion, not raw pressure
- extra storage preserves client score
- extra load preserves customer score once order volume rises

### Standard

Opening plan:

- `Switch`: `2`
- `Unload`: `2`
- `Storage`: `2`
- `Pick`: `2`
- `Load`: `2`
- `Sanitation`: `1`
- `Management`: `1`

Pattern:

- this is the most balanced general-purpose setup
- hold it until you see which queue starts sticking
- resist cutting sanitation or management to boost throughput roles

First headcount additions:

1. `Storage +1`
2. `Load +1`
3. `Sanitation +1`

Why:

- client score usually breaks first from dock/storage pressure
- customer score breaks next from load backlog
- a second sanitation worker meaningfully protects condition, which supports both satisfaction scores

### Demanding

Opening plan:

- `Switch`: `1`
- `Unload`: `2`
- `Storage`: `2`
- `Pick`: `1`
- `Load`: `1`
- `Sanitation`: `1`
- `Management`: `1`

Pattern:

- play for inbound stability first
- accept that outbound will be thinner early
- keep the layout very short so `1` pick and `1` load worker are enough

First headcount additions:

1. `Load +1`
2. `Pick +1`
3. `Storage +1`

Why:

- demanding mode can hold client score for a while if storage flow is clean
- customer score falls faster once orders start stacking
- the first correction is usually outbound labor, not more switch capacity

### Brutal

Opening plan:

- `Switch`: `1`
- `Unload`: `2`
- `Storage`: `1`
- `Pick`: `1`
- `Load`: `1`
- `Sanitation`: `1`
- `Management`: `1`

Pattern:

- keep everything compact
- do not open extra zones or doors until the existing lane is clean
- storage and outbound distance matter more than raw capacity here

First headcount additions:

1. `Storage +1`
2. `Load +1`
3. `Pick +1`

Why:

- brutal mode punishes dock/storage delay immediately through service level
- once inventory accumulates, outbound delay becomes the next failure point
- adding switch labor too early is usually a trap unless yard trailers are visibly stuck

## If Client Satisfaction Is Falling

Do these in order:

1. Check `storageQueueCubicFeet` and clear dock freight first.
2. Add or reassign `Storage +1`.
3. If unload trailers are backing up, add `Unload +1`.
4. Add a dedicated inbound-capable door if flex is overloaded.
5. Restore `Sanitation` or `Management` to at least `1`, and ideally `2` on larger runs.

Client score mainly falls from:

- dock storage pressure
- critical bottlenecks
- low condition
- low contract service level

So the fix is usually inbound/storage throughput, not more pick/load.

## If Customer Satisfaction Is Falling

Do these in order:

1. Check blocked and overdue outbound orders.
2. Add or reassign `Load +1`.
3. Add `Pick +1` if open orders are sitting before picked state.
4. Add a dedicated outbound-capable door if the load queue is persistent.
5. Restore safety and condition by protecting sanitation and avoiding overloaded layouts.

Customer score mainly falls from:

- blocked orders
- overdue orders
- load queue pressure
- low safety
- low condition

So the fix is usually pick/load/door readiness, not more storage painting.

## Practical Expansion Order

Most stable order across all runs:

1. one compact flex-led door bank
2. short travel spine
3. standard storage block
4. second door
5. small fast-turn storage pocket
6. labor additions based on the first persistent queue
7. specialty storage only when contracts require it

## Common Mistakes

- Opening too many doors early and forcing long travel paths
- Painting storage everywhere instead of one compact working block
- Stealing the last sanitation or management worker for throughput roles
- Expanding outbound before inbound storage is stable
- Expanding specialty storage before the freight mix justifies it
- Treating `Fast` as a normal observation speed instead of a compression speed

## Speed Use

Recommended usage with the current ladder:

- `Slow`: use when placing zones, watching a new door bank, or diagnosing a queue
- `Medium`: default live play speed
- `Fast`: use only when the operation is already stable
- `Hyper`: use to jump to the next month boundary; expect planning to pause automatically unless reviews are being skipped

## Short Version

- Protect `client` with storage flow, condition, and service level.
- Protect `customer` with pick/load throughput, outbound door readiness, and safety.
- Keep the first warehouse compact.
- Add labor to the first persistent queue, not the loudest visual problem.
- On hard modes, fix storage first, then outbound.
