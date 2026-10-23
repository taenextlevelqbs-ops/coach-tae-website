// @vitest-environment node
import { describe, expect, it } from "vitest";
import { defaultConfig } from "@/modules/qb-lab/live-engine/defaults";
import { createEngine, snap, step, advanceTicks } from "@/modules/qb-lab/live-engine/engine";
import { resolveBlocks, scanProtection } from "@/modules/qb-lab/live-engine/blocking";
import { advanceBall } from "@/modules/qb-lab/live-engine/physics";
import type { EngineState } from "@/modules/qb-lab/live-engine/types";

function singleEngagement() {
  const s = snap(createEngine(defaultConfig()));
  const b = s.players.find((p) => p.job === "block")!;
  const r = s.players.find((p) => p.job === "rush")!;
  s.plan = { [b.id]: r.id };
  b.pos = { x: r.pos.x, y: r.pos.y - 0.7 };
  return { s, b, r };
}
function physicsOnly(s: EngineState) {
  return { ...s, config: undefined, pocket: undefined };
}
describe("event-driven pass protection", () => {
  it("assigns each tackle its reachable edge rather than crossing LT to the right while RT stands idle", () => {
    const c = { ...defaultConfig(), matchup: "offense-edge" as const };
    const s = snap(createEngine(c));
    const center = s.players.find((p) => p.role === "C")!;
    for (const label of ["LT", "RT"]) {
      const blocker = s.players.find((p) => p.label === label)!;
      const threat = s.players.find((p) => p.id === s.plan[blocker.id])!;
      expect(Math.sign(threat.start.x - center.start.x)).toBe(Math.sign(blocker.start.x - center.start.x));
      const result = advanceTicks(s, 60);
      expect(result.events.some((e) => e.kind === "engage" && e.actors?.includes(blocker.id))).toBe(true);
    }
    expect(Object.keys(s.plan)).toHaveLength(5);
    expect(new Set(Object.values(s.plan)).size).toBe(4);
  });
  it("the instructional timer cannot change any physical event or outcome with four or six rushers", () => {
    for (const rushers of [4, 6]) {
      const c = defaultConfig();
      c.rules.rushers = rushers;
      const on = snap(createEngine({ ...c, pocketPreset: true }));
      // Even an expired display cannot force any blocker to lose.
      on.pocket!.deadline = 0;
      let a = on, b = snap(createEngine(c));
      for (let tick = 0; tick < 240; tick++) {
        const input = tick > 50 && tick < 65 ? { move: { x: 0, y: 1 } } : {};
        a = step(a, input); b = step(b, input);
        expect(physicsOnly(a)).toEqual(physicsOnly(b));
      }
      expect(a.pocket!.deadline).toBe(0);
      expect(a.events.some((e) => /pocket-(break|reset)/.test(e.kind))).toBe(false);
    }
  });
  it("a squared stronger blocker holds beyond three seconds, but losing an actual shoulder weakens control", () => {
    const { s, b, r } = singleEngagement();
    b.ratings.passBlock = b.ratings.anchor = 0.95;
    r.ratings.power = r.ratings.strength = 0.4;
    const start = { ...b.pos };
    for (let i = 0; i < 150; i++) { s.tick++; resolveBlocks(s, 1 / 30); }
    expect(s.engagements).toHaveLength(1);
    expect(s.engagements[0].control).toBeGreaterThan(0.9);
    expect(s.events.filter((e) => e.kind === "shed")).toHaveLength(0);
    expect(b.pos).toEqual(start);
    const centered = singleEngagement();
    const shoulder = structuredClone(centered.s);
    shoulder.players.find((p) => p.id === centered.r.id)!.pos.x += 1.2;
    resolveBlocks(centered.s, 1 / 30); resolveBlocks(shoulder, 1 / 30);
    expect(shoulder.engagements[0].control).toBeLessThan(centered.s.engagements[0].control);
  });
  it("bull rush transfers lost anchor into actual interior displacement before a shed", () => {
    const { s, b, r } = singleEngagement();
    r.move = "bull";
    r.ratings.power = r.ratings.strength = 0.8;
    b.ratings.passBlock = b.ratings.anchor = b.ratings.strength = 0.6;
    const start = b.pos.y;
    for (let i = 0; i < 25; i++) { s.tick++; resolveBlocks(s, 1 / 30); }
    expect(b.pos.y).toBeLessThan(start - 0.3);
    expect(s.engagements).toHaveLength(1);
    expect(r.pos.y).toBeGreaterThan(b.pos.y);
    expect(s.outcome).toBeUndefined();
  });
  it("a rating and leverage loss records a shed, recovery and a later positional sack", () => {
    const { s, b, r } = singleEngagement();
    r.move = "bull";
    r.ratings.power = r.ratings.strength = 1;
    b.ratings.passBlock = b.ratings.anchor = b.ratings.strength = 0.1;
    for (let i = 0; i < 30 && !s.events.some((e) => e.kind === "shed"); i++) {
      s.tick++; resolveBlocks(s, 1 / 30);
    }
    expect(s.events.find((e) => e.kind === "shed")?.actors).toEqual([r.id, b.id]);
    expect(b.recoveryUntil).toBeGreaterThan(s.tick / 30);
    expect(s.outcome).toBeUndefined();
    const result = advanceTicks(s, 300);
    expect(result.outcome).toBe("sack");
    expect(result.events.some((e) => e.kind === "pressure")).toBe(true);
  });
  it("a free helper scans a shed threat without teleporting or inventing another blocker", () => {
    const s = snap(createEngine({ ...defaultConfig(), help: "RB" }));
    const helper = s.players.find((p) => p.role === "RB")!;
    const held = s.plan[helper.id];
    const broken = s.players.find((p) =>
      p.job === "block" && p.id !== helper.id && s.plan[p.id] !== held &&
      s.players.filter((other) => other.job === "block" && s.plan[other.id] === s.plan[p.id]).length === 1,
    )!;
    broken.recoveryUntil = 2;
    const position = { ...helper.pos };
    const count = s.players.filter((p) => p.job === "block").length;
    scanProtection(s);
    expect(s.plan[helper.id]).toBe(s.plan[broken.id]);
    expect(helper.pos).toEqual(position);
    expect(s.events.at(-1)?.kind).toBe("protection-scan");
    expect(s.engagements).toHaveLength(0);
    expect(s.players.filter((p) => p.job === "block")).toHaveLength(count);
  });
});

