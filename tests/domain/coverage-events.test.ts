// @vitest-environment node
import { describe, expect, it } from "vitest";
import { deepZones } from "@/modules/qb-lab/football/geometry";
import { defaultConfig } from "@/modules/qb-lab/live-engine/defaults";
import { advanceTicks, coverageTarget, createEngine, snap, step } from "@/modules/qb-lab/live-engine/engine";

function passingExercise() {
  const config = defaultConfig("passing7");
  config.rules.acknowledged = true;
  config.rules.passClock = 8;
  return createEngine(config);
}

describe("authored coverage behavior, not coverage-name recognition", () => {
  it("keeps spot-drop quarters distinct from the explicitly limited vertical-match branch", () => {
    for (const call of ["Cover 4", "Cover 6", "Cover 8"])
      expect(deepZones(call, 160 / 3, "left").every(z => !z.match)).toBe(true);
    expect(deepZones("Quarters match", 160 / 3, "left").every(z => z.match)).toBe(true);

    const state = createEngine({ ...defaultConfig(), coverage: "Cover 4" });
    const defender = state.players.find(p => p.zone?.minDepth === 11)!;
    const receiver = state.players.find(p => p.job === "route")!;
    receiver.pos = { x: defender.landmark.x, y: state.config.rules.los + 14 };
    expect(coverageTarget(defender, state)).not.toEqual(defender.landmark);
    expect(defender.receiver).toBe(receiver.id);
    expect(defender.matched).toBe(false);
    receiver.pos.x = state.config.rules.width;
    expect(coverageTarget(defender, state)).toEqual(defender.landmark);
    expect(defender.receiver).toBeUndefined();
    expect(state.events.some(e => e.kind === "match")).toBe(false);
    expect(state.events.some(e => e.kind === "zone-release" && e.actors?.includes(receiver.id))).toBe(true);
  });

  it("records an actual running receiver's passing-7 zone exchanges without turning them into man coverage", () => {
    let state = snap(passingExercise());
    const windows = state.players.filter(p => p.zone?.maxDepth === 15).sort((a,b) => a.landmark.x-b.landmark.x);
    const receiver = state.players.find(p => p.job === "route")!;
    state.players.filter(p => p.job === "route" && p !== receiver).forEach(p => p.job = "inactive");
    receiver.start = { x: windows[0].landmark.x, y: state.config.rules.los + 8 };
    receiver.pos = { ...receiver.start };
    receiver.route = [{ x: windows[2].landmark.x, y: receiver.start.y }];
    state = advanceTicks(state, 150);
    expect(state.phase).toBe("live");
    expect(state.events.some(e => e.kind === "zone-acquire" && e.actors?.[0] === windows[0].id && e.actors?.[1] === receiver.id)).toBe(true);
    expect(state.events.some(e => e.kind === "zone-release" && e.actors?.[0] === windows[0].id)).toBe(true);
    expect(state.events.some(e => e.kind === "zone-acquire" && e.actors?.[0] === windows[1].id && e.actors?.[1] === receiver.id)).toBe(true);
    const first = state.players.find(p => p.id === windows[0].id)!;
    expect(first.receiver).toBeUndefined();
    expect(first.pos.x).toBeLessThanOrEqual(first.zone!.maxX + 0.2);
    expect(state.players.some(p => p.job === "rush" || p.job === "block")).toBe(false);
    expect(state.events.some(e => e.kind === "match")).toBe(false);
  });

  it("reacts to the visible ball after delay and cannot inspect a future landing point", () => {
    const state = passingExercise();
    const defender = state.players.find(p => p.zone?.maxDepth === 15)!;
    state.players.filter(p => p.job === "route").forEach(p => p.job = "inactive");
    defender.pos = { ...defender.landmark };
    state.phase = "flight";
    state.ball = {
      origin: { x: 10, y: 10 }, pos: { x: defender.pos.x + 2, y: defender.pos.y - 1 },
      aim: { x: 50, y: 50 }, height: 3, elapsed: 0.01, flight: 1,
      apex: 2, target: "R1", released: 0,
    };
    expect(coverageTarget(defender, state)).toEqual(defender.landmark);
    state.ball.elapsed = 0.6;
    expect(coverageTarget(defender, state)).toEqual(state.ball.pos);
    const previous = coverageTarget(defender, state);
    state.ball.aim = { x: 1, y: 2 };
    expect(coverageTarget(defender, state)).toEqual(previous);
    expect(state.events.filter(e => e.kind === "ball-read" && e.actors?.[0] === defender.id)).toHaveLength(1);
    state.ball.pos = { x: state.config.rules.width, y: state.config.rules.length };
    expect(coverageTarget(defender, state)).toEqual(defender.landmark);
  });

  it("uses route releases and actual post-snap motion for the limited match branch", () => {
    const initial = createEngine({ ...defaultConfig(), coverage: "Quarters match", matchDepth: 11 });
    const defender = initial.players.find(p => p.zone?.match)!;
    const receiver = initial.players.find(p => p.job === "route")!;
    initial.players.filter(p => p.job === "route" && p !== receiver).forEach(p => p.job = "inactive");
    receiver.start = { x: defender.landmark.x, y: initial.config.rules.los + 8 };
    receiver.pos = { ...receiver.start };
    receiver.route = [{ x: defender.landmark.x, y: initial.config.rules.los + 20 }];
    let state = snap(initial);
    state = advanceTicks(state, 5);
    expect(state.players.find(p => p.id === defender.id)!.matched).toBe(false);
    state = advanceTicks(state, 30);
    const carry = state.players.find(p => p.id === defender.id)!;
    expect(carry.matched).toBe(true);
    expect(carry.receiver).toBe(receiver.id);
    expect(state.events.filter(e => e.kind === "match" && e.actors?.[0] === carry.id)).toHaveLength(1);
    expect(state.events.find(e => e.kind === "match")!.tick).toBeGreaterThan(5);
    expect(step(state)).toEqual(step(structuredClone(state)));
    expect(carry.responsibility).toContain("NOT implemented");
  });
});
