import freightClasses from "../../../data/config/freightClasses.json";
import type { ActiveContract, ContractOffer, GameState } from "../core/GameState";
import { LABOR_COST_PER_WORKER_PER_TICK } from "../labor/laborCost";

const TICKS_PER_DAY = 1440;
const TICKS_PER_WEEK = TICKS_PER_DAY * 7;
const TICKS_PER_MONTH = TICKS_PER_DAY * 30;

export interface ContractPortfolioCard {
  id: string;
  name: string;
  clientName: string;
  freightClassName: string;
  health: ActiveContract["health"];
  performanceScore: number;
  serviceLevel: number;
  minimumServiceLevel: number;
  revenuePerCubicFoot: number;
  inventoryCubicFeet: number;
  weeklyThroughputCubicFeet: number;
  monthlyThroughputCubicFeet: number;
  estimatedDailyLaborCost: number;
  estimatedDailyHeadcount: number;
  penaltyCostToDate: number;
  operationalChallengeNote: string;
}

export function selectContractOffers(state: GameState): ContractOffer[] {
  return state.contracts.pendingOffers;
}

export function selectAcceptedContractOfferCount(state: GameState): number {
  return state.contracts.pendingOffers.filter((offer) => offer.decision === "accepted").length;
}

export function selectContractPortfolioCards(state: GameState): ContractPortfolioCard[] {
  const totalEmployedHeadcount = state.labor.totalHeadcount;
  const totalDailyLaborCost =
    totalEmployedHeadcount * LABOR_COST_PER_WORKER_PER_TICK * TICKS_PER_DAY;
  const activityWeights = new Map<string, number>();

  for (const contract of state.contracts.activeContracts) {
    const monthlyThroughput = getMonthlyThroughput(state, contract.id);
    const inventoryCubicFeet = getInventoryCubicFeet(state, contract.id);
    activityWeights.set(
      contract.id,
      monthlyThroughput + inventoryCubicFeet * 0.35 + contract.expectedMonthlyThroughputCubicFeet * 0.25,
    );
  }

  const totalActivityWeight = [...activityWeights.values()].reduce((total, weight) => total + weight, 0);

  return state.contracts.activeContracts.map((contract) => {
    const activityShare =
      totalActivityWeight <= 0 ? 0 : (activityWeights.get(contract.id) ?? 0) / totalActivityWeight;

    return {
      id: contract.id,
      name: contract.name,
      clientName: contract.clientName,
      freightClassName: getFreightClassName(contract.freightClassId),
      health: contract.health,
      performanceScore: contract.performanceScore,
      serviceLevel: contract.serviceLevel,
      minimumServiceLevel: contract.minimumServiceLevel,
      revenuePerCubicFoot: contract.revenuePerCubicFoot,
      inventoryCubicFeet: getInventoryCubicFeet(state, contract.id),
      weeklyThroughputCubicFeet: getWeeklyThroughput(state, contract.id),
      monthlyThroughputCubicFeet: getMonthlyThroughput(state, contract.id),
      estimatedDailyLaborCost: totalDailyLaborCost * activityShare,
      estimatedDailyHeadcount: totalEmployedHeadcount * activityShare,
      penaltyCostToDate: contract.penaltyCostToDate,
      operationalChallengeNote: contract.operationalChallengeNote,
    };
  });
}

function getInventoryCubicFeet(state: GameState, contractId: string): number {
  return state.freightFlow.freightBatches
    .filter(
      (batch) =>
        batch.contractId === contractId &&
        batch.state !== "complete" &&
        batch.state !== "loaded",
    )
    .reduce((total, batch) => total + batch.cubicFeet, 0);
}

function getWeeklyThroughput(state: GameState, contractId: string): number {
  const startTick = Math.max(0, state.currentTick - TICKS_PER_WEEK);

  return state.freightFlow.outboundOrders
    .filter(
      (order) =>
        order.contractId === contractId &&
        order.state === "complete" &&
        (order.revenueRecognizedTick ?? Number.MIN_SAFE_INTEGER) >= startTick,
    )
    .reduce((total, order) => total + order.fulfilledCubicFeet, 0);
}

function getMonthlyThroughput(state: GameState, contractId: string): number {
  const startTick = Math.max(0, state.currentTick - TICKS_PER_MONTH);

  return state.freightFlow.outboundOrders
    .filter(
      (order) =>
        order.contractId === contractId &&
        order.state === "complete" &&
        (order.revenueRecognizedTick ?? Number.MIN_SAFE_INTEGER) >= startTick,
    )
    .reduce((total, order) => total + order.fulfilledCubicFeet, 0);
}

function getFreightClassName(freightClassId: string | null): string {
  if (!freightClassId) {
    return "Mixed Freight";
  }

  return freightClasses.find((freightClass) => freightClass.id === freightClassId)?.name ??
    "Freight";
}
