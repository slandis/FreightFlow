import { describe, expect, it } from "vitest";
import { RandomService } from "../../game/simulation/core/RandomService";

describe("RandomService", () => {
  it("produces deterministic sequences for the same seed", () => {
    const first = new RandomService(42);
    const second = new RandomService(42);

    expect([first.next(), first.next(), first.next()]).toEqual([
      second.next(),
      second.next(),
      second.next(),
    ]);
  });

  it("returns inclusive integers within the requested range", () => {
    const random = new RandomService(7);

    for (let index = 0; index < 20; index += 1) {
      const value = random.nextInt(2, 4);
      expect(value).toBeGreaterThanOrEqual(2);
      expect(value).toBeLessThanOrEqual(4);
    }
  });
});
