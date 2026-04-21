# Phase 13 Plan: Contract Offers, Acceptance, and Portfolio Tracking

## Summary

Phase 13 should turn contracts from a single background service target into an explicit strategic system the player can review, accept, reject, and monitor. At each monthly planning review, the player should receive a small set of contract requests that feel plausible for the current warehouse and economy. Each offer should present a real tradeoff around freight class, expected throughput, revenue, service expectations, and operational strain.

This phase should stay grounded in the existing FreightFlow architecture:

- offers are generated and stored in authoritative simulation state
- acceptance and rejection happen through planning commands, not UI-only state
- accepted contracts influence freight demand and revenue in a traceable way
- live contract performance is visible in a right-panel portfolio view using selectors

This should be a strategic-planning phase, not a full negotiation sim. The goal is meaningful business choices with clear operational consequences.

## Goals

- Add 3-4 monthly contract offers to the planning flow.
- Let the player accept or reject offers during monthly planning through authoritative commands.
- Present each offer with business-facing details:
  - contract length
  - expected monthly throughput cube
  - revenue rate per throughput cube
  - freight class
  - penalties for excessive dwell or well time
  - operational notes and expected challenge
- Add a lightweight internal analysis for each offer based on current labor, budget, storage, and door posture.
- Expand the contract model so accepted contracts can be tracked individually instead of only as one aggregate service score.
- Add a right-panel contract page with live metrics, contract KPIs, owned freight, throughput history, and labor usage.
- Keep contract values plausible and bounded by simulation-aware generation rules.

## Non-Goals

- Do not build deep multi-round negotiation, bidding, or client dialogue trees.
- Do not add narrative clients, cutscenes, or campaign progression.
- Do not model every legal/commercial clause of a warehouse contract.
- Do not build chart-heavy analytics dashboards; simple trend summaries are enough.
- Do not rewrite the whole freight economy around contracts in one pass.

## Current Starting Point

- `ContractSystem.ts` currently evaluates only the first active contract and computes one aggregate service level.
- `GameState.contracts` contains a single flat `activeContracts` list plus aggregate fulfilled/missed demand values.
- Monthly planning already exists as an authoritative multi-page flow with command-driven confirmation.
- The right operations panel already exposes a compact contract summary, but not per-contract details or browsing.
- Freight batches, trailers, and outbound orders are not yet tagged to a specific contract.
- `src/data/config/contracts.json` is currently empty, which gives us room to define a cleaner generated-offer model rather than preserve a half-finished one.

## Recommended Scope Decision

Implement Phase 13 in three linked passes:

1. Expand the contract simulation model and monthly offer generation.
2. Add planning-page acceptance flow with operational impact analysis.
3. Add live portfolio tracking and browsing in the right HUD.

This keeps the feature vertically integrated while avoiding a giant one-shot rewrite.

## Core Design Decision

Treat contract offers as monthly business opportunities, not passive config records.

Recommended shape:

- each month generates a temporary set of `pendingOffers`
- player accepts zero or more offers during planning
- accepted offers become `activeContracts`
- active contracts shape outbound demand generation and revenue modifiers
- freight and fulfillment history are tagged back to the originating contract

This keeps the contract loop aligned with the monthly planning rhythm already present in the game.

## Proposed Simulation Model

Expand `GameState.contracts` to support offers, accepted contracts, live performance, and history.

Suggested direction:

```ts
export interface ContractOffer {
  id: string;
  monthKey: string;
  clientName: string;
  freightClassId: string;
  lengthMonths: number;
  expectedMonthlyThroughputCubicFeet: number;
  expectedWeeklyThroughputCubicFeet: number;
  revenuePerCubicFoot: number;
  minimumServiceLevel: number;
  dwellPenaltyThresholdTicks: number;
  dwellPenaltyRatePerCubicFoot: number;
  storageCostModifier: number;
  difficultyTag: "capacity" | "speed" | "specialization" | "margin" | "consistency";
  operationalChallengeNote: string;
  forecastRange: {
    minMonthlyCubicFeet: number;
    maxMonthlyCubicFeet: number;
  };
  analysis: ContractOfferAnalysis;
}

export interface ContractOfferAnalysis {
  recommendedStorageZoneTypes: string[];
  expectedAdditionalHeadcountByRole: Partial<Record<LaborRole, number>>;
  storageCapacityRisk: "low" | "moderate" | "high";
  laborCapacityRisk: "low" | "moderate" | "high";
  budgetPressure: "low" | "moderate" | "high";
  estimatedMonthlyLaborCostDelta: number;
  estimatedMonthlyOperatingCostDelta: number;
  notes: string[];
}

export interface ActiveContract {
  id: string;
  sourceOfferId: string | null;
  clientName: string;
  freightClassId: string;
  acceptedMonthKey: string;
  endMonthKey: string;
  lengthMonths: number;
  revenuePerCubicFoot: number;
  minimumServiceLevel: number;
  targetThroughputCubicFeetPerDay: number;
  dwellPenaltyThresholdTicks: number;
  dwellPenaltyRatePerCubicFoot: number;
  storageCostModifier: number;
  health: "healthy" | "stable" | "at-risk" | "critical";
  performanceScore: number;
}

export interface ContractPerformanceRecord {
  contractId: string;
  weekKey: string;
  monthKey: string;
  inboundCubicFeet: number;
  outboundCubicFeet: number;
  throughputCubicFeet: number;
  dwellPenaltyCost: number;
  serviceLevel: number;
  laborCostAttributed: number;
  laborHeadcountDaysAttributed: number;
  inventoryCubicFeetEndOfPeriod: number;
}

export interface ContractState {
  pendingOffers: ContractOffer[];
  activeContracts: ActiveContract[];
  completedContracts: ActiveContract[];
  performanceHistory: ContractPerformanceRecord[];
  serviceLevel: number;
  missedDemandCubicFeet: number;
  fulfilledDemandCubicFeet: number;
}
```

