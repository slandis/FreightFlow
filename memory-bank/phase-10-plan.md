# Phase 10 Plan: UI/UX Expansion and Readability Pass

## Summary

Phase 10 should turn the current simulation-heavy build into a more readable, diagnosable play experience. The game already has working freight flow, zoning, doors, labor, scores, economy, monthly planning, alerts, and basic panels. This phase should focus on helping the player quickly answer:

- What is happening right now?
- What is going wrong?
- What action can improve it?

The goal is not final art polish. The goal is operational clarity: better HUD grouping, actionable alerts, useful tooltips, overlay controls, map readability, and click-to-focus interactions that connect React diagnostics to Phaser map context.

## Current Starting Point

- Top HUD shows date/time, cash, score basics, critical alert count, tick, and speed controls.
- Left tool panel has zone tools, door tools, erase, and select with short descriptions.
- Right operations panel is already collapsible and contains Flow, Business, Scores, Labor, Dock Storage Needs, and Tile details.
- Bottom KPI bar shows many metrics, but they are static text spans with no drilldown, focus, or grouping.
- Alerts center shows count and the first three active alert messages.
- `MetricTooltip` exists, but currently renders only children.
- `ZoneOverlayRenderer` currently renders invalid storage hatching/outline.
- Phaser already renders tiles, invalid overlays, doors, trailers, hover highlights, and selection highlights.
- Monthly planning modal now opens at live game start and month rollover, and Hyper speed helps test loops quickly.

## Goals

- Make the main screen readable during normal play without opening developer tools.
- Make alerts actionable enough to guide player response.
- Add lightweight, reusable tooltip behavior for HUD/KPI/tool explanations.
- Add overlay state and controls for Phase 10 diagnostic overlays.
- Improve map readability and door/queue visibility without making the map look cluttered.
- Add click-to-focus pathways from alerts/KPIs/panels to relevant map areas where a location exists.
- Preserve simulation authority: UI dispatches commands or requests focus; it does not own gameplay rules.
- Keep the current visual language consistent: compact panels, 8px or smaller radius, no nested cards, no decorative blobs/orbs.

## Non-Goals

- Do not implement final tutorial scripting.
- Do not implement full charting libraries unless plain React/CSS is insufficient.
- Do not add save/load; Phase 11 owns persistence.
- Do not build deep telemetry dashboards beyond small debug/readability selectors.
- Do not replace the Phaser render pipeline wholesale.
- Do not require overlays for basic understanding; overlays should enhance diagnosis.

## Recommended Scope Decision

Implement Phase 10 as a readability vertical slice:

1. Add a UI overlay/focus state model.
2. Add overlay toggles to the left panel.
3. Expand `ZoneOverlayRenderer` into a mode-aware overlay renderer.
4. Make alerts actionable with severity grouping and suggested actions.
5. Add reusable tooltips for HUD, KPI, tools, and score drivers.
6. Make the bottom KPI strip interactive enough to open/focus related diagnostics.
7. Add map focus helpers for doors, invalid storage, dock freight, and selected tile.
8. Tighten panel wording and status language.

This should be enough to support playtesting without overbuilding a final UI system.

## UI State Plan

Extend `src/ui/store/uiStore.ts` with UI-only diagnostic state:

```ts
export type OverlayMode =
  | "none"
  | "invalid-storage"
  | "zone-types"
  | "travel-network"
  | "storage-capacity"
  | "door-utilization"
  | "queue-pressure";

export interface MapFocusRequest {
  id: string;
  reason: string;
  x: number;
  y: number;
  zoom?: number;
}
```

Add store fields/actions:

- `activeOverlayMode`
- `setActiveOverlayMode(mode)`
- `mapFocusRequest`
- `requestMapFocus(request)`
- `clearMapFocusRequest(id)`
- optional `expandedRightPanelSection` if we want KPI/alert clicks to open a section

Keep this UI state separate from `GameState`. The simulation still owns all rules and source data.

## Selector Plan

Add selectors that transform existing simulation data into UI-friendly summaries:

### Alert/Issue Selectors

Create `src/game/simulation/selectors/diagnosticSelectors.ts`.

Suggested selectors:

- `selectOperationalIssues(state)`
- `selectMostSevereIssue(state)`
- `selectInvalidStorageIssueCount(state)`
- `selectDoorUtilizationSummary(state)`
- `selectQueuePressureSummary(state)`
- `selectFocusableIssueTargets(state)`

Issue model:

```ts
export interface OperationalIssue {
  id: string;
  severity: "info" | "warning" | "critical";
  category: "storage" | "labor" | "door" | "queue" | "finance" | "score" | "planning";
  title: string;
  detail: string;
  recommendedAction: string;
  focusTarget?: { x: number; y: number; label: string };
}
```

Use existing alerts first, then enrich with derived diagnostics:

