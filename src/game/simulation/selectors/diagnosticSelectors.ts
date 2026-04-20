import type { AlertSeverity, GameState } from "../core/GameState";
import { TileZoneType } from "../types/enums";
import type { DoorNode } from "../world/DoorNode";
import { selectDockStorageNeeds, selectOutboundQueueSummary } from "./queueSelectors";

export type OperationalIssueCategory =
  | "storage"
  | "labor"
  | "door"
  | "queue"
  | "finance"
  | "score"
  | "planning";

export interface FocusTarget {
  x: number;
  y: number;
  label: string;
}

export interface OperationalIssue {
  id: string;
  severity: AlertSeverity;
  category: OperationalIssueCategory;
  title: string;
  detail: string;
  recommendedAction: string;
  focusTarget?: FocusTarget;
}

export interface DoorUtilizationSummary {
  activeDoors: number;
  idleDoors: number;
  busyDoors: number;
  inboundReadyDoors: number;
  outboundReadyDoors: number;
  loadingDoors: number;
  unloadingDoors: number;
}

export interface QueuePressureSummary {
  severity: AlertSeverity;
  yardTrailers: number;
  dockFreightCubicFeet: number;
  storageQueueCubicFeet: number;
  pickQueueCubicFeet: number;
  loadQueueCubicFeet: number;
  totalPressure: number;
}

const severityRank: Record<AlertSeverity, number> = {
  critical: 3,
  warning: 2,
  info: 1,
};

export function selectOperationalIssues(state: GameState): OperationalIssue[] {
  const issues: OperationalIssue[] = [
    ...selectAlertIssues(state),
    ...selectStorageIssues(state),
    ...selectLaborIssues(state),
    ...selectDoorIssues(state),
    ...selectOrderIssues(state),
    ...selectFinanceIssues(state),
  ];
  const uniqueIssues = new Map<string, OperationalIssue>();

  for (const issue of issues) {
    uniqueIssues.set(issue.id, issue);
  }

  return [...uniqueIssues.values()].sort(compareIssues);
}

export function selectMostSevereIssue(state: GameState): OperationalIssue | null {
  return selectOperationalIssues(state)[0] ?? null;
}

export function selectInvalidStorageIssueCount(state: GameState): number {
  return state.warehouseMap.zones.filter(
    (zone) => zone.capacityCubicFeet > 0 && !zone.validForStorage,
  ).length;
}

export function selectDoorUtilizationSummary(state: GameState): DoorUtilizationSummary {
  const doors = state.freightFlow.doors;

  return {
    activeDoors: doors.length,
    idleDoors: doors.filter((door) => door.state === "idle").length,
    busyDoors: doors.filter((door) => door.state !== "idle").length,
    inboundReadyDoors: doors.filter(isInboundReadyDoor).length,
    outboundReadyDoors: doors.filter(isOutboundReadyDoor).length,
    loadingDoors: doors.filter((door) => door.state === "loading").length,
    unloadingDoors: doors.filter((door) => door.state === "unloading").length,
  };
}

export function selectQueuePressureSummary(state: GameState): QueuePressureSummary {
  const queues = state.freightFlow.queues;
  const totalPressure =
    queues.yardTrailers * 0.2 +
    queues.dockFreightCubicFeet / 3000 +
    queues.storageQueueCubicFeet / 3000 +
    queues.pickQueueCubicFeet / 3000 +
    queues.loadQueueCubicFeet / 3000;

  return {
    severity: totalPressure >= 2 ? "critical" : totalPressure >= 0.8 ? "warning" : "info",
    yardTrailers: queues.yardTrailers,
    dockFreightCubicFeet: queues.dockFreightCubicFeet,
    storageQueueCubicFeet: queues.storageQueueCubicFeet,
    pickQueueCubicFeet: queues.pickQueueCubicFeet,
    loadQueueCubicFeet: queues.loadQueueCubicFeet,
    totalPressure,
  };
}

export function selectFocusableIssueTargets(state: GameState): FocusTarget[] {
  return selectOperationalIssues(state)
    .map((issue) => issue.focusTarget)
    .filter((target): target is FocusTarget => Boolean(target));
}

function selectAlertIssues(state: GameState): OperationalIssue[] {
  return state.alerts.alerts
    .filter((alert) => alert.active)
    .map((alert) => ({
      id: `alert-${alert.key}`,
      severity: alert.severity,
      category: alert.key.includes("cash")
        ? "finance"
        : alert.key.includes("service")
          ? "planning"
          : "score",
      title: alert.message,
      detail: "A tracked business health threshold needs attention.",
      recommendedAction: getAlertRecommendation(alert.key),
    }));
}

function selectStorageIssues(state: GameState): OperationalIssue[] {
  const issues: OperationalIssue[] = [];
  const invalidZones = state.warehouseMap.zones.filter(
    (zone) => zone.capacityCubicFeet > 0 && !zone.validForStorage,
  );
  const firstInvalidZone = invalidZones[0];

  if (firstInvalidZone) {
    const targetTile = state.warehouseMap.tiles[firstInvalidZone.tileIndexes[0]];

    issues.push({
      id: "invalid-storage",
      severity: "warning",
      category: "storage",
      title: "Storage zone is invalid",
      detail: `${invalidZones.length} storage zone${invalidZones.length === 1 ? "" : "s"} need travel access.`,
      recommendedAction: "Paint travel tiles within 3 tiles of storage or erase the invalid area.",
      focusTarget: targetTile
        ? { x: targetTile.x, y: targetTile.y, label: "Invalid storage" }
        : undefined,
    });
  }

  const blockedStorageNeed = selectDockStorageNeeds(state).find((need) => !need.ready);

  if (blockedStorageNeed) {
    issues.push({
      id: `dock-storage-${blockedStorageNeed.freightClassId}`,
      severity: "critical",
      category: "storage",
      title: "Dock freight needs storage",
      detail: `${blockedStorageNeed.freightClassName}: ${blockedStorageNeed.reason}.`,
      recommendedAction: `Paint valid ${blockedStorageNeed.compatibleZoneNames.join(" or ")} near travel.`,
      focusTarget: selectDockFocusTarget(state),
    });
  }

  return issues;
}

