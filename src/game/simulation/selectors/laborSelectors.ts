import type { GameState } from "../core/GameState";
import type { LaborBottleneck, LaborPool } from "../labor/LaborPool";

export function selectLaborSummary(state: GameState) {
  return {
    totalHeadcount: state.labor.totalHeadcount,
    unassignedHeadcount: state.labor.unassignedHeadcount,
    criticalCount: state.labor.pressure.criticalCount,
    topBottleneck: state.labor.pressure.topBottleneck,
    productivityMultiplier: state.labor.modifiers.productivityMultiplier,
    conditionPressure: state.labor.modifiers.conditionPressure,
  };
}

export function selectLaborRoleDetails(state: GameState): LaborPool[] {
  return [...state.labor.pools].sort((first, second) =>
    first.roleId.localeCompare(second.roleId),
  );
}

export function selectBottleneckSummary(state: GameState): LaborBottleneck | null {
  return state.labor.pressure.topBottleneck;
}

export function selectCriticalLaborWarnings(state: GameState): LaborBottleneck[] {
  return state.labor.pressure.bottlenecks.filter(
    (bottleneck) => bottleneck.pressure === "critical",
  );
}

export function selectQueuePressureSummary(state: GameState): LaborBottleneck[] {
  return state.labor.pressure.bottlenecks;
}
