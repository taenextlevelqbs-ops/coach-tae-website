// @vitest-environment node
import { describe, expect, it } from "vitest";
import { acceptanceScenarios, runAcceptance } from "../../modules/qb-lab/live-engine/acceptance";
import { advanceTicks, createEngine, snap, step } from "../../modules/qb-lab/live-engine/engine";
import { defaultConfig } from "../../modules/qb-lab/live-engine/defaults";
import { coaching } from "../../modules/qb-lab/live-engine/coaching";
import { distance, validateConfig } from "../../modules/qb-lab/live-engine/roster";
import { formation } from "../../modules/qb-lab/simulation/model";
import type { EngineState } from "../../modules/qb-lab/live-engine/types";

const example = (id: string) => acceptanceScenarios.find(s => s.id === id)!;
const finished = (id: string) => runAcceptance(example(id)).at(-1)!;
const qb = (s: EngineState) => s.players.find(p => p.job === "qb")!;

describe("full-rep acceptance: validated configs and actual fixed-tick inputs", () => {
  it("all playable references terminate through an actual event and replay identically", () => {
    for (const fixture of acceptanceScenarios) {
      expect(validateConfig(fixture.config), fixture.id).toEqual([]);
      const a = runAcceptance(fixture), b = runAcceptance(fixture);
      expect(a, fixture.id).toEqual(b);
      const last = a.at(-1)!;
      expect(last.phase, fixture.id).toBe("done");
      expect(last.events.at(-1)?.kind, fixture.id).toBe(last.outcome);
      expect(last.events.some(e => ["pocket-reset", "pocket-break"].includes(e.kind))).toBe(false);
      for (const frame of a) for (const p of frame.players)
        expect(Number.isFinite(p.pos.x + p.pos.y + p.velocity.x + p.velocity.y)).toBe(true);
    }
  });

  it("four rushers versus five blockers permits a geometric clean-pocket completion", () => {
    const frames = runAcceptance(example("four-v-five"));
    const last = frames.at(-1)!;
    expect(frames[0].players.filter(p => p.job === "block")).toHaveLength(5);
    expect(frames[0].players.filter(p => p.job === "rush")).toHaveLength(4);
    expect(new Set(last.events.filter(e => e.kind === "engage").map(e => e.actors![1])).size).toBe(4);
    expect(last.events.some(e => e.kind === "unaccounted")).toBe(false);
    expect(last.outcome).toBe("completion");
    expect(last.throwTime).toBeCloseTo(37 / 30);
    expect(last.peakPressure).toBe(0);
    expect(last.ball!.flight).toBeGreaterThan(0);
    expect(last.endedAt).toBeGreaterThan(last.throwTime!);
    const catcher = last.players.find(p => p.id === last.ball!.target)!;
    expect(distance(catcher.pos, last.ball!.pos)).toBeLessThanOrEqual(1.1);
  });

  it("RB help accounts for and physically engages a sixth threat before deliberate throwaway", () => {
    const frames = runAcceptance(example("six-with-help"));
    const last = frames.at(-1)!;
    const rb = frames[0].players.find(p => p.role === "RB")!;
    expect(rb.job).toBe("block");
    expect(frames[0].players.filter(p => p.job === "rush" && !Object.values(frames[0].plan).includes(p.id))).toHaveLength(0);
    const pickup = last.events.find(e => e.kind === "engage" && e.actors?.includes(rb.id));
    expect(pickup).toBeDefined();
    const atPickup = frames.find(f => f.tick === pickup!.tick)!;
    const blocker = atPickup.players.find(p => p.id === rb.id)!;
    const threat = atPickup.players.find(p => p.id === pickup!.actors![1])!;
    expect(distance(blocker.pos, threat.pos)).toBeLessThan(2);
    expect(blocker.pos.y).toBeGreaterThan(qb(atPickup).pos.y);
    expect(last.events.some(e => e.kind === "unaccounted")).toBe(false);
    expect(last.outcome).toBe("throw-away");
  });

  it("an unaccounted sixth defender creates observed pressure and a contact sack if the QB holds", () => {
    const frames = runAcceptance(example("six-no-help"));
    const last = frames.at(-1)!;
    expect(last.events.filter(e => e.kind === "unaccounted")).toHaveLength(1);
    const pressure = last.events.find(e => e.kind === "pressure")!;
    expect(pressure).toBeDefined();
    expect(pressure.tick).toBeLessThan(last.tick);
    expect(last.outcome).toBe("sack");
    const nearest = Math.min(...last.players.filter(p => p.job === "rush").map(p => distance(p.pos, qb(last).pos)));
    expect(nearest).toBeLessThan(0.72);
    expect(last.events.some(e => e.kind === "pocket-break")).toBe(false);
  });

  it.each([
    ["cover-two-flood", 2, 5],
    ["cover-three-stretch", 3, 4],
  ] as const)("%s reacts to observed distribution within its bounded spot-drop rules", (id, deepCount, underCount) => {
    const frames = runAcceptance(example(id));
    const initial = frames[0], last = frames.at(-1)!;
    const deep = initial.players.filter(p => p.zone && p.zone.minDepth >= 12);
    expect(deep).toHaveLength(deepCount);
    expect(initial.players.filter(p => p.zone?.maxDepth === 15)).toHaveLength(underCount);
    expect(last.events.some(e => e.kind === "zone-acquire")).toBe(true);
    expect(last.events.some(e => e.kind === "zone-release")).toBe(true);
    expect(last.events.some(e => e.kind === "match")).toBe(false);
    for (const event of last.events.filter(e => e.kind === "zone-acquire")) {
      const frame = frames.find(f => f.tick === event.tick)!;
      const defender = frame.players.find(p => p.id === event.actors![0])!;
      const receiver = frame.players.find(p => p.id === event.actors![1])!;
      const z = defender.zone!;
      expect(receiver.pos.x).toBeGreaterThanOrEqual(z.minX);
      expect(receiver.pos.x).toBeLessThanOrEqual(z.maxX);
      expect(receiver.pos.y - frame.config.rules.los).toBeGreaterThanOrEqual(z.minDepth);
      expect(receiver.pos.y - frame.config.rules.los).toBeLessThanOrEqual(z.maxDepth);
    }
    expect(deep.some(d => distance(d.start, last.players.find(p => p.id === d.id)!.pos) > 1)).toBe(true);
    expect(last.outcome).toBe("throw-away");
    // Complete flood/stretch communication and best-target grading are NOT claimed here.
  });

  it("limited quarters match acquires actual verticals after its authored depth, without universal Cover 4 claims", () => {
    const frames = runAcceptance(example("quarters-vertical"));
    const last = frames.at(-1)!;
    const matches = last.events.filter(e => e.kind === "match");
    expect(matches.length).toBeGreaterThanOrEqual(2);
    for (const event of matches) {
      const frame = frames.find(f => f.tick === event.tick)!;
      const receiver = frame.players.find(p => p.id === event.actors![1])!;
      expect(receiver.pos.y - frame.config.rules.los).toBeGreaterThanOrEqual(11);
      const defender = frame.players.find(p => p.id === event.actors![0])!;
      expect(defender.receiver).toBe(receiver.id);
      expect(defender.matched).toBe(true);
    }
    expect(last.outcome).toBe("throw-away");
  });

  it("coaching feedback reports the actual result, timing and event counts for each reference", () => {
    for (const fixture of acceptanceScenarios) {
      const state = runAcceptance(fixture).at(-1)!;
      const notes = coaching(state).join(" ");
      expect(notes).toContain(`Recorded outcome: ${state.outcome}`);
      expect(notes).toContain(state.events.at(-1)!.text);
      expect(notes).toContain(`${state.events.filter(e => e.kind === "engage").length} recorded block engagements`);
      if (state.throwTime !== undefined) expect(notes).toContain(`Time to throw: ${state.throwTime.toFixed(2)}s`);
      expect(notes).not.toMatch(/mastered|guaranteed completion|QB rating/);
    }
    expect(coaching(finished("six-no-help")).join(" ")).toContain("reached the controlled QB");
  });
});

