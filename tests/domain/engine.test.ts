// @vitest-environment node
import { describe, it, expect } from "vitest";
import {
  advance,
  evaluate,
  moveQB,
  position,
} from "../../modules/qb-lab/simulation/engine";
import {
  formation,
  rosterSize,
  type Scenario,
} from "../../modules/qb-lab/simulation/model";
import { scenarios } from "../../modules/qb-lab/simulation/scenarios";
describe("deterministic 2D engine", () => {
  it("bounds timing and samples identical paths independent of frame chunks", () => {
    expect(advance(1, 1, 0.5)).toBe(1.5);
    expect(advance(5, 20)).toBe(6);
    expect(advance(1, -1)).toBe(1);
    const p = {
      id: "X",
      label: "X",
      start: { x: 0, y: 60 },
      route: [{ x: 60, y: 0 }],
    };
    expect(position(p, 3)).toEqual({ x: 30, y: 30 });
    expect(position(p, 99)).toEqual({ x: 60, y: 0 });
    expect(position(p, -1)).toEqual(p.start);
  });
  it("bounds keyboard/touch movement and separates all roster sizes", () => {
    expect(moveQB({ x: 30, y: 74 }, -100, -100)).toEqual({ x: 30, y: 74 });
    expect(moveQB({ x: 70, y: 94 }, 100, 100)).toEqual({ x: 70, y: 94 });
    for (const f of ["tackle", "flag5", "flag7"] as const) {
      expect(formation(f).players).toHaveLength(rosterSize(f));
      expect(new Set(formation(f).players.map((p) => p.id)).size).toBe(
        rosterSize(f),
      );
    }
  });
  it("scores only the explicit geometry/time fixture, including the exact threshold", () => {
    const s: Scenario = {
      ...scenarios[0],
      play: {
        ...formation("flag5"),
        players: [
          {
            id: "X",
            label: "X",
            start: { x: 20, y: 40 },
            route: [{ x: 20, y: 40 }],
          },
        ],
      },
      defenders: [{ id: "D", label: "D", start: { x: 32, y: 40 }, route: [] }],
    };
    expect(evaluate(s, "X", 2, { x: 50, y: 85 }).points).toBe(2);
    expect(evaluate(s, "X", 1.49, { x: 50, y: 85 }).points).toBe(0);
    expect(evaluate(s, "X", 6, { x: 50, y: 85 }).points).toBe(0);
    expect(evaluate(s, "missing", 2, { x: 50, y: 85 }).points).toBe(0);
    s.defenders[0].start.x = 31;
    expect(evaluate(s, "X", 2, { x: 50, y: 85 }).points).toBe(1);
    expect(evaluate(s, "X", 2, { x: 50, y: 30 }).points).toBe(0);
  });
  it("has deterministic finite movement for every authored tackle and flag scenario", () => {
    for (const s of scenarios) {
      for (const t of [0, 1.5, 3, 5.9, 6]) {
        for (const p of [...s.play.players, ...s.defenders]) {
          const at = position(p, t);
          expect(at.x).toBeGreaterThanOrEqual(0);
          expect(at.x).toBeLessThanOrEqual(100);
          expect(at.y).toBeGreaterThanOrEqual(0);
          expect(at.y).toBeLessThanOrEqual(100);
          expect(position(p, t)).toEqual(at);
        }
      }
    }
  });
});
