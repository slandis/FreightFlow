import { describe, expect, it } from "vitest";
import {
  activateAcceptedContractOffers,
  generateMonthlyContractOffers,
} from "../../game/simulation/contracts/contractOffers";
import { SimulationRunner } from "../../game/simulation/core/SimulationRunner";

describe("contract offers", () => {
  it("generates four diverse offers with unique company names", () => {
    const runner = new SimulationRunner({ seed: 7 });
    const offers = generateMonthlyContractOffers(
      runner.getState(),
      "Y1-M2",
      runner.getRandomService(),
    );

    expect(offers).toHaveLength(4);
    expect(new Set(offers.map((offer) => offer.clientName)).size).toBe(4);
    expect(new Set(offers.map((offer) => offer.freightClassId)).size).toBeGreaterThanOrEqual(2);
    expect(new Set(offers.map((offer) => offer.difficultyTag)).size).toBeGreaterThanOrEqual(2);
    expect(
      Math.max(...offers.map((offer) => offer.expectedMonthlyThroughputCubicFeet)) -
        Math.min(...offers.map((offer) => offer.expectedMonthlyThroughputCubicFeet)),
    ).toBeGreaterThanOrEqual(10000);
    expect(
      offers.every(
        (offer) =>
          offer.inboundIntervalMinTicks > 0 &&
          offer.inboundIntervalMaxTicks >= offer.inboundIntervalMinTicks &&
          offer.outboundIntervalMinTicks > 0 &&
          offer.outboundIntervalMaxTicks >= offer.outboundIntervalMinTicks,
      ),
    ).toBe(true);
  });

  it("avoids re-offering completed client names while enough unused templates remain", () => {
    const runner = new SimulationRunner({ seed: 11 });
    const state = runner.getState();

    state.contracts.completedContracts.push(
      {
        ...state.contracts.activeContracts[0],
        id: "completed-contract-1",
        clientName: "Atlas Grocery Network",
      },
      {
        ...state.contracts.activeContracts[0],
        id: "completed-contract-2",
        clientName: "QuickCart Digital Fulfillment",
      },
    );

    const offers = generateMonthlyContractOffers(state, "Y1-M2", runner.getRandomService());

    expect(offers.map((offer) => offer.clientName)).not.toContain("Atlas Grocery Network");
    expect(offers.map((offer) => offer.clientName)).not.toContain("QuickCart Digital Fulfillment");
  });

  it("seeds next eligible inbound and outbound ticks when accepted offers activate", () => {
    const runner = new SimulationRunner({ seed: 17 });
    const state = runner.getState();

    state.contracts.pendingOffers = generateMonthlyContractOffers(
      state,
      "Y1-M2",
      runner.getRandomService(),
    );
    state.contracts.pendingOffers[0].decision = "accepted";
    const acceptedClientName = state.contracts.pendingOffers[0].clientName;

    activateAcceptedContractOffers(state, runner.getRandomService());

    const accepted = state.contracts.activeContracts.find(
      (contract) => contract.clientName === acceptedClientName,
    );

    expect(state.contracts.pendingOffers).toHaveLength(0);
    expect(accepted?.nextInboundEligibleTick).toBeGreaterThan(state.currentTick);
    expect(accepted?.nextOutboundEligibleTick).toBeGreaterThan(state.currentTick);
  });
});
