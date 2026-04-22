import freightClasses from "../../../data/config/freightClasses.json";
import type { ActiveContract } from "../core/GameState";
import type { GameState } from "../core/GameState";
import type { DomainEvent } from "../events/DomainEvent";
import { LABOR_COST_PER_WORKER_PER_TICK } from "../labor/laborCost";
import { getBudgetCostPerTick } from "../planning/BudgetPlan";

const BASE_OPERATING_COST_PER_TICK = 0.28;

type EventFactory = <TType extends string>(type: TType) => DomainEvent<TType>;

const revenueByFreightClass = new Map<string, number>(
  freightClasses.map((freightClass) => [
    freightClass.id,
    freightClass.baseRevenuePerCubicFoot,
  ]),
);

export class FinanceSystem {
  update(state: GameState, createEvent: EventFactory): DomainEvent[] {
    const events: DomainEvent[] = [];
    const revenue = this.recognizeShipmentRevenue(state, createEvent, events);
    const laborCost = state.labor.totalHeadcount * LABOR_COST_PER_WORKER_PER_TICK;
    const operatingCost =
      BASE_OPERATING_COST_PER_TICK +
      getBudgetCostPerTick(state.planning.currentPlan.budget) +
      state.labor.modifiers.conditionPressure * 0.01 +
      Math.max(0, 100 - state.scores.condition.value) * 0.005 +
      Math.max(0, 100 - state.scores.safety.value) * 0.005;

    state.economy.revenuePerTick = revenue;
    state.economy.laborCostPerTick = laborCost;
    state.economy.operatingCostPerTick = operatingCost;
    state.economy.lifetimeRevenue += revenue;
    state.economy.lifetimeLaborCost += laborCost;
    state.economy.lifetimeOperatingCost += operatingCost;
    state.economy.currentMonthRevenue += revenue;
    state.economy.currentMonthLaborCost += laborCost;
    state.economy.currentMonthOperatingCost += operatingCost;
    state.economy.lifetimeNet =
      state.economy.lifetimeRevenue -
      state.economy.lifetimeLaborCost -
      state.economy.lifetimeOperatingCost;
    state.economy.currentMonthNet =
      state.economy.currentMonthRevenue -
      state.economy.currentMonthLaborCost -
      state.economy.currentMonthOperatingCost;
    state.cash += revenue - laborCost - operatingCost;

    if (revenue > 0) {
      state.economy.lastRevenueTick = state.currentTick;
    }

    return events;
  }

  private recognizeShipmentRevenue(
    state: GameState,
    createEvent: EventFactory,
    events: DomainEvent[],
  ): number {
    let recognizedRevenue = 0;
    const satisfactionMultiplier = getSatisfactionMultiplier(state);

    for (const order of state.freightFlow.outboundOrders) {
      if (order.state !== "complete" || order.revenueRecognizedTick !== null) {
        continue;
      }

      const contract = getContract(state, order.contractId);
      const orderRevenue = order.freightBatchIds.reduce((total, batchId) => {
        const batch = state.freightFlow.freightBatches.find(
          (candidateBatch) => candidateBatch.id === batchId,
        );

        if (!batch) {
          return total;
        }

        const revenueRate =
          contract?.revenuePerCubicFoot ?? revenueByFreightClass.get(batch.freightClassId) ?? 0;

        return total + batch.cubicFeet * revenueRate * satisfactionMultiplier;
      }, 0);
      const orderPenalty = contract
        ? calculateDwellPenalty(state, order.freightBatchIds, contract)
        : 0;
      const recognizedNetRevenue = Math.max(0, orderRevenue - orderPenalty);

      order.revenueRecognizedTick = state.currentTick;
      order.recognizedRevenue = recognizedNetRevenue;
      order.recognizedPenalty = orderPenalty;
      recognizedRevenue += recognizedNetRevenue;

      if (contract && orderPenalty > 0) {
        contract.penaltyCostToDate += orderPenalty;
        contract.lastPenaltyTick = state.currentTick;
      }

      const event = {
        ...createEvent("revenue-recognized"),
        outboundOrderId: order.id,
        revenue: recognizedNetRevenue,
        penalty: orderPenalty,
      };

      events.push(event);
    }

    return recognizedRevenue;
  }
}

function getContract(state: GameState, contractId: string | null): ActiveContract | null {
  if (!contractId) {
    return null;
  }

  return (
    state.contracts.activeContracts.find((contract) => contract.id === contractId) ?? null
  );
}

function calculateDwellPenalty(
  state: GameState,
  batchIds: string[],
  contract: ActiveContract,
): number {
  const exceededBatch = state.freightFlow.freightBatches.find((batch) => {
    if (!batchIds.includes(batch.id)) {
      return false;
    }

    const completedTick = batch.loadedTick ?? state.currentTick;
    return completedTick - batch.createdTick > contract.dwellPenaltyThresholdTicks;
  });

  if (!exceededBatch) {
    return 0;
  }

  return Math.round(
    batchIds.reduce((total, batchId) => {
      const batch = state.freightFlow.freightBatches.find(
        (candidateBatch) => candidateBatch.id === batchId,
      );

      return total + (batch?.cubicFeet ?? 0) * contract.dwellPenaltyRatePerCubicFoot;
    }, 0) * 100,
  ) / 100;
}

function getSatisfactionMultiplier(state: GameState): number {
  const averageSatisfaction =
    (state.scores.clientSatisfaction.value + state.scores.customerSatisfaction.value) / 2;

  if (averageSatisfaction < 50) {
    return 0.85;
  }

  if (averageSatisfaction >= 90) {
    return 1.1;
  }

  return 1;
}
