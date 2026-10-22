import { describe, it, expect } from "vitest";
import {
  empty,
  parseState,
  validPlay,
} from "../../modules/qb-lab/platform/store";
import { formation } from "../../modules/qb-lab/simulation/model";
describe("bounded prototype persistence", () => {
  it("roundtrips supported formats and strips unknown imported fields", () => {
    for (const f of ["tackle", "flag5", "flag7"] as const) {
      const result = parseState(
        JSON.stringify({
          ...empty,
          secret: "not-retained",
          plays: [{ ...formation(f), other: "ignored" }],
        }),
      );
      expect(result.plays[0].format).toBe(f);
      expect(result).not.toHaveProperty("secret");
      expect(result.plays[0]).not.toHaveProperty("other");
    }
  });
  it("rejects malicious, oversized, malformed, duplicate and out-of-bounds playbooks", () => {
    expect(() => parseState("{")).toThrow();
    expect(() => parseState(" ".repeat(250001))).toThrow();
    const p = formation("flag5");
    expect(() =>
      parseState(JSON.stringify({ ...empty, plays: [p, p] })),
    ).toThrow();
    p.players[0].start.x = 101;
    expect(validPlay(p)).toBe(false);
    p.players[0].start.x = 50;
    p.name = "<script>alert(1)</script>";
    expect(validPlay(p)).toBe(false);
  });
  it("rejects forged score ranges and unknown assignment content", () => {
    expect(() =>
      parseState(
        JSON.stringify({
          ...empty,
          activities: [
            {
              id: "x",
              kind: "simulation",
              reference: "study",
              at: new Date().toISOString(),
              points: 100,
            },
          ],
        }),
      ),
    ).toThrow();
    expect(() =>
      parseState(
        JSON.stringify({
          ...empty,
          assignments: [
            { id: "x", profile: "A", drill: "made-up", status: "assigned" },
          ],
        }),
      ),
    ).toThrow();
  });
});