## Freight Attribution Plan

Accepted contracts only become meaningful if freight and cost can be tied back to them.

Recommended additions:

- add `contractId: string | null` to inbound freight batches
- add `contractId: string | null` to outbound orders
- add `contractId: string | null` to trailers where useful for reporting

Recommended rule:

- inbound freight generated for a contract carries that contract tag from creation
- outbound orders generated from stored contract freight inherit that same contract id
- completion, storage, dwell, and penalties can then roll up per contract

This is the minimum data plumbing needed for the live contract page the user wants.

## Offer Generation Rules

Contract offers should be random, but constrained by real warehouse conditions and believable balance bands.

Recommended monthly generation flow:

1. At planning open, generate 3-4 offers if the month has not already generated them.
2. Choose freight class mix from existing freight classes, weighted toward classes the warehouse can plausibly support.
3. Clamp expected throughput against simulation-aware bounds:
   - current total throughput
   - difficulty mode
   - available compatible storage capacity
   - door count and current labor posture
4. Scale revenue rates by freight class complexity and offer challenge.
5. Attach one clear operational challenge to each offer.

Recommended challenge patterns:

- `capacity`: high cube, standard margin, pushes storage volume
- `speed`: moderate cube, strong dwell penalty, pushes unload/store/load responsiveness
- `specialization`: better rate, but requires tighter compatible storage availability
- `margin`: low margin, high reliability expectations
- `consistency`: lower total volume, but harsh penalties for missed service

Recommended plausibility guardrails:

- no offer should demand more than a bounded multiple of recent monthly throughput
- no rate should exceed a configured max per freight class band
- no offer should target a freight class the simulation cannot currently represent
- no offer should be impossible by definition on acceptance

Important nuance:

Offers do not need to be easy. They do need to be explainably risky rather than absurd.

## Offer Analysis Plan

Each offer should include a simple analysis surface to support player decision-making.

Recommended analysis inputs:

- current labor assignments
- labor throughput per role
- current budget plan
- compatible storage capacity by freight class
- existing active contract load
- current door count and dock pressure
- recent queue pressure and blocked freight

Recommended analysis outputs:

- estimated extra switch/unload/storage/pick/load headcount needed
- strain on compatible storage availability
- likely budget pressure from labor and operating cost
- expected extra handling/storage cost for the freight class
- warning if the player is already near capacity in the required class
- one concise recommendation, such as:
  - "Acceptable if storage labor increases by 2"
  - "High margin, but fast-turn load pressure is likely"
  - "Bulk storage is already strained; expect congestion unless capacity expands"

This analysis should be intentionally approximate. It should support planning, not promise exact outcomes.

## Monthly Planning UI Plan

Add a new planning page:

- `Contracts`

Recommended placement:

- Forecast
- Contracts
- Workforce
- Condition
- Satisfaction
- Budgeting
- Productivity

Contracts page structure:

- top summary of current active contracts and portfolio pressure
- list of 3-4 monthly offers
- each offer card shows:
  - client name
  - freight class
  - contract length
  - expected monthly throughput
  - forecast range
  - revenue per cu ft
  - minimum service level
  - dwell penalty terms
  - challenge note
  - analysis summary
  - accept/reject toggle

Recommended interaction model:

- default offers start unaccepted
- player can mark accepted offers before confirming the monthly plan
- accepted offers become part of the authoritative plan confirmation
- no separate "negotiate" flow for this phase

Recommended commands:

- `SetContractOfferDecisionCommand`
- `AcceptContractOfferCommand` if decisions should commit immediately into pending planning state
- or store offer decisions inside `planning.pendingPlan` and finalize them in `ConfirmMonthlyPlanCommand`

