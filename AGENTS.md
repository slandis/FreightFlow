# FreightFlow Agent Notes

## Project Snapshot

FreightFlow is planned as a PC-first, mouse-driven warehouse/logistics simulation game. The core loop combines real-time freight movement with monthly business planning. Players manage a 64x64 isometric warehouse, paint zones, assign labor, process inbound and outbound freight, and balance throughput, cash, morale, safety, customer satisfaction, client satisfaction, and warehouse condition.

Current repository state: documentation only. The source scaffold has not been created yet.

## Source Documents

Primary planning docs live in `memory-bank/`:

- `game-design-document.md`: full design spec, systems, UI/UX, freight/labor/economy rules.
- `project-architecture.md`: recommended Phaser + React + TypeScript architecture.
- `implementation-plan.md`: phased roadmap from empty repo to MVP.
- `starter-repository-layout.md`: suggested Vite/React/Phaser file tree and starter stubs.

Treat these docs as the source of truth until implementation files exist.

## Intended Tech Stack

- Vite
- React
- TypeScript
- Phaser 3
- Zustand for lightweight UI/shared state
- Vitest for tests
- Browser-local persistence for MVP

The simulation core should be plain TypeScript and remain independent of React, Phaser, DOM APIs, and rendering code.

## Architecture Direction

Use a single authoritative simulation state. React and Phaser should render snapshots/selectors and dispatch commands; they should not own game rules.

Core layers:

- `src/game/simulation/`: authoritative game state, commands, events, systems, freight, labor, world, selectors, core runtime.
- `src/game/phaser/`: map rendering, camera, input, overlays, Phaser scenes.
- `src/ui/`: HUD, panels, dialogs, alerts, stores, hooks.
- `src/data/config/`: freight classes, zone types, labor roles, difficulty modes, and later balancing data.
- `src/persistence/`: save/load and config loading.

Prefer command-based mutations for gameplay changes, such as painting zones, changing speed, assigning labor, and applying budget plans.

## Gameplay Baselines

- Warehouse map is a 64x64 tile grid.
- Outer edge tiles are automatically dock zones and should be protected from normal repainting.
- Travel tiles are required for operational access.
- Storage tiles farther than 3 tiles from a travel-zoned tile are invalid.
- Trailer switch movements use a fixed travel distance of 8 tiles.
- Throughput volume is `(Inbound Volume + Outbound Volume) / 2`.
- Initial freight classes: standard, small/fast-turn, bulk, oversize/irregular, special handling.
- Initial labor roles: switch, unload, storage, pick, load, sanitation, management.
- Speed controls: paused, slow, medium, fast.
- At the start of each month, the simulation should switch to slow and open monthly planning.

## Implementation Priorities

Follow the roadmap in `memory-bank/implementation-plan.md`.

Recommended first build sequence:

1. Create a Vite React TypeScript app.
2. Install Phaser, Zustand, Vitest, and supporting TypeScript packages.
3. Add the starter repository layout.
4. Mount React and Phaser together.
5. Create the simulation runner and initial `GameState`.
6. Render a visible 64x64 map with dock edge tiles.
7. Add camera pan/zoom and tile hover.
8. Implement zone painting through simulation commands.
9. Add travel-based storage validation.
10. Wire HUD speed/time/cash basics.

Build thin vertical slices. Prefer playable, testable behavior over broad unfinished abstractions.

## Coding Conventions

- Keep TypeScript strict.
- Keep gameplay formulas centralized and testable.
- Use config files for balancing values instead of hardcoding when practical.
- Use selectors for React and Phaser reads.
- Add unit tests for simulation rules and formulas as they become stable.
- Add integration tests for full workflows once inbound/outbound flows exist.
- Keep comments sparse and useful.
- Avoid unrelated refactors while implementing a focused feature.

## UI/UX Notes

The main screen should start with the usable game experience, not a landing page. The UI should help players answer:

- What is happening right now?
- What is going wrong?
- What action can improve it?

Important UI surfaces:

- top HUD
- left zone/tool palette
- right operations/detail panel
- bottom KPI strip
- alerts center
- monthly planning dialog
- debug overlays for development

Status language should remain consistent: healthy, stable, busy, strained, critical.

## Validation Expectations

Once implementation exists, typical checks should include:

- `npm run build`
- `npm run test`
- visual/manual verification of Phaser map rendering
- browser check for console/runtime errors

If a dev server is needed for frontend work, start it and report the local URL.
