# Phase 7: Labor Pools And Queue Processing

## Summary

Phase 7 makes labor allocation meaningful. The current simulation can already move inbound trailers, unload freight, store batches, generate outbound orders, pick freight, and load shipments. This phase adds finite labor pools, real-time labor assignment, labor-scaled processing rates, queue pressure metrics, and visible bottleneck diagnostics.

The simulation remains authoritative. React opens the labor dialog, dispatches assignment commands, and renders selectors. Phaser should continue rendering simulation snapshots and does not own labor rules.

## Player-Facing Goals

- Players can open an appropriate labor dialog during normal simulation and adjust role assignments in real time.
- Labor shortages visibly slow or stop the matching operation.
- Increasing headcount improves processing capacity.
- The UI explains the current top bottleneck and which role can improve it.
- Support roles such as sanitation, management, and switch drivers are assignable but carry operational tradeoffs when understaffed.

## Scope Decisions

- Default total headcount is `18`.
- Labor assignment changes are allowed in real time through a labor dialog.
- Assignments above total headcount fail loudly with a clear command failure and UI feedback.
- Support or indirect labor roles remain assignable:
  - `sanitation` protects cleanliness, condition pressure, and congestion risk.
  - `management` protects coordination and overload stability.
  - `switch-driver` protects yard and door movement flow.
- Understaffing support roles should have visible penalties instead of acting as free capacity.
- Payroll and deeper economy costs stay in Phase 8.

## Labor Roles

Use all roles already present in `src/data/config/laborRoles.json`:

- `switch-driver`: moves trailers from yard to doors and later from doors back to yard.
- `unload`: unloads inbound trailers.
- `storage`: moves dock freight into compatible storage.
- `pick`: picks outbound orders from stored inventory.
- `load`: loads picked freight into outbound trailers.
- `sanitation`: reduces condition and congestion pressure.
- `management`: improves coordination and softens overload penalties.

## State Model

Add a `labor` branch to `GameState`.

```ts
interface LaborState {
  totalHeadcount: number;
  unassignedHeadcount: number;
  pools: LaborPool[];
  modifiers: LaborModifiers;
  pressure: LaborPressureSummary;
}
```

Expand the existing `LaborPool` shape.

```ts
interface LaborPool {
  roleId: LaborRole;
  assignedHeadcount: number;
  availableHeadcount: number;
  baseRate: number;
  effectiveRate: number;
  activeWorkload: number;
  utilization: number;
  pressure: "healthy" | "stable" | "busy" | "strained" | "critical";
}
```

Add centralized labor helpers in `LaborManager`:

- initialize pools from `laborRoles.json`
- assign headcount safely
- calculate role capacity
- calculate utilization and pressure labels
- calculate management and sanitation modifiers
- expose support-role penalties in a readable summary

## Starting Labor

Use this default distribution:

```text
totalHeadcount: 18
switch-driver: 2
unload: 3
storage: 3
pick: 3
load: 3
sanitation: 2
management: 2
unassigned: 0
```

This keeps the existing freight loop playable while still allowing the player to create bottlenecks by reassigning labor.

## Assignment Rules

Implement `AssignLaborCommand` with constructor inputs:

- `roleId`
- `headcount`

Behavior:

- reject unknown roles
- reject negative, non-integer, or non-finite headcount
- fail if total assigned headcount would exceed `labor.totalHeadcount`
- update the target role on success
- recalculate unassigned headcount on success
- recalculate labor modifiers and pressure on success
- update debug command metadata through existing command dispatch
- emit `labor-assigned` on success

Assignment failures should be explicit. The command should return a failure reason that the UI can show, such as `Assignment exceeds total headcount`.

Do not automatically pull workers from other roles in Phase 7.

## Processing Rules

Update existing systems to consume labor capacity instead of fixed assumptions alone.

### Switch Drivers

- No `switch-driver` labor means yard trailers cannot be assigned to doors or moved.
- Assigned switch drivers limit concurrent switch movements.
- MVP rule: one switch driver supports one active switch movement at a time.
- Existing switch movement duration remains 8 ticks.
- Understaffing switch drivers increases yard queue pressure.

### Unload

- Current base rate is `120 cu ft/tick`.
- New formula: `assigned unload headcount * 120 * modifiers`.
- No unload labor means trailers at doors do not unload.
- Door dwell and unload pressure increase while freight waits.

### Storage

- Current storage placement is instant when compatible capacity exists.
- Phase 7 should make storage labor matter by adding putaway progress.
- Add a simple batch state such as `storing`, or add storage progress fields such as `remainingStorageCubicFeet`.
- Formula: `assigned storage headcount * 120 * modifiers`.
- Storage still honors compatibility, validity, capacity, and whole-batch fit.
- No storage labor means dock freight remains on dock even when valid storage exists.

### Pick

- Current base rate is `120 cu ft/tick`.
- New formula: `assigned pick headcount * 120 * modifiers`.
- No pick labor means picking does not progress.
- Keep whole-batch reservation rules from Phase 6.

### Load

- Current base rate is `120 cu ft/tick`.
- New formula: `assigned load headcount * 120 * modifiers`.
- No load labor means picked freight waits even when an outbound door exists.

### Sanitation

