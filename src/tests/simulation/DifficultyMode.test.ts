import { describe, expect, it } from "vitest";
import { SimulationRunner } from "../../game/simulation/core/SimulationRunner";
import { LaborRole } from "../../game/simulation/types/enums";

function setSupportHeadcount(runner: SimulationRunner, roleId: LaborRole, headcount: number) {
  const pool = runner.getState().labor.pools.find((candidate) => candidate.roleId === roleId);

  if (!pool) {
    throw new Error(`Missing labor pool ${roleId}`);
  }

  pool.assignedHeadcount = headcount;
  pool.availableHeadcount = headcount;
}

describe("difficulty modes", () => {
  it("applies configured starting cash when a non-default mode is selected", () => {
    const runner = new SimulationRunner({ difficultyModeId: "relaxed" });

    expect(runner.getState().difficultyModeId).toBe("relaxed");
    expect(runner.getState().cash).toBe(225000);
  });

  it("creates inbound pressure more slowly on relaxed than standard", () => {
    const relaxedRunner = new SimulationRunner({ difficultyModeId: "relaxed", seed: 7 });
    const standardRunner = new SimulationRunner({ difficultyModeId: "standard", seed: 7 });

    for (let tick = 0; tick < 120; tick += 1) {
      relaxedRunner.tick();
      standardRunner.tick();
    }

    expect(standardRunner.getState().freightFlow.metrics.totalInboundTrailersArrived).toBe(2);
    expect(relaxedRunner.getState().freightFlow.metrics.totalInboundTrailersArrived).toBe(1);
  });

  it("scales negative score pressure more gently on relaxed", () => {
    const relaxedRunner = new SimulationRunner({ difficultyModeId: "relaxed" });
    const standardRunner = new SimulationRunner({ difficultyModeId: "standard" });

    for (const runner of [relaxedRunner, standardRunner]) {
      setSupportHeadcount(runner, LaborRole.Management, 0);
      setSupportHeadcount(runner, LaborRole.Sanitation, 0);
      runner.getState().scores.condition.value = 45;
      runner.getState().scores.safety.value = 45;
    }

    relaxedRunner.tick();
    standardRunner.tick();

    expect(relaxedRunner.getState().scores.morale.value).toBeGreaterThan(
      standardRunner.getState().scores.morale.value,
    );
    expect(relaxedRunner.getState().scores.safety.value).toBeGreaterThan(
      standardRunner.getState().scores.safety.value,
    );
  });
});