function sweptFlight(offset = 0) {
  const c = defaultConfig("passing7"); c.rules.acknowledged = true;
  const s = snap(createEngine(c)); s.phase = "flight"; s.tick = 30;
  s.players.filter((p) => p.team === "defense").forEach((p) => { p.pos = { x: 0, y: 0 }; p.velocity = { x: 0, y: 0 }; });
  s.ball = { origin: { x: 10, y: 20 }, pos: { x: 17.5, y: 20 }, aim: { x: 20, y: 20 }, height: 1.8, elapsed: 0.75, flight: 1, apex: 0.1, target: "R1", released: 0 };
  s.players.find((p) => p.team === "defense")!.pos = { x: 18.75, y: 20 + offset };
  return s;
}
describe("swept low-ball contact", () => {
  it("catches a near-shoulder control window missed by both endpoints of a normal 30Hz tick", () => {
    const s = sweptFlight();
    s.ball!.aim = { x: 34, y: 20 };
    s.ball!.pos = { x: 28, y: 20 };
    const d = s.players.find((p) => p.team === "defense")!;
    d.pos = { x: 28.4, y: 20.5 };
    expect(Math.hypot(28 - d.pos.x, 20 - d.pos.y)).toBeGreaterThan(0.55);
    expect(Math.hypot(28.8 - d.pos.x, 20 - d.pos.y)).toBeGreaterThan(0.55);
    advanceBall(s, 1 / 30);
    expect(s.outcome).toBe("interception");
    expect(s.ball!.pos.x).toBeGreaterThan(28);
    expect(s.ball!.pos.x).toBeLessThan(28.4);
  });
  it("detects control between tick endpoints, with an earlier stop position", () => {
    const s = sweptFlight();
    advanceBall(s, 0.25);
    expect(s.outcome).toBe("interception");
    expect(s.ball!.pos.x).toBeGreaterThan(18);
    expect(s.ball!.pos.x).toBeLessThan(18.75);
    expect(s.ball!.elapsed).toBeLessThan(1);
  });
  it("distinguishes disruption reach from control and does not allow high-ball control", () => {
    const tip = sweptFlight(0.8); advanceBall(tip, 0.25);
    expect(tip.outcome).toBe("deflection");
    const high = sweptFlight(); high.ball!.apex = 10;
    advanceBall(high, 0.25);
    expect(high.outcome).not.toBe("interception");
    expect(high.outcome).not.toBe("deflection");
  });
  it("uses defender motion across the swept segment instead of endpoint proximity alone", () => {
    const s = sweptFlight(2);
    const d = s.players.find((p) => p.team === "defense")!;
    d.pos = { x: 18.75, y: 22 }; d.velocity = { x: 0, y: 16 };
    advanceBall(s, 0.25);
    expect(s.outcome).toBe("interception");
  });
});
