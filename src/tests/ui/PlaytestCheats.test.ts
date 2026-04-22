import { describe, expect, it } from "vitest";
import {
  appendCheatBuffer,
  PLAYTEST_CASH_CHEAT_CODE,
} from "../../ui/hooks/usePlaytestCheats";

describe("playtest cheats", () => {
  it("keeps only the recent key history needed for matching", () => {
    let buffer = "";

    for (const key of "xxineedcashnow!") {
      buffer = appendCheatBuffer(buffer, key, PLAYTEST_CASH_CHEAT_CODE.length);
    }

    expect(buffer).toBe(PLAYTEST_CASH_CHEAT_CODE);
  });

  it("normalizes typed keys to lowercase", () => {
    let buffer = "";

    for (const key of "INEEDCASHNOW!") {
      buffer = appendCheatBuffer(buffer, key, PLAYTEST_CASH_CHEAT_CODE.length);
    }

    expect(buffer).toBe(PLAYTEST_CASH_CHEAT_CODE);
  });
});