Recommended scope choice:

Store offer decisions in `planning.pendingPlan` and apply them on `ConfirmMonthlyPlanCommand`, so planning remains the single commit boundary.

## Planning Snapshot Expansion

Add contract-planning data to the monthly snapshot:

- current active contract count
- current contract freight mix by class
- compatible storage pressure by class
- estimated available labor headroom by role
- recent average dock dwell / yard dwell
- recent contract penalty exposure

This lets the Contracts page read mostly from one planning-oriented selector instead of stitching together ad hoc UI queries.

## Contract Portfolio Page Plan

Add a new right-panel section or dedicated modal surface reachable from the right panel:

- `Contracts`

Recommended first version:

- keep it inside `RightOperationsPanel` as a collapsible section with paginated cards
- show 3 contracts per page
- add previous/next controls and page count

Each contract card should display:

- client / contract name
- freight class
- health / performance state
- live contract KPI score
- service level
- inventory cube currently belonging to the contract
- throughput this week / this month
- recent weekly or monthly history summary
- labor attributed to the contract:
  - dollars per day
  - headcount per day
- dwell penalty exposure or most recent penalty

If there are more than 3 active contracts:

- page by 3
- preserve the user’s current page while live values update

Recommended selector outputs:

- `selectContractPortfolioSummary`
- `selectActiveContractCards`
- `selectContractHistoryPage`

## Contract KPI And History Plan

Use a simple per-contract score rather than only a health badge.

Recommended contract KPI score:

- throughput achievement
- service level
- client satisfaction contribution
- dwell / well-time penalty avoidance
- safety modifier

A practical first formula:

```ts
contractPerformanceScore =
  throughputAchievement * 0.35 +
  serviceLevel * 0.25 +
  dwellPenaltyAvoidance * 0.15 +
  clientSatisfactionContribution * 0.15 +
  safetyModifier * 0.10
```

Recommended historical windows:

- rolling weekly summaries for the current month
- rolling monthly summaries for the last 3-6 months

Do not build charts yet. Text rows or compact stat blocks are enough.

## Labor And Cost Attribution Plan

The right-panel contract page needs labor in dollars and headcount per day. That requires an attribution model.

Recommended first-pass attribution:

- attribute labor by freight volume share per contract across active handling stages
- calculate per-contract share of unload, storage, pick, and load work
- multiply those shares by current labor cost per role
- store a daily/monthly summary rather than per-tick granular records

This will not be accounting-perfect, but it will be consistent and decision-useful.

Recommended implementation note:

Keep attribution formulas in selectors or a small reporting service first. Avoid pushing too much bookkeeping into the core tick loop unless profiling shows it is necessary.

## Revenue And Penalty Integration

Accepted contracts should affect both upside and downside.

Recommended changes:

- revenue recognition uses the contract’s revenue rate rather than one generic baseline
- contracts can modify class-specific revenue through `revenuePerCubicFoot`
- dwell penalties apply when contract freight exceeds the offer’s dwell threshold
- penalties hit current-month revenue/net directly and influence contract health

Recommended penalty source:

- start with dock or yard dwell for freight/trailers tied to the contract
- keep one consistent definition for Phase 13 and label it clearly in the UI

Because the user specifically asked for excessive well time:

- define "well time" in the implementation as freight/trailer dwell past a contract threshold
- use the same wording in the UI and docs so players understand what is being penalized

## Outbound Demand Integration

This phase should tighten the connection between contracts and demand generation.

Recommended behavior:

- accepted contracts bias or drive outbound order creation for their freight class
- order generation draws from stored contract-tagged freight first
- contract target throughput influences expected monthly outbound demand

Important scope boundary:

- do not attempt full inbound scheduling by contract and outbound scheduling by contract in one pass if it becomes too wide
- it is enough for accepted contracts to influence generated freight mix and outbound order pressure in a visible, testable way

## Save/Load And Persistence Considerations

Save/load must include:

- pending monthly offers
- accepted/rejected offer decisions if planning is mid-month-open
- active contracts
- completed contract history
- performance history sufficient for the right-panel portfolio page
- contract ids on freight, orders, and any other tracked entities

This likely requires a save schema version bump.

## Config And Content Plan

Recommended new data/config surfaces:

- optional `contractOfferBands.json` or similar for class-based offer generation ranges
- optional client name pool / client profile config
- optional penalty/rate bands by freight class

Because `contracts.json` is currently empty, prefer this split:

- static config defines generation bands and client archetypes
- runtime generates actual monthly offers from those bands

That is a better fit for the user’s request than hand-authoring every possible contract.

## UI/UX Notes

Keep the contract pages decision-oriented and readable.

Good questions the UI should answer:

- Which offers are attractive?
- What operational pain do they add?
- Can my current labor and storage support them?
- Which active contracts are paying off?
- Which ones are creating risk or penalties right now?

