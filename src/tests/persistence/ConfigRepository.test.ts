import { describe, expect, it } from "vitest";
import { ConfigRepository } from "../../persistence/ConfigRepository";

const validConfig = {
  clientProfiles: [],
  contracts: [],
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
    { id: "sanitation", name: "Sanitation", baseRate: 1 },
    { id: "management", name: "Management", baseRate: 1 },
  ],
  difficultyModes: [
    {
      id: "amateur",
      name: "Amateur",
      startingCash: 250000,
      forecastAccuracy: 0.9,
      demandVolatility: 0.12,
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
});
