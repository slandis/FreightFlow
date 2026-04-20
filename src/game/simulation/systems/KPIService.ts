import type { GameState } from "../core/GameState";

export class KPIService {
  update(state: GameState): void {
    state.kpis.inboundCubicFeet = state.freightFlow.metrics.totalUnloadedCubicFeet;
    state.kpis.outboundCubicFeet = state.freightFlow.metrics.totalOutboundCubicFeetShipped;
    state.kpis.throughputCubicFeet =
      (state.kpis.inboundCubicFeet + state.kpis.outboundCubicFeet) / 2;
    state.kpis.revenue = state.economy.currentMonthRevenue;
    state.kpis.laborCost = state.economy.currentMonthLaborCost;
    state.kpis.operatingCost = state.economy.currentMonthOperatingCost;
    state.kpis.netOperatingResult = state.economy.currentMonthNet;
    state.kpis.moraleScore = state.scores.morale.value;
    state.kpis.conditionScore = state.scores.condition.value;
    state.kpis.safetyScore = state.scores.safety.value;
    state.kpis.clientSatisfactionScore = state.scores.clientSatisfaction.value;
    state.kpis.customerSatisfactionScore = state.scores.customerSatisfaction.value;
  }
}