function selectLaborIssues(state: GameState): OperationalIssue[] {
  const topBottleneck = state.labor.pressure.topBottleneck;

  if (!topBottleneck) {
    return [];
  }

  return [
    {
      id: `labor-${topBottleneck.roleId}`,
      severity: topBottleneck.pressure === "critical" ? "critical" : "warning",
      category: "labor",
      title: `${topBottleneck.label} is ${topBottleneck.pressure}`,
      detail: topBottleneck.reason,
      recommendedAction: topBottleneck.recommendation,
    },
  ];
}

function selectDoorIssues(state: GameState): OperationalIssue[] {
  const issues: OperationalIssue[] = [];
  const hasWaitingInbound = state.freightFlow.queues.yardTrailers > 0;
  const hasWaitingOutbound = state.freightFlow.queues.loadQueueCubicFeet > 0;
  const hasInboundDoor = state.freightFlow.doors.some(isInboundReadyDoor);
  const hasOutboundDoor = state.freightFlow.doors.some(isOutboundReadyDoor);

  if (hasWaitingInbound && !hasInboundDoor) {
    issues.push({
      id: "no-inbound-door",
      severity: "warning",
      category: "door",
      title: "No inbound door is ready",
      detail: "Inbound trailers are waiting without an idle inbound-capable door.",
      recommendedAction: "Place or free an inbound or flex door.",
      focusTarget: selectDockFocusTarget(state),
    });
  }

  if (hasWaitingOutbound && !hasOutboundDoor) {
    issues.push({
      id: "no-outbound-door",
      severity: "warning",
      category: "door",
      title: "No outbound door is ready",
      detail: "Picked freight is waiting without an idle outbound-capable door.",
      recommendedAction: "Place or free an outbound or flex door.",
      focusTarget: selectDockFocusTarget(state),
    });
  }

  return issues;
}

function selectOrderIssues(state: GameState): OperationalIssue[] {
  const outboundQueues = selectOutboundQueueSummary(state);

  if (outboundQueues.blockedOrders <= 0) {
    return [];
  }

  return [
    {
      id: "blocked-outbound-orders",
      severity: "critical",
      category: "queue",
      title: "Outbound orders are blocked",
      detail: `${outboundQueues.blockedOrders} outbound order${outboundQueues.blockedOrders === 1 ? "" : "s"} cannot reserve inventory.`,
      recommendedAction: "Build compatible storage and process matching inbound freight.",
      focusTarget: selectDockFocusTarget(state),
    },
  ];
}

function selectFinanceIssues(state: GameState): OperationalIssue[] {
  if (state.economy.currentMonthNet >= 0) {
    return [];
  }

  return [
    {
      id: "negative-net",
      severity: state.cash < 25000 ? "critical" : "warning",
      category: "finance",
      title: "Monthly net is negative",
      detail: "Costs are currently running ahead of revenue.",
      recommendedAction: "Increase outbound throughput or reduce budget and labor pressure.",
    },
  ];
}

function getAlertRecommendation(key: string): string {
  if (key.includes("cash")) {
    return "Improve outbound throughput or reduce spending.";
  }

  if (key.includes("morale")) {
    return "Reduce severe bottlenecks and protect support staffing.";
  }

  if (key.includes("safety")) {
    return "Reduce congestion and protect safety or management support.";
  }

  if (key.includes("condition")) {
    return "Add sanitation support, reduce congestion, or fund maintenance.";
  }

  if (key.includes("customer")) {
    return "Clear blocked outbound orders and loading backlog.";
  }

  if (key.includes("client") || key.includes("service")) {
    return "Raise throughput toward the active contract target.";
  }

  return "Inspect the related operations panel section.";
}

function selectDockFocusTarget(state: GameState): FocusTarget | undefined {
  const busyDoor =
    state.freightFlow.doors.find((door) => door.state !== "idle") ?? state.freightFlow.doors[0];

  return busyDoor ? { x: busyDoor.x, y: busyDoor.y, label: "Dock doors" } : undefined;
}

function isInboundReadyDoor(door: DoorNode): boolean {
  return door.state === "idle" && (door.mode === "inbound" || door.mode === "flex");
}

function isOutboundReadyDoor(door: DoorNode): boolean {
  return door.state === "idle" && (door.mode === "outbound" || door.mode === "flex");
}

function compareIssues(first: OperationalIssue, second: OperationalIssue): number {
  const severityDifference = severityRank[second.severity] - severityRank[first.severity];

  if (severityDifference !== 0) {
    return severityDifference;
  }

  return first.title.localeCompare(second.title);
}

export function selectStorageOverlayTiles(state: GameState) {
  return state.warehouseMap.tiles.filter(
    (tile) =>
      tile.zoneType !== TileZoneType.Unassigned &&
      tile.zoneType !== TileZoneType.Dock &&
      tile.zoneType !== TileZoneType.Travel,
  );
}
