# Difficulty Factors

This note captures the main balance levers available in the current FreightFlow implementation and the recommended exact-value rebalance that makes play less forgiving without rewriting core systems.

## Current Challenge Problem

The game can still feel too easy when:

- starting cash gives too much room for layout rework
- build/edit costs are cheap enough that mistakes are easy to erase
- recurring burn is low enough that stable cash snowballs quickly
- shipment revenue outpaces fixed costs once the floor is merely functional
- outbound demand clears storage too efficiently, reducing dock and storage pressure

The cleanest way to increase challenge is to tighten those levers before adding more complex failure mechanics.

## Recommended Rebalance

### 1. Lower Starting Cash On Harder Modes

- `Relaxed`: keep `225,000`
- `Standard`: `100,000 -> 85,000`
- `Demanding`: `70,000 -> 50,000`
- `Brutal`: `45,000 -> 30,000`

Effect:

- layout and staffing mistakes are harder to absorb
- early capital choices matter more
- harder modes feel distinct immediately

### 2. Increase Build And Edit Costs

Recommended exact values:

- travel: `50 -> 80`
- erase: `15 -> 40`
- standard storage: `80 -> 120`
- bulk storage: `110 -> 150`
- fast-turn storage: `95 -> 140`
- oversize storage: `140 -> 190`
- special-handling storage: `180 -> 240`
- door placement: `2500 -> 4000`

Effect:

- rework becomes expensive
- door spam becomes a real tradeoff
- storage specialization decisions matter more

### 3. Raise Recurring Burn

Recommended exact values:

- labor cost per worker per tick: `0.11 -> 0.13`
- base operating cost per tick: `0.28 -> 0.36`

Effect:

- idle or misallocated labor is more painful
- stable throughput is required sooner
- cash no longer snowballs from a barely-functional setup

### 4. Reduce Freight Revenue

Recommended exact values:

- standard: `0.24 -> 0.21`
- fast-turn: `0.30 -> 0.26`
- bulk: `0.20 -> 0.18`
- oversize: `0.34 -> 0.30`
- special-handling: `0.42 -> 0.37`

Effect:

- profitable freight classes still differ meaningfully
- recovery takes longer
- players cannot brute-force poor operations through raw volume as easily

### 5. Tighten Hard-Mode Score Pressure

Recommended exact values:

- `Demanding` score decay: `1.22 -> 1.30`
- `Brutal` score decay: `1.38 -> 1.50`
- `Demanding` service target: `1.08 -> 1.14`
- `Brutal` service target: `1.16 -> 1.24`

Effect:

- mistakes compound faster
- client satisfaction becomes meaningfully harder to hold
- hard modes demand stronger throughput discipline

### 6. Increase Inbound Pressure On Harder Modes

Recommended exact values:

- `Demanding` inbound interval multiplier: `0.94 -> 0.90`
- `Brutal` inbound interval multiplier: `0.88 -> 0.84`

Effect:

- yard, door, and storage planning stay under pressure longer
- harder runs differentiate through flow stress rather than just low cash

### 7. Make Outbound Less Of A Relief Valve

Recommended exact value:

- minimum available inventory for outbound generation: `1200 -> 1800`

Effect:

- storage fills more visibly before being drained
- inbound/storage pressure remains relevant longer
- docks and storage compete more meaningfully for capacity

## Recommended Patch Scope

For a low-risk balance pass, implement all of the above without changing:

- labor role rules
- map rules
- contract generation shape
- queue formulas
- new failure mechanics

That yields a materially harder game with limited code churn and straightforward regression coverage.