- invalid storage zones
- dock freight waiting for storage
- blocked outbound orders
- critical labor bottlenecks
- no idle inbound/outbound-capable doors
- critical score warnings
- low cash

### Overlay Selectors

Add map-oriented selectors for overlay rendering:

- invalid storage tiles
- travel tiles
- storage capacity percent per zone/tile
- door states and estimated utilization
- queue pressure by operational area

Initial estimates can be simple. Door utilization can start from door state instead of historical duty cycle if no utilization metric exists yet.

## Overlay Rendering Plan

Evolve `ZoneOverlayRenderer` into a broader `MapOverlayRenderer` or extend it carefully.

Recommended first version:

- `invalid-storage`: existing red hatching/outline
- `zone-types`: subtle extra tint/legend reinforcement, not a full repaint
- `travel-network`: bright travel-tile outline/path emphasis
- `storage-capacity`: capacity heat by zone usage percent
- `door-utilization`: door labels or pulses by idle/reserved/occupied/loading/unloading state
- `queue-pressure`: draw pressure markers near dock/doors/storage zones

Implementation notes:

- Keep overlays toggleable from React UI state.
- Phaser scene can read UI overlay state through a small bridge or callback passed into `MapInputController`/scene setup.
- Preserve hover and selected tile highlights above diagnostic overlays.
- Keep invalid storage visible by default when no other overlay is active, or expose it as the default selected overlay.

## Click-To-Focus Plan

Add focus support from React diagnostics to Phaser camera.

Suggested approach:

1. UI store receives `requestMapFocus({ id, reason, x, y, zoom })`.
2. `MainScene` or `MapInputController` observes focus requests.
3. Convert tile coordinates to isometric world coordinates using existing rendering helpers.
4. Camera pans/centers to the target tile.
5. Optionally set selected tile summary if the target is a tile.
6. Clear or mark the request handled.

Initial focus sources:

- Dock Storage Needs item: focus first compatible invalid/available storage zone or dock edge if no zone exists.
- Alerts: focus invalid storage zone, blocked dock area, or door area when possible.
- KPI strip:
  - Dock -> dock edge/freight area
  - Yard -> door/yard side
  - Bottleneck -> no focus unless associated with storage/door queue
  - Storage -> highest-used storage zone

Keep focus graceful: if no target exists, open the relevant right-panel section instead.

## Alerts Center Plan

Replace the current three-message list with an actionable alert center.

Features:

- show active alert count by severity
- list all active alerts in scrollable compact form
- include severity, message, and recommended action
- add optional `Focus` button when a focus target exists
- de-duplicate derived operational issues and existing alert state
- keep the center compact by default; allow expand/collapse

Suggested sections:

- Critical
- Warnings
- Info

Alert copy should be player-facing and action-oriented:

- “Storage is blocked. Paint compatible valid storage near travel.”
- “Switch drivers are overloaded. Assign switch labor or slow inbound volume.”
- “Customer satisfaction is falling. Clear blocked outbound orders.”

## Tooltip Plan

Make `MetricTooltip` useful but simple:

```tsx
<MetricTooltip label="Throughput" content="Average of inbound and outbound shipped volume.">
  <span>Throughput: ...</span>
</MetricTooltip>
```

Implementation details:

- CSS-only hover/focus tooltip is enough for Phase 10.
- Use `aria-describedby` where practical.
- Support keyboard focus.
- Keep tooltip text concise.
- Tooltips should not block map clicks or important controls.

Tooltip targets:

- Top HUD metrics: cash, morale, safety, condition, alerts, speed
- Bottom KPI items
- Left panel tools
- Right panel score drivers
- Monthly planning budget categories, if time allows

## Top HUD Plan

Current HUD is functional but dense. Improve it with grouping and clearer status language.

Changes:

- group time/speed separately from business scores
- show planning status when locked
- show active overlay mode if one is enabled
- show most severe alert with count
- add tooltips for cash, scores, and speed

Avoid overloading the HUD; move secondary values to bottom KPI/right panel.

## Bottom KPI Strip Plan

Turn KPI spans into compact interactive buttons or focusable metric pills.

Groups:

- Flow: inbound, outbound, throughput
- Inventory: stored, dock, open orders
- Finance: revenue, labor cost, net
- Health: client, customer, bottleneck

Interactions:

- click/focus opens relevant right-panel section or requests map focus
- tooltip explains formula/source
- severe values receive consistent status class

Example:

- Dock freight > 0 and no valid storage -> warning pill
- Net < 0 -> warning/critical pill depending magnitude
- Bottleneck critical -> critical pill

## Right Operations Panel Plan

It is already collapsible, so Phase 10 should refine rather than rebuild.

Changes:

- add tabs or section filters only if collapsibles remain too long after KPI/alert improvements
- add issue summary at the top: “Most urgent: Storage blocked”
- add recommended action text under top bottleneck and dock storage needs
- add focus buttons for dock storage needs and door/queue sections
- improve score driver display with positive/negative driver styling
- make status language consistent: healthy, stable, busy, strained, critical