Avoid:

- giant spreadsheets
- hidden assumptions with no explanation
- duplicate contract data shown in too many panels

## Test Plan

Add focused tests for:

- monthly offer generation count is 3-4
- offers stay within valid freight-class, throughput, and rate bands
- impossible or absurd offers are filtered out
- offer analysis reflects current storage/labor constraints
- accepted offers convert into active contracts on monthly confirm
- rejected offers do not become active contracts
- contract-tagged freight and orders retain attribution through storage, pick, load, and shipment
- per-contract service level and performance score update correctly
- dwell penalties apply only when thresholds are exceeded
- right-panel selectors page active contracts in groups of 3
- save/load preserves offers, active contracts, contract metrics, and contract-attributed freight

Run:

```powershell
npm run test
npm run build
```

## Manual Validation Plan

After implementation:

- open monthly planning and confirm 3-4 offers appear
- verify offers look plausible in volume, class, and revenue
- verify at least one offer creates a clear labor/storage tradeoff
- accept one or more offers and confirm the plan
- verify accepted contracts appear in the right-panel portfolio view
- verify contract freight/inventory numbers update in real time
- verify weekly/monthly history values populate as time advances
- verify contract penalties and health changes are visible when service slips
- verify save/load preserves both offers and accepted contracts correctly

## Suggested Implementation Order

1. Expand contract state types in `GameState` and save schema types.
2. Add contract ids to freight batches, outbound orders, and any required trailer surfaces.
3. Create runtime offer-generation data/config helpers.
4. Implement monthly contract offer generation in `ContractSystem` or a dedicated offer service triggered at planning open.
5. Extend planning state to hold pending offer decisions.
6. Add commands for accepting/rejecting offers within planning.
7. Update `ConfirmMonthlyPlanCommand` to finalize accepted offers into active contracts.
8. Expand contract service/performance logic to operate on multiple active contracts instead of only the first one.
9. Add contract revenue and dwell-penalty integration.
10. Add offer analysis selectors for labor, storage, and budget impact.
11. Add the `Contracts` page to `MonthlyPlanningDialog`.
12. Add right-panel portfolio selectors and the paginated 3-per-page contract browser.
13. Add tests for generation, acceptance, tracking, attribution, paging, and persistence.
14. Run test/build/manual validation.
15. Update `memory-bank/progress.md` when implementation is complete.

## Risks And Mitigations

- Risk: contract generation produces nonsense or impossible offers.
  - Mitigation: define explicit throughput/rate bands and simulation-aware guardrails before coding the generator.

- Risk: per-contract freight attribution balloons scope.
  - Mitigation: tag batches/orders early and use summary aggregation instead of tick-perfect bookkeeping.

- Risk: monthly planning becomes too dense.
  - Mitigation: keep the Contracts page card-based, concise, and analysis-driven rather than tabular overload.

- Risk: labor/cost attribution is noisy or misleading.
  - Mitigation: present it as estimated daily usage and keep formulas simple and consistent.

- Risk: multiple active contracts break the current baseline contract system.
  - Mitigation: explicitly refactor `ContractSystem` away from `activeContracts[0]` before wiring new UI on top.

- Risk: right-panel contract browsing adds clutter.
  - Mitigation: use a paginated carousel and only show 3 cards per page with compact summaries.

## Review Questions

- Should players be allowed to accept multiple offers per month with no hard cap, or should we cap accepted offers to avoid overload?
- Should accepted contracts begin immediately on confirmation, or at the first tick/day of the new month?
- Do you want contract offers to expire completely if rejected, or can they reappear later in weaker/stronger forms?
- Should labor/cost attribution stay estimated-only for MVP+, or do you want stricter accounting even if it adds more state complexity?
- Should the contract portfolio live only inside the right panel, or should we plan for a dedicated modal later if it grows?

## Recommended Scope Decision

For the first implementation:

- generate 4 offers per month
- allow accepting any number, but warn when combined projected strain is high
- start accepted contracts immediately after monthly plan confirmation
- use generated runtime offers from bounded config bands
- keep labor/cost attribution estimated rather than ledger-perfect
- keep the live portfolio in the right panel with 3 cards per page

## Completion Criteria

Phase 13 is complete when:

- monthly planning shows 3-4 plausible contract offers
- the player can accept or reject offers during planning
- each offer includes business details plus a useful operational analysis
- accepted contracts become live tracked contracts in simulation state
- contract-attributed freight and performance can be tracked over time
- the right HUD exposes a real-time paginated contract portfolio view
- contract health, KPI score, throughput history, inventory cube, and labor usage are visible per contract
- `npm run test` and `npm run build` pass
- save/load preserves the new contract state correctly
- `memory-bank/progress.md` can be updated from a completed implementation
