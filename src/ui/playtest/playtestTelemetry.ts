import { getDifficultyModeById } from "../../game/simulation/config/difficulty";
import type { BudgetPlan, GameState } from "../../game/simulation/core/GameState";
import { selectQueuePressureSummary } from "../../game/simulation/selectors/diagnosticSelectors";
import { selectOutboundQueueSummary } from "../../game/simulation/selectors/queueSelectors";

export interface PlaytestMonthAccumulator {
  monthKey: string;
  sampleCount: number;
  totalQueuePressure: number;
  peakQueuePressure: number;
  totalDockFreightCubicFeet: number;
  peakDockFreightCubicFeet: number;
  totalInvalidStorageCount: number;
  peakInvalidStorageCount: number;
  totalBlockedOutboundOrders: number;
  peakBlockedOutboundOrders: number;
  laborBottleneckFrequency: Record<string, number>;
}

export interface PlaytestMonthRecord {
  monthKey: string;
  difficultyModeId: string;
  difficultyName: string;
  endingCash: number;
  monthlyNet: number;
  throughputCubicFeet: number;
  serviceLevel: number;
  avgQueuePressure: number;
  peakQueuePressure: number;
  avgDockFreightCubicFeet: number;
  peakDockFreightCubicFeet: number;
  avgInvalidStorageCount: number;
  peakInvalidStorageCount: number;
  avgBlockedOutboundOrders: number;
  peakBlockedOutboundOrders: number;
  laborBottleneckFrequency: Record<string, number>;
  budget: BudgetPlan;
}

export function createPlaytestMonthAccumulator(monthKey: string): PlaytestMonthAccumulator {
  return {
    monthKey,
    sampleCount: 0,
    totalQueuePressure: 0,
    peakQueuePressure: 0,
    totalDockFreightCubicFeet: 0,
    peakDockFreightCubicFeet: 0,
    totalInvalidStorageCount: 0,
    peakInvalidStorageCount: 0,
    totalBlockedOutboundOrders: 0,
    peakBlockedOutboundOrders: 0,
    laborBottleneckFrequency: {},
  };
}

export function samplePlaytestMonth(
  accumulator: PlaytestMonthAccumulator,
  state: GameState,
): PlaytestMonthAccumulator {
  const queuePressure = selectQueuePressureSummary(state).totalPressure;
  const invalidStorageCount = state.warehouseMap.zones.filter(
    (zone) => zone.capacityCubicFeet > 0 && !zone.validForStorage,
  ).length;
  const blockedOutboundOrders = selectOutboundQueueSummary(state).blockedOrders;
  const topBottleneckRole = state.labor.pressure.topBottleneck?.roleId;

  accumulator.sampleCount += 1;
  accumulator.totalQueuePressure += queuePressure;
  accumulator.peakQueuePressure = Math.max(accumulator.peakQueuePressure, queuePressure);
  accumulator.totalDockFreightCubicFeet += state.freightFlow.queues.dockFreightCubicFeet;
  accumulator.peakDockFreightCubicFeet = Math.max(
    accumulator.peakDockFreightCubicFeet,
    state.freightFlow.queues.dockFreightCubicFeet,
  );
  accumulator.totalInvalidStorageCount += invalidStorageCount;
  accumulator.peakInvalidStorageCount = Math.max(
    accumulator.peakInvalidStorageCount,
    invalidStorageCount,
  );
  accumulator.totalBlockedOutboundOrders += blockedOutboundOrders;
  accumulator.peakBlockedOutboundOrders = Math.max(
    accumulator.peakBlockedOutboundOrders,
    blockedOutboundOrders,
  );

  if (topBottleneckRole) {
    accumulator.laborBottleneckFrequency[topBottleneckRole] =
      (accumulator.laborBottleneckFrequency[topBottleneckRole] ?? 0) + 1;
  }

  return accumulator;
}

export function finalizePlaytestMonth(
  accumulator: PlaytestMonthAccumulator,
  state: GameState,
): PlaytestMonthRecord {
  const difficultyMode = getDifficultyModeById(state.difficultyModeId);
  const sampleCount = Math.max(1, accumulator.sampleCount);
  const budget = state.planning.pendingPlan?.budget ?? state.planning.currentPlan.budget;

  return {
    monthKey: accumulator.monthKey,
    difficultyModeId: difficultyMode.id,
    difficultyName: difficultyMode.name,
    endingCash: state.cash,
    monthlyNet: state.planning.latestSnapshot?.currentMonthNet ?? state.economy.currentMonthNet,
    throughputCubicFeet:
      state.planning.latestSnapshot?.throughputCubicFeet ?? state.kpis.throughputCubicFeet,
    serviceLevel: state.planning.latestSnapshot?.serviceLevel ?? state.contracts.serviceLevel,
    avgQueuePressure: accumulator.totalQueuePressure / sampleCount,
    peakQueuePressure: accumulator.peakQueuePressure,
    avgDockFreightCubicFeet: accumulator.totalDockFreightCubicFeet / sampleCount,
    peakDockFreightCubicFeet: accumulator.peakDockFreightCubicFeet,
    avgInvalidStorageCount: accumulator.totalInvalidStorageCount / sampleCount,
    peakInvalidStorageCount: accumulator.peakInvalidStorageCount,
    avgBlockedOutboundOrders: accumulator.totalBlockedOutboundOrders / sampleCount,
    peakBlockedOutboundOrders: accumulator.peakBlockedOutboundOrders,
    laborBottleneckFrequency: { ...accumulator.laborBottleneckFrequency },
    budget: { ...budget },
  };
}

export function formatPlaytestReview(records: PlaytestMonthRecord[]): string {
  if (records.length === 0) {
    return "No completed month reviews yet. Reach the next planning screen to capture one.";
  }

  return records
    .map((record) =>
      [
        `${record.monthKey} | ${record.difficultyName}`,
        `Net $${Math.round(record.monthlyNet).toLocaleString()} | Cash $${Math.round(record.endingCash).toLocaleString()} | Service ${record.serviceLevel.toFixed(0)}%`,
        `Queue avg ${record.avgQueuePressure.toFixed(2)} peak ${record.peakQueuePressure.toFixed(2)} | Dock avg ${Math.round(record.avgDockFreightCubicFeet).toLocaleString()} peak ${Math.round(record.peakDockFreightCubicFeet).toLocaleString()} cu ft`,
        `Invalid storage avg ${record.avgInvalidStorageCount.toFixed(1)} peak ${record.peakInvalidStorageCount} | Blocked orders avg ${record.avgBlockedOutboundOrders.toFixed(1)} peak ${record.peakBlockedOutboundOrders}`,
        `Top bottlenecks: ${formatBottlenecks(record.laborBottleneckFrequency)}`,
      ].join("\n"),
    )
    .join("\n\n");
}

function formatBottlenecks(frequency: Record<string, number>): string {
  const topEntries = Object.entries(frequency)
    .sort((first, second) => second[1] - first[1])
    .slice(0, 3);

  if (topEntries.length === 0) {
    return "none";
  }

  return topEntries
    .map(([roleId, count]) => `${roleId} (${count})`)
    .join(", ");
}
