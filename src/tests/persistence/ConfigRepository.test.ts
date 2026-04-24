import { describe, expect, it } from "vitest";
import { ConfigRepository } from "../../persistence/ConfigRepository";

const validConfig = {
  clientProfiles: [],
  contracts: [
    {
      id: "atlas-grocery-network",
      clientName: "Atlas Grocery Network",
      freightClassId: "standard",
      difficultyTag: "capacity",
      inboundIntervalMinTicks: 60,
      inboundIntervalMaxTicks: 120,
      outboundIntervalMinTicks: 180,
      outboundIntervalMaxTicks: 300,
      minMonthlyCubicFeet: 180000,
      maxMonthlyCubicFeet: 280000,
      throughputMultiplier: 1.36,
      lengthMonthsOptions: [3, 4, 6],
      rateMultiplier: 0.94,
      minimumServiceLevelModifier: -2,
      dwellPenaltyRateMultiplier: 0.95,
      challengeNote: "High grocery replenishment volume keeps standard storage under pressure all month.",
    },
  ],
  seasonalCurves: [],
  zoneTypes: [
    { id: "travel", name: "Travel", capacityPerTile: 0 },
    { id: "standard-storage", name: "Standard Storage", capacityPerTile: 500 },
  ],
  freightClasses: [
    {
      id: "standard",
      name: "Standard Freight",
      baseRevenuePerCubicFoot: 0.3,
      compatibleZoneTypes: ["standard-storage"],
    },
  ],
  laborRoles: [
    { id: "switch-driver", name: "Switch Driver", baseRate: 1 },
    { id: "unload", name: "Inbound Unloading", baseRate: 1 },
    { id: "storage", name: "Inbound Storage", baseRate: 1 },
    { id: "pick", name: "Outbound Picking", baseRate: 1 },
    { id: "load", name: "Outbound Loading", baseRate: 1 },
    { id: "inventory-team", name: "Inventory Team", baseRate: 1 },
    { id: "sanitation", name: "Sanitation", baseRate: 1 },
    { id: "management", name: "Management", baseRate: 1 },
  ],
  difficultyModes: [
    {
      id: "relaxed",
      name: "Relaxed",
      startingCash: 250000,
      initialHeadcount: 14,
      forecastAccuracy: 0.9,
      demandVolatility: 0.12,
      inboundIntervalMultiplier: 1.08,
      inboundYardDwellMinTicks: 1,
      inboundYardDwellMaxTicks: 3,
      inboundVolumeMultiplier: 0.95,
      outboundIntervalMultiplier: 1.35,
      outboundVolumeMultiplier: 0.92,
      scoreDecayMultiplier: 0.78,
      serviceTargetMultiplier: 0.88,
    },
  ],
};

describe("ConfigRepository", () => {
  it("validates the checked-in config files", () => {
    const result = new ConfigRepository().validateAll();

    expect(result).toEqual({ success: true, errors: [] });
  });

  it("fails duplicate ids and invalid freight-zone references", () => {
    const result = new ConfigRepository({
      ...validConfig,
      zoneTypes: [
        { id: "travel", name: "Travel", capacityPerTile: 0 },
        { id: "travel", name: "Duplicate", capacityPerTile: 0 },
      ],
      freightClasses: [
        {
          id: "standard",
          name: "Standard Freight",
          baseRevenuePerCubicFoot: 0.3,
          compatibleZoneTypes: ["missing-storage"],
        },
      ],
    }).validateAll();

    expect(result.success).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        "zoneTypes contains duplicate id travel",
        "freightClasses.standard references unknown zone missing-storage",
      ]),
    );
  });

  it("fails when required labor roles are missing", () => {
    const result = new ConfigRepository({
      ...validConfig,
      laborRoles: validConfig.laborRoles.filter((role) => role.id !== "management"),
    }).validateAll();

    expect(result.success).toBe(false);
    expect(result.errors).toContain("laborRoles is missing management");
  });

  it("fails when inbound yard dwell max is below min", () => {
    const result = new ConfigRepository({
      ...validConfig,
      difficultyModes: [
        {
          ...validConfig.difficultyModes[0],
          inboundYardDwellMinTicks: 5,
          inboundYardDwellMaxTicks: 2,
        },
      ],
    }).validateAll();

    expect(result.success).toBe(false);
    expect(result.errors).toContain(
      "difficultyModes.relaxed has inboundYardDwellMaxTicks below minimum",
    );
  });

  it("fails when contract timing max is below min", () => {
    const result = new ConfigRepository({
      ...validConfig,
      contracts: [
        Object.assign({}, validConfig.contracts[0], {
          inboundIntervalMinTicks: 90,
          inboundIntervalMaxTicks: 40,
        }),
      ],
    }).validateAll();

    expect(result.success).toBe(false);
    expect(result.errors).toContain(
      "contracts.atlas-grocery-network has inboundIntervalMaxTicks below minimum",
    );
  });
});
