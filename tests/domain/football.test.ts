import { describe, it, expect } from "vitest";
import { formation, rosterSize } from "../../modules/qb-lab/simulation/model";
import { position } from "../../modules/qb-lab/simulation/engine";
import {
  frontMatches,
  buildDefense,
  buildFlag,
  boxCount,
  coverages,
  fronts,
  personnelGroups,
  nflFlag5,
  recognitionMove,
  validateFormation,
  validRules,
  defenderPosition,
  type Personnel,
} from "../../modules/qb-lab/football/content";
import { empty, parseState } from "../../modules/qb-lab/platform/store";
describe("shared football content contracts", () => {
  it("authors structurally valid formations, eligible X/H/Y/Z and true 10/11/12 personnel", () => {
    for (const format of ["tackle", "flag5", "flag7", "flag8"] as const) {
      const p = formation(format);
      expect(p.players).toHaveLength(rosterSize(format));
      expect(validateFormation(p)).toEqual([]);
      for (const label of ["X", "H", "Y", "Z"])
        expect(p.players.some((a) => a.label === label && a.eligible)).toBe(
          true,
        );
      expect(p.players.filter((a) => a.eligible)).toHaveLength(
        format === "tackle" ? 5 : rosterSize(format) - 1,
      );
    }
    for (const personnel of ["10", "11", "12"] as const) {
      const p = formation("tackle", true, personnel);
      expect(p.players.filter((a) => a.role === "TE")).toHaveLength(
        Number(personnel[1]),
      );
      expect(p.players.filter((a) => a.role === "RB")).toHaveLength(1);
      expect(validateFormation(p)).toEqual([]);
    }
  });
  it("keeps every personnel count independent from front, shell, coverage and pressure", () => {
    for (const personnel of Object.keys(personnelGroups) as Personnel[])
      for (const front of fronts)
        for (const coverage of coverages)
          for (const rush of [3, 4, 6]) {
            const d = buildDefense(
              formation("tackle"),
              personnel,
              front,
              coverage,
              2,
              rush,
            );
            expect(d.players).toHaveLength(11);
            for (const p of d.players)
              for (const at of [p.start, ...p.route]) {
                expect(at.x).toBeGreaterThanOrEqual(0);
                expect(at.x).toBeLessThanOrEqual(100);
                expect(at.y).toBeGreaterThanOrEqual(0);
                expect(at.y).toBeLessThanOrEqual(100);
              }
            for (const role of ["DL", "LB", "DB"] as const)
              expect(d.players.filter((p) => p.role === role)).toHaveLength(
                personnelGroups[personnel][role],
              );
            expect(d.assignments).toHaveLength(11);
            expect(new Set(d.assignments.map((a) => a.player)).size).toBe(11);
            expect(d.assignments.filter((a) => a.job === "rush")).toHaveLength(
              coverage === "Cover 1" ? Math.min(rush, 5) : rush,
            );
            expect(
              new Set(d.players.map((a) => `${a.start.x}:${a.start.y}`)).size,
            ).toBe(11);
          }
  });
  it("represents deep zones, man coverage, split field and a conditional match branch", () => {
    expect(frontMatches("Four-man surface", "Even")).toBe(true);
    expect(frontMatches("Odd", "Three-man surface")).toBe(true);
    expect(frontMatches("Bear", "Odd")).toBe(false);
    const play = formation("tackle");
    for (const [call, count] of [
      ["Cover 0", 0],
      ["Cover 1", 1],
      ["Cover 2", 2],
      ["Cover 3", 3],
      ["Cover 4", 4],
      ["Cover 6", 3],
    ] as const) {
      const d = buildDefense(play, "3-4", "Bear", call, 2, 4);
      expect(
        d.assignments.filter(
          (a) =>
            a.responsibility.startsWith("Deep") ||
            a.responsibility.includes("deep quarter") ||
            a.responsibility.includes("deep half"),
        ),
      ).toHaveLength(count);
    }
    for (const shell of [0, 1, 2] as const) {
      const d = buildDefense(play, "4-3", "Even", "Cover 2", shell, 4);
      expect(d.players.filter((p) => p.start.y < 30)).toHaveLength(shell);
      expect(
        d.assignments.filter((a) => a.responsibility.startsWith("Deep")),
      ).toHaveLength(2);
    }
    const fullMan = buildDefense(play, "4-3", "Even", "Cover 1", 2, 6);
    expect(fullMan.rush).toBe(5);
    expect(fullMan.assignments.filter((a) => a.job === "man")).toHaveLength(5);
    expect(
      new Set(
        fullMan.assignments
          .filter((a) => a.job === "man")
          .map((a) => a.receiver),
      ).size,
    ).toBe(5);
    const man = buildDefense(play, "4-3", "Even", "Cover 1", 2, 4);
    const a = man.assignments.find((a) => a.job === "man")!;
    expect(a.receiver).toBeTruthy();
    const defender = man.players.find((p) => p.id === a.player)!;
    expect(defenderPosition(defender, 4, man.assignments, play.players).x).toBe(
      position(play.players.find((p) => p.id === a.receiver)!, 4).x,
    );
    const match = buildDefense(play, "4-2-5", "Odd", "Quarters match", 1, 3);
    expect(match.assignments.filter((a) => a.job === "match")).toHaveLength(4);
    expect(boxCount(match.players)).toBeGreaterThanOrEqual(0);
  });
  it("validates all requested flag looks and enforces rush depth, release delay and QB-run permission", () => {
    for (const format of ["flag5", "flag7", "flag8"] as const) {
      const rules = { ...nflFlag5, format, rushDelay: 2 };
      for (const example of format === "flag5" ? [0, 1] : [0]) {
        const d = buildFlag(formation(format), example, rules);
        expect(d.players).toHaveLength(rosterSize(format));
        expect(d.assignments.filter((a) => a.job === "rush")).toHaveLength(
          d.look.rush,
        );
        for (const p of d.players.filter((p) => p.role === "rusher")) {
          expect(p.start.y).toBe(56);
          expect(position(p, 1)).toEqual(p.start);
          expect(position(p, 3).y).toBeGreaterThan(p.start.y);
        }
      }
    }
    expect(validRules({ ...nflFlag5, rushYards: NaN }, "flag5")).toBe(false);
    expect(() => buildFlag(formation("flag8"), 0, nflFlag5)).toThrow();
    expect(recognitionMove({ x: 50, y: 75 }, 0, -20, nflFlag5).y).toBe(74);
    expect(
      recognitionMove({ x: 50, y: 75 }, 0, -20, { ...nflFlag5, qbRun: true }).y,
    ).toBe(55);
  });
  it("rejects covered eligible players and duplicate labels; keeps configured labels through bounded storage", () => {
    const p = formation("tackle");
    p.players.find((a) => a.label === "H")!.start.y = 70;
    expect(validateFormation(p).some((i) => i.includes("covered"))).toBe(true);
    const flag = formation("flag8");
    flag.players[2].label = "Slot-A";
    const parsed = parseState(JSON.stringify({ ...empty, plays: [flag] }));
    expect(parsed.plays[0].players[2].label).toBe("Slot-A");
    expect(parsed.plays[0].players[2].eligible).toBe(true);
    flag.players[3].label = "Slot-A";
    expect(validateFormation(flag)).toContain(
      "Labels must be unique within the formation.",
    );
  });
});

it("roundtrips bounded preset identifiers and rejects unrecognized or misplaced assignment data", () => {
  const assignment = {
    id: "a",
    drill: "recognition",
    profile: "A",
    status: "assigned",
    recognition: "t425-c6",
  };
  expect(
    parseState(JSON.stringify({ ...empty, assignments: [assignment] }))
      .assignments[0].recognition,
  ).toBe("t425-c6");
  expect(() =>
    parseState(
      JSON.stringify({
        ...empty,
        assignments: [{ ...assignment, recognition: "unknown" }],
      }),
    ),
  ).toThrow();
  expect(() =>
    parseState(
      JSON.stringify({
        ...empty,
        assignments: [{ ...assignment, drill: "footwork" }],
      }),
    ),
  ).toThrow();
});
