import { describe, expect, it } from "vitest";
import { getDifficultyModeById } from "../../game/simulation/config/difficulty";
import { getInboundCubeBandForContract } from "../../game/simulation/contracts/contractVolume";

describe("contract inbound volume", () => {
  it("assigns larger inbound cube bands to larger monthly-throughput contracts", () => {
    const difficultyMode = getDifficultyModeById("standard");
    const smallerBand = getInboundCubeBandForContract(
      {
        expectedMonthlyThroughputCubicFeet: 6000,
        inboundIntervalMinTicks: 180,
        inboundIntervalMaxTicks: 240,
      },
      difficultyMode,
    );
    const largerBand = getInboundCubeBandForContract(
      {
        expectedMonthlyThroughputCubicFeet: 18000,
        inboundIntervalMinTicks: 180,
        inboundIntervalMaxTicks: 240,
      },
      difficultyMode,
    );

    expect(largerBand.targetCubicFeet).toBeGreaterThan(smallerBand.targetCubicFeet);
    expect(largerBand.minCubicFeet).toBeGreaterThanOrEqual(smallerBand.minCubicFeet);
    expect(largerBand.maxCubicFeet).toBeGreaterThanOrEqual(smallerBand.maxCubicFeet);
  });

  it("accounts for difficulty by increasing spawn frequency on harder modes", () => {
    const contract = {
      expectedMonthlyThroughputCubicFeet: 6000,
      inboundIntervalMinTicks: 180,
      inboundIntervalMaxTicks: 240,
    };
    const relaxedBand = getInboundCubeBandForContract(
      contract,
      getDifficultyModeById("relaxed"),
    );
    const brutalBand = getInboundCubeBandForContract(
      contract,
      getDifficultyModeById("brutal"),
    );

    expect(brutalBand.expectedSpawnsPerMonth).toBeGreaterThan(relaxedBand.expectedSpawnsPerMonth);
    expect(brutalBand.targetCubicFeet).toBeLessThan(relaxedBand.targetCubicFeet);
  });
});
