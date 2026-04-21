import type { GameState } from "../../game/simulation/core/GameState";
import {
  selectDoorUtilizationSummary,
  selectInvalidStorageIssueCount,
} from "../../game/simulation/selectors/diagnosticSelectors";
import {
  selectDockStorageNeeds,
  selectOutboundQueueSummary,
  selectStorageCapacitySummary,
} from "../../game/simulation/selectors/queueSelectors";
import type { OverlayMode } from "../store/uiStore";

export interface TutorialHint {
  id: string;
  title: string;
  body: string;
  actionLabel?: string;
  focusTarget?: {
    x: number;
    y: number;
    label: string;
  };
  overlayMode?: OverlayMode;
}

export function selectTutorialHintCandidates(state: GameState): TutorialHint[] {
  const hints: TutorialHint[] = [];
  const validStorageZones = state.warehouseMap.zones.filter(
    (zone) => zone.capacityCubicFeet > 0 && zone.validForStorage,
  );
  const storageCapacity = selectStorageCapacitySummary(state);
  const invalidStorageCount = selectInvalidStorageIssueCount(state);
  const blockedDockNeed = selectDockStorageNeeds(state).find((need) => !need.ready);
  const topBottleneck = state.labor.pressure.topBottleneck;
  const outboundQueues = selectOutboundQueueSummary(state);
  const doors = selectDoorUtilizationSummary(state);

  if (state.planning.isPlanningActive) {
    hints.push({
      id: "planning-intro",
      title: "Monthly planning is your reset point",
      body:
        "Use Forecast for risk, Budgeting for score support, and Productivity to move headcount before live operations resume.",
    });
  }

  if (
    validStorageZones.length === 0 &&
    (storageCapacity.capacityCubicFeet > 0 || invalidStorageCount > 0)
  ) {
    hints.push({
      id: "no-valid-storage",
      title: "Storage needs travel access",
      body:
        "Paint travel first, then keep storage within 3 tiles. Invalid storage cannot receive dock freight.",
      actionLabel: "Show storage risk",
      focusTarget: findFirstInvalidStorageTarget(state),
      overlayMode: "invalid-storage",
    });
  }

  if (blockedDockNeed) {
    hints.push({
      id: "blocked-dock-storage",
      title: `${blockedDockNeed.freightClassName} is blocked on the dock`,
      body: `${blockedDockNeed.reason}. Add compatible storage before dock freight stalls the whole flow.`,
      actionLabel: "Focus dock",
      focusTarget: { x: 32, y: 0, label: "Dock freight" },
      overlayMode: "storage-capacity",
    });
  }

  if (
    state.freightFlow.queues.yardTrailers > 0 &&
    doors.inboundReadyDoors === 0 &&
    doors.activeDoors === 0
  ) {
    hints.push({
      id: "missing-inbound-door",
      title: "Inbound freight needs a dock door",
      body:
        "Place an inbound or flex door on the dock edge so yard trailers can start moving.",
      actionLabel: "Focus dock",
      focusTarget: { x: 32, y: 0, label: "Dock edge" },
      overlayMode: "door-utilization",
    });
  }

  if (outboundQueues.loadQueueCubicFeet > 0 && doors.outboundReadyDoors === 0) {
    hints.push({
      id: "missing-outbound-door",
      title: "Outbound freight needs a loading door",
      body:
        "Picked freight cannot ship until an outbound or flex door is idle and ready to load.",
      actionLabel: "Focus dock",
      focusTarget: { x: 32, y: 0, label: "Outbound dock door" },
      overlayMode: "door-utilization",
    });
  }

  if (topBottleneck?.pressure === "critical") {
    hints.push({
      id: "critical-labor",
      title: `${topBottleneck.label} is your main bottleneck`,
      body: `${topBottleneck.reason} ${topBottleneck.recommendation}`,
      actionLabel: "Show queue pressure",
      overlayMode: "queue-pressure",
    });
  }

  if (state.economy.currentMonthNet < 0 && state.currentTick > 0) {
    hints.push({
      id: "negative-net",
      title: "This month is losing money",
      body:
        "Push more freight out, ease blocked storage, or trim budgets and labor that are not solving the current bottleneck.",
    });
  }

  return hints;
}

function findFirstInvalidStorageTarget(state: GameState) {
  const invalidZone = state.warehouseMap.zones.find(
    (zone) => zone.capacityCubicFeet > 0 && !zone.validForStorage,
  );
  const firstTileIndex = invalidZone?.tileIndexes[0];
  const tile = firstTileIndex === undefined ? null : state.warehouseMap.tiles[firstTileIndex];

  return tile ? { x: tile.x, y: tile.y, label: "Invalid storage" } : undefined;
}