## Left Tool Panel Plan

Improve tools without expanding layout too much.

Changes:

- add overlay selector/toggles below paint/door tools
- add real tooltips for zone compatibility and constraints
- group tools visually:
  - Inspect/Edit
  - Zones
  - Doors
  - Overlays
- keep current tools visible and avoid nested cards

Potential overlay controls:

- Invalid Storage
- Travel Network
- Capacity
- Door Status
- Queue Pressure

## Map Readability Plan

Keep the map useful at a glance.

Rendering improvements:

- improve door markers with clearer mode/status labels or icons
- make active/selected tile outlines stronger than diagnostic overlays
- add subtle travel overlay mode
- add storage capacity heat overlay
- improve invalid storage hatch contrast if hidden by zone colors
- ensure overlays do not obscure trailer/door markers

Manual verification should check:

- overlay toggles respond immediately
- map remains readable at desktop and smaller viewport sizes
- hover/selection remain visible under overlays
- pan/zoom still work

## CSS/Layout Plan

Current CSS is centralized in `src/app/styles/global.css`. Phase 10 can continue there, but organize new blocks clearly:

- tooltip styles
- KPI pill/button styles
- alert center expanded styles
- overlay controls
- focus/action button styles
- map/debug legend styles

Keep design constraints:

- no cards inside cards
- no decorative orbs/blobs
- border radius 8px or less
- do not scale font size with viewport width
- avoid dominant one-note purple, beige, dark slate/blue, or brown/orange themes
- text must fit on mobile and desktop

## Testing Plan

Add or extend Vitest coverage for selectors and UI-safe logic:

- diagnostic selectors return expected critical storage/labor/queue issues
- derived issue severity sorts critical before warning/info
- focus target selectors return valid tile coordinates when possible
- overlay state defaults and transitions in UI store
- tooltip component renders accessible label/content
- alert grouping preserves active alert count and severity order
- KPI status helpers classify healthy/warning/critical values correctly

Rendering/UI checks:

- `npm run test`
- `npm run build`
- browser check on dev server

Manual browser checklist:

- toggle each overlay and verify it appears/disappears
- verify invalid storage hatching still works
- click a dock storage need and verify camera focuses meaningfully
- click alert focus button and verify camera/section response
- confirm hover and selected tile details persist under overlays
- confirm pan/zoom still work
- confirm tooltips appear on hover/focus and do not block controls
- confirm right panel and alert center remain usable without excessive scrolling
- confirm monthly planning modal still blocks live actions correctly

## Suggested Implementation Order

1. Add UI store overlay and focus state.
2. Add diagnostic selector types and first derived issue selectors.
3. Add tooltip implementation and apply to HUD/KPI/tool panel.
4. Refactor bottom KPI strip into grouped metric buttons/pills.
5. Expand alerts center with severity grouping, recommendations, and focus actions.
6. Add overlay controls to left panel.
7. Expand Phaser overlay renderer for travel, capacity, door, and queue overlays.
8. Add map focus handling in Phaser scene/input controller.
9. Refine right panel issue summaries and focus buttons.
10. Tighten CSS/layout for readability.
11. Add tests for selectors, UI helpers, and store behavior.
12. Run `npm run test` and `npm run build`.
13. Perform manual browser check.
14. Update `memory-bank/progress.md` after implementation.

## Risks And Mitigations

### Risk: Overlay Clutter

Too many overlays can make the map harder to read.

Mitigation: one active overlay at a time, with invalid storage either default or clearly toggled.

### Risk: UI State Drifts From Simulation

Focus and overlays might accidentally become gameplay state.

Mitigation: keep overlay/focus state UI-only and derive all facts from selectors.

### Risk: Alerts Become Noise

If every derived condition becomes an alert, the player will tune them out.

Mitigation: group, sort, de-duplicate, and include action text only for important issues.

### Risk: Click-To-Focus Has No Good Target

Some issues are global rather than spatial.

Mitigation: focus map only when a useful target exists; otherwise open the relevant panel section.

## Review Questions

- Should only one diagnostic overlay be active at a time, or should players be able to layer several?
- Should invalid storage remain always visible, or become a normal overlay toggle?
- Should bottom KPI clicks focus the map, open right-panel sections, or both?
- Should the alerts center remain compact by default, or should it replace part of the right panel when expanded?
- Which overlay matters most for the next playtest: travel network, capacity, door utilization, or queue pressure?

## Recommended Scope For First Phase 10 Build

Start with one active overlay at a time. Keep invalid storage as the default overlay because it already teaches a core zoning rule. Add actionable alerts, tooltips, KPI pills, and focus behavior for dock storage/invalid zones first. Door utilization and queue pressure overlays can be simple markers in this phase and refined later.