/** Isolated synthetic pursuit picture, NOT an end-to-end edge/blocking win fixture.
 * Positions/ratings/jobs are authored once before stepping; no fabricated shed events.
 */
function laneSnapshot(interior: boolean) {
  const s = snap(createEngine(defaultConfig()));
  s.tick = 30; s.plan = {};
  qb(s).pos = { x: s.config.rules.width / 2, y: s.config.rules.los - 7 };
  qb(s).velocity = { x: 0, y: 0 };
  const rush = s.players.find(p => p.job === "rush")!;
  for (const p of s.players) if (p.job === "rush" || p.job === "block") p.job = "inactive";
  rush.job = "rush"; rush.move = "bull"; rush.delay = 0;
  rush.ratings.speed = .5; rush.ratings.acceleration = 1; rush.ratings.pursuit = 1;
  rush.pos = { x: qb(s).pos.x + (interior ? 0 : -3), y: qb(s).pos.y + (interior ? 3 : -1) };
  rush.start = { ...rush.pos }; rush.velocity = { x: 0, y: 0 };
  return s;
}

describe("controlled-state checks: limited acceptance, no claim of full natural play", () => {
  it("climbing away from an isolated edge threat can keep the rep alive, without an artificial time extension", () => {
    const initial = laneSnapshot(false);
    const held = advanceTicks(initial, 30);
    const climbed = advanceTicks(initial, 30, { move: { x: 0, y: 1 } });
    expect(held.outcome).toBe("sack");
    expect(climbed.phase).toBe("live");
    expect(qb(climbed).pos.y).toBeGreaterThan(qb(held).pos.y + 2);
    expect(climbed.events.some(e => e.kind === "pocket-reset")).toBe(false);
    expect(climbed.pressure).toBeLessThan(held.pressure);
  });

  it("climbing into interior penetration accelerates contact while retreating remains clear for this window", () => {
    const initial = laneSnapshot(true);
    const held = advanceTicks(initial, 30);
    const climbed = advanceTicks(initial, 30, { move: { x: 0, y: 1 } });
    const retreated = advanceTicks(initial, 30, { move: { x: 0, y: -1 } });
    expect(climbed.outcome).toBe("sack");
    expect(climbed.tick).toBeLessThan(held.tick);
    expect(retreated.phase).toBe("live");
    expect(retreated.pressure).toBeLessThan(climbed.pressure);
  });

  it("a passing7 crossing route releases one underneath owner and acquires the next with no rush or line", () => {
    const config = defaultConfig("passing7");
    config.rules.acknowledged = true;
    config.rules.passClock = 8;
    const initial = snap(createEngine(config));
    initial.tick = 30; // A post-snap crossing picture, not a legal formation at snap.
    const receiver = initial.players.find(p => p.job === "route")!;
    // Isolate one observed crossing release; all other eligible routes are held behind LOS.
    for (const p of initial.players.filter(p => p.job === "route")) {
      p.start = { x: 1, y: config.rules.los - 2 }; p.pos = { ...p.start }; p.route = [];
    }
    receiver.start = { x: 4, y: config.rules.los + 5 };
    receiver.pos = { ...receiver.start };
    receiver.route = [{ x: 22, y: config.rules.los + 5 }];
    const first = initial.players.find(p => p.zone?.name === "Left flat")!;
    const second = initial.players.find(p => p.zone?.name === "Left hook-to-curl")!;
    const frames = [initial];
    let state = initial;
    for (let i = 0; i < 80; i++) { state = step(state); frames.push(state); }
    const acquireFirst = state.events.find(e => e.kind === "zone-acquire" && e.actors?.[0] === first.id && e.actors[1] === receiver.id);
    const releaseFirst = state.events.find(e => e.kind === "zone-release" && e.actors?.[0] === first.id && e.actors[1] === receiver.id);
    const acquireSecond = state.events.find(e => e.kind === "zone-acquire" && e.actors?.[0] === second.id && e.actors[1] === receiver.id);
    expect(acquireFirst).toBeDefined(); expect(releaseFirst).toBeDefined(); expect(acquireSecond).toBeDefined();
    expect(acquireFirst!.tick).toBeLessThan(releaseFirst!.tick);
    expect(releaseFirst!.tick).toBe(acquireSecond!.tick);
    const exchanged = frames.find(f => f.tick === acquireSecond!.tick)!;
    expect(exchanged.players.find(p => p.id === first.id)!.receiver).toBeUndefined();
    expect(exchanged.players.find(p => p.id === second.id)!.receiver).toBe(receiver.id);
    expect(exchanged.players.some(p => p.job === "rush" || p.job === "block")).toBe(false);
    expect(state.pressure).toBe(0);
    expect(state.events.some(e => e.kind === "engage")).toBe(false);
  });

  it("exact saved play data projects unchanged labels, alignment, route assignments and tactical settings", () => {
    const play = formation("tackle");
    play.id = "saved-exact-contract"; play.name = "Left boundary authored route";
    play.tactics = { hash: "left", strongSide: "right", boundaryBreakScale: .85 };
    const x = play.players.find(p => p.label === "X")!;
    x.label = "Wide"; x.start.x = 11; x.route = [{ x: 11, y: 50 }, { x: 32, y: 40 }];
    const original = structuredClone(play);
    const s = createEngine({ ...defaultConfig(), play });
    const actor = s.players.find(p => p.id === x.id)!;
    const leftHash = (53 + 4 / 12) / 3;
    expect(actor.label).toBe("Wide");
    expect(actor.start.x).toBeCloseTo(leftHash * 11 / 50);
    expect(actor.start.y).toBe(30);
    expect(actor.route[0].x).toBeCloseTo(leftHash * 11 / 50);
    expect(actor.route[0].y).toBeCloseTo(30 + 10 * .85);
    expect(actor.route[1].x).toBeCloseTo(leftHash * 32 / 50);
    expect(actor.route[1].y).toBeCloseTo(30 + 15 * .85);
    expect(s.config.play).toEqual(original);
    const moved = advanceTicks(snap(s), 40);
    expect(moved.players.find(p => p.id === x.id)!.pos.y).toBeGreaterThan(actor.pos.y + 3);
    expect(play).toEqual(original);
  });
});