- Sanitation should be assignable in real time.
- Understaffed sanitation increases condition pressure and congestion risk.
- Adequate sanitation reduces condition pressure.
- Do not build the full condition/economy system yet; expose a simple modifier and pressure indicator that Phase 8 can deepen.

### Management

- Management should be assignable in real time.
- Understaffed management reduces coordination and worsens overload pressure.
- Adequate management improves effective labor stability through a small modifier.
- Keep the formula centralized and easy to tune.

## Queue Pressure And Bottlenecks

Add queue and labor pressure summaries that help the UI answer: what is stuck, why, and what role helps?

Pressure labels:

```text
healthy: no queue or utilization < 50%
stable: utilization 50-74%
busy: utilization 75-99%
strained: utilization >= 100% with queued work
critical: queued work exists with zero assigned labor
```

Bottleneck ranking should prioritize:

1. critical roles with queued work and zero labor
2. strained roles with growing queues
3. busy roles with high utilization
4. support-role penalties affecting condition, congestion, or coordination
5. stable and healthy roles

Recommended summary fields:

```ts
interface LaborBottleneck {
  roleId: LaborRole;
  label: string;
  pressure: LaborPressure;
  queuedWork: number;
  assignedHeadcount: number;
  effectiveRate: number;
  reason: string;
  recommendation: string;
}
```

## Selectors

Add or complete:

- `selectLaborSummary(state)`
- `selectLaborRoleDetails(state)`
- `selectBottleneckSummary(state)`
- `selectCriticalLaborWarnings(state)`
- `selectQueuePressureSummary(state)`

Selectors should be read-only and should not duplicate mutation rules outside the simulation systems.

## UI Work

Add a labor dialog available during normal simulation.

Dialog behavior:

- shows total and unassigned headcount
- lists every labor role
- provides `+` and `-` controls per role
- dispatches `AssignLaborCommand`
- shows assignment failure feedback when total headcount would be exceeded
- shows each role's pressure label and short explanation

Update the right operations panel:

- show current top bottleneck
- show labor by role with assigned headcount, effective rate, utilization, and pressure
- include support-role penalties such as sanitation or management pressure

Update the bottom KPI bar:

- show top bottleneck label
- show total labor and unassigned labor
- show critical labor warning count

Do not add a Phaser congestion heatmap yet unless it falls out naturally. Visual overlays can wait for the later UI/UX pass.

## Events

Add:

- `labor-assigned`
- reuse or extend `queue-critical` for role-related critical queues
- optionally add `labor-pressure-changed` only if severity changes, not every tick

Avoid event spam. Pressure events should only fire when a role's severity changes.

## Test Plan

Add or extend Vitest coverage for:

- initial labor state includes all configured roles
- default headcount is 18 with the planned starting distribution
- `AssignLaborCommand` updates one role and recalculates unassigned headcount
- invalid role assignment fails
- negative, non-integer, or non-finite assignment fails
- assignment above total headcount fails loudly
- successful assignment emits `labor-assigned`
- command dispatch updates debug command/event metadata
- zero switch-driver labor prevents yard trailer movement
- increasing switch-driver labor allows trailer movement
- zero unload labor prevents unload progress
- unload progress scales with unload headcount
- zero storage labor leaves compatible freight on the dock
- storage labor moves freight into valid compatible storage
- zero pick labor prevents pick progress
- pick labor scales outbound picking
- zero load labor prevents shipment completion
- load labor scales outbound loading
- sanitation understaffing increases condition or congestion pressure
- management understaffing worsens coordination or overload pressure
- bottleneck selector reports the correct critical role

Existing Phase 5 and Phase 6 tests should be updated only where labor-driven rates intentionally replace fixed rates.

## Validation

Run:

```powershell
npm run test
npm run build
```

Manual browser check:

- open the game at the dev server URL
- open the labor dialog during normal simulation
- reduce switch drivers to zero and verify yard trailers stop moving
- restore switch drivers and verify movement resumes
- reduce unload, storage, pick, and load labor and verify the matching queues become strained or critical
- over-assign labor and verify the UI reports a failure
- understaff sanitation and management and verify support penalties appear
- verify the top bottleneck in the right panel updates as labor is reassigned
- verify normal freight flow still completes with adequate labor

## Implementation Order

1. Add `LaborState`, expanded `LaborPool`, labor modifiers, and initialization from config.
2. Implement `LaborManager` calculations and assignment validation.
3. Implement `AssignLaborCommand` and `labor-assigned` event.
4. Wire `labor` into `GameState`, `SimulationRunner`, and selectors.
5. Refactor switch, unload, storage, pick, and load systems to consume labor capacity.
6. Add queue pressure and bottleneck calculation.
7. Add the real-time labor dialog and panel/KPI readouts.
8. Add and update tests.
9. Run test/build validation.
10. Perform manual browser validation.
11. Update `memory-bank/progress.md` with Phase 7 completed work.

## Assumptions

- Phase 7 is about operational labor and bottlenecks, not payroll.
- Real-time reassignment is allowed now; later monthly planning can still influence total headcount or recommended allocations.
- Default labor should preserve the playable freight loop.
- Support-role penalties should be visible but simple until Phase 8 deepens economy, morale, condition, and safety.
- Aggregated queue volumes are enough for MVP; per-worker task objects are not required yet.

