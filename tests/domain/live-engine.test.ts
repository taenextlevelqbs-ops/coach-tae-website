// @vitest-environment node
import { describe, it, expect } from "vitest";
import { resolveBlocks } from "../../modules/qb-lab/live-engine/blocking";
import { defaultConfig } from "../../modules/qb-lab/live-engine/defaults";
import {
  rulesFor,
  validateRules,
  gameFormats,
} from "../../modules/qb-lab/live-engine/formats";
import {
  createEngine,
  snap,
  step,
  advanceTicks,
} from "../../modules/qb-lab/live-engine/engine";
import {
  validateConfig,
  distance,
} from "../../modules/qb-lab/live-engine/roster";
import { formation } from "../../modules/qb-lab/simulation/model";
import { coaching } from "../../modules/qb-lab/live-engine/coaching";
import { advanceBall } from "../../modules/qb-lab/live-engine/physics";
import type { EngineState } from "../../modules/qb-lab/live-engine/types";
function eventConfig(format: Parameters<typeof defaultConfig>[0]) {
  const c = defaultConfig(format);
  c.rules.acknowledged = true;
  return c;
}
function run(s: EngineState, ticks = 540) {
  return advanceTicks(snap(s), ticks);
}
describe("live positional engine: contracts and determinism", () => {
  it("separates tackle, passing-event 7v7 and every flag roster without inheriting event rules", () => {
    for (const f of gameFormats) {
      const c = eventConfig(f),
        s = createEngine(c);
      expect(s.players.filter((p) => p.team === "offense")).toHaveLength(
        c.rules.offense,
      );
      expect(s.players.filter((p) => p.team === "defense")).toHaveLength(
        c.rules.defense,
      );
      expect(
        s.players.filter((p) => p.job === "route").length,
      ).toBeLessThanOrEqual(c.rules.eligibleLimit);
      expect(new Set(s.players.map((p) => p.id)).size).toBe(s.players.length);
      expect(s.players.filter((p) => p.job === "rush")).toHaveLength(
        c.rules.rushers,
      );
    }
    expect(validateRules(rulesFor("passing7"))).not.toHaveLength(0);
    expect(
      validateRules({
        ...rulesFor("passing7"),
        acknowledged: true,
        rushers: 1,
      }),
    ).toContainEqual(expect.stringMatching(/no line, rush/));
    expect(
      validateRules({
        ...rulesFor("flag7"),
        acknowledged: true,
        contact: true,
      }),
    ).toContainEqual(expect.stringMatching(/not implemented/));
    expect(
      validateRules({
        ...rulesFor("flag5"),
        acknowledged: true,
        handoff: true,
      }),
    ).toContainEqual(expect.stringMatching(/later engine stage/));
  });
  it("supports event-specific clocks, participation, eligibility and rejects malformed values", () => {
    const c = eventConfig("passing7");
    c.rules.offense = 6;
    c.rules.eligibleLimit = 4;
    c.rules.passClock = 6.5;
    const s = createEngine(c);
    expect(s.players.filter((p) => p.team === "offense")).toHaveLength(6);
    expect(s.players.filter((p) => p.eligible)).toHaveLength(4);
    expect(s.players.some((p) => p.job === "block" || p.role === "OL")).toBe(
      false,
    );
    expect(run(s).endedAt).toBe(6.5);
    for (const passClock of [NaN, Infinity, 1, 16])
      expect(validateRules({ ...c.rules, passClock })).not.toHaveLength(0);
    expect(() => createEngine({ ...c, seed: NaN })).toThrow(/Seed/);
    expect(() =>
      createEngine({ ...c, rules: { ...c.rules, offense: 7.5 } }),
    ).toThrow(/whole/);
    expect(() => advanceTicks(s, 1.5)).toThrow(/whole/);
  });
  it("replays exactly with fixed input sequences, is immutable and pauses before snap", () => {
    const s = createEngine(defaultConfig());
    const before = structuredClone(s);
    expect(step(s)).toBe(s);
    const a = advanceTicks(snap(s), 90, { move: { x: 0.1, y: 0.1 } });
    let b = snap(s);
    for (let i = 0; i < 3; i++)
      b = advanceTicks(b, 30, { move: { x: 0.1, y: 0.1 } });
    expect(a).toEqual(b);
    expect(s).toEqual(before);
    expect(
      advanceTicks(snap(createEngine({ ...defaultConfig(), seed: 43 })), 90),
    ).not.toEqual(a);
    expect(() => step(snap(s), { move: { x: NaN, y: 0 } })).toThrow(/finite/);
    expect(() =>
      step(snap(s), { throwTo: "R5", placement: { x: NaN, y: 0 } }),
    ).toThrow(/finite/);
  });
  it("adapts reviewed shared saved formations without rewriting legacy data", () => {
    const p = formation("tackle");
    p.players.find((p) => p.label === "X")!.label = "Split";
    const original = structuredClone(p);
    const c = { ...defaultConfig(), play: p };
    expect(
      createEngine(c).players.find((p) => p.label === "Split")?.eligible,
    ).toBe(true);
    expect(p).toEqual(original);
    expect(
      validateConfig({ ...defaultConfig(), play: formation("flag7") }),
    ).not.toHaveLength(0);
    const legacy = structuredClone(p);
    legacy.players.forEach((p) => {
      delete p.role;
      delete p.eligible;
    });
    expect(validateConfig({ ...defaultConfig(), play: legacy })).toContainEqual(
      expect.stringMatching(/Legacy play/),
    );
  });
});
describe("blocking, rush and pocket behavior", () => {
  it("engages real offensive linemen after snap and keeps engagements geometric", () => {
    const initial = createEngine(defaultConfig());
    const s = advanceTicks(snap(initial), 60);
    expect(s.events.some((e) => e.kind === "engage")).toBe(true);
    for (const e of s.engagements) {
      const b = s.players.find((p) => p.id === e.blocker)!,
        r = s.players.find((p) => p.id === e.rusher)!;
      expect(b.job).toBe("block");
      expect(r.job).toBe("rush");
      expect(distance(b.pos, r.pos)).toBeLessThan(2);
    }
    expect(
      s.players
        .filter((p) => p.job === "rush")
        .some((p) => distance(p.start, p.pos) > 1),
    ).toBe(true);
  });
  it("a six-man pressure can be accounted for with RB help instead of becoming an automatic free rush", () => {
    const c = defaultConfig();
    c.rules.rushers = 6;
    const noHelp = createEngine(c);
    const withHelp = createEngine({ ...c, help: "RB" });
    const threats = noHelp.players.filter((p) => p.job === "rush");
    expect(
      threats.filter((p) => !Object.values(noHelp.plan).includes(p.id)),
    ).toHaveLength(1);
    expect(
      threats.filter((p) => !Object.values(withHelp.plan).includes(p.id)),
    ).toHaveLength(0);
    expect(withHelp.players.find((p) => p.role === "RB")?.job).toBe("block");
    expect(snap(withHelp).events.some((e) => e.kind === "unaccounted")).toBe(
      false,
    );
    expect(snap(withHelp).phase).toBe("live");
  });
  it("sacks require contact, while a rusher-free pocket never invents a three-second sack", () => {
    const s = snap(createEngine(defaultConfig()));
    const qb = s.players.find((p) => p.job === "qb")!;
    const rush = s.players.find((p) => p.job === "rush")!;
    s.players
      .filter((p) => p.job === "block")
      .forEach((p) => (p.job = "inactive"));
    s.plan = {};
    rush.pos = { x: qb.pos.x + 0.1, y: qb.pos.y + 0.2 };
    const sack = step(s);
    expect(sack.outcome).toBe("sack");
    expect(sack.endedAt).toBeLessThan(0.1);
    const clean = snap(createEngine(defaultConfig()));
    clean.players
      .filter((p) => p.job === "rush")
      .forEach((p) => {
        p.job = "inactive";
      });
    clean.plan = {};
    const result = advanceTicks(clean, 540);
    expect(result.outcome).toBe("practice-ended");
    expect(result.endedAt).toBe(18);
    expect(coaching(sack).join(" ")).toContain("reached the controlled QB");
  });
  it("uses delayed rush, finite positions and state-based pocket collapse over time", () => {
    const c = { ...defaultConfig(), rushMove: "delayed" as const };
    const initial = createEngine(c),
      delayed = initial.players.find((p) => p.delay > 0)!;
    const s = advanceTicks(snap(initial), 20);
    expect(s.players.find((p) => p.id === delayed.id)!.pos).toEqual(
      delayed.start,
    );
    const later = advanceTicks(s, 40);
    expect(later.players.find((p) => p.id === delayed.id)!.pos).not.toEqual(
      delayed.start,
    );
    for (const p of later.players) {
      expect(Number.isFinite(p.pos.x + p.pos.y)).toBe(true);
    }
    // Controlled no-protection rep must be reachable by pursuing rushers without any clock.
    const free = snap(createEngine(defaultConfig()));
    free.plan = {};
    free.players
      .filter((p) => p.job === "block")
      .forEach((p) => (p.job = "inactive"));
    const result = advanceTicks(free, 300);
    expect(result.outcome).toBe("sack");
    expect(result.events.some((e) => e.kind === "pressure")).toBe(true);
  });
});
describe("coverage, ball and event-specific outcomes", () => {
  it("passing 7v7 never applies rush collisions and expires at the chosen clock, not at four seconds", () => {
    const c = eventConfig("passing7");
    c.rules.passClock = 6;
    const s = advanceTicks(snap(createEngine(c)), 125);
    expect(s.phase).toBe("live");
    expect(s.pressure).toBe(0);
    expect(s.events.some((e) => e.kind === "engage")).toBe(false);
    const end = advanceTicks(s, 55);
    expect(end.outcome).toBe("clock");
    expect(end.endedAt).toBe(6);
  });
  it("enforces flag distance/delay, QB-run restrictions and counts flag contact as a pull", () => {
    const c = eventConfig("flag5");
    c.rules.rushDistance = 9;
    c.rules.rushDelay = 2;
    const s = snap(createEngine(c));
    const rush = s.players.find((p) => p.job === "rush")!;
    expect(rush.pos.y - c.rules.los).toBe(9);
    expect(
      advanceTicks(s, 45).players.find((p) => p.id === rush.id)!.pos,
    ).toEqual(rush.start);
    const moving = advanceTicks(s, 100, { move: { x: 0, y: 1 } });
    expect(moving.players.find((p) => p.job === "qb")!.pos.y).toBeLessThan(
      c.rules.los,
    );
    const hit = structuredClone(s);
    const qb = hit.players.find((p) => p.job === "qb")!;
    const d = hit.players.find((p) => p.job === "rush")!;
    d.pos = { ...qb.pos };
    d.delay = 0;
    expect(step(hit).outcome).toBe("flag-pull");
  });
  it("uses actual observed receiver position for man response and rotates from the starting shell", () => {
    const c = defaultConfig();
    c.coverage = "Cover 1";
    c.shell = 0;
    const s = snap(createEngine(c)),
      man = s.players.find((p) => p.job === "man")!;
    const receiver = s.players.find((p) => p.id === man.receiver)!;
    receiver.pos = { x: man.pos.x + 5, y: man.pos.y };
    receiver.route = [{ x: receiver.pos.x, y: receiver.pos.y + 10 }];
    receiver.start = { ...receiver.pos };
    const next = step(s).players.find((p) => p.id === man.id)!;
    expect(next.velocity.x).toBeGreaterThan(0);
    const deep = s.players.find(
      (p) => p.responsibility === "Deep middle help",
    )!;
    const after = advanceTicks(s, 60).players.find((p) => p.id === deep.id)!;
    expect(after.pos.y).toBeGreaterThan(deep.pos.y);
  });
  it("holds a throw in flight, then resolves from catch/defender geometry, never from chosen receiver alone", () => {
    const s = snap(createEngine(eventConfig("passing7")));
    const flight = step(advanceTicks(s, 30), { throwTo: "R1" });
    expect(flight.phase).toBe("flight");
    expect(flight.throwTime).toBeCloseTo(31 / 30);
    expect(flight.ball!.height).toBeGreaterThan(1.8);
    expect(flight.outcome).toBeUndefined();
    const base = structuredClone(flight);
    const b = base.ball!;
    b.elapsed = b.flight - 1 / 30;
    b.aim = { x: 15, y: 30 };
    base.players
      .filter((p) => p.team === "defense")
      .forEach((p) => (p.pos = { x: 1, y: 1 }));
    base.players
      .filter((p) => p.job === "route")
      .forEach((p) => (p.pos = { x: 1, y: 1 }));
    const catchCase = structuredClone(base);
    catchCase.players.find((p) => p.job === "route")!.pos = { x: 15, y: 30 };
    advanceBall(catchCase, 1 / 30);
    expect(catchCase.outcome).toBe("completion");
    const interception = structuredClone(base);
    interception.players.find((p) => p.team === "defense")!.pos = {
      x: 15,
      y: 30,
    };
    advanceBall(interception, 1 / 30);
    expect(interception.outcome).toBe("interception");
    const miss = structuredClone(base);
    advanceBall(miss, 1 / 30);
    expect(miss.outcome).toBe("incomplete");
    const tip = structuredClone(base);
    tip.players.find((p) => p.team === "defense")!.pos = { x: 15.7, y: 30 };
    advanceBall(tip, 1 / 30);
    expect(tip.outcome).toBe("deflection");
  });
});

describe("engine reports and observed behavior", () => {
  it("coverage reacts to changed routes without reading their future paths", () => {
    const c = defaultConfig();
    c.coverage = "Quarters match";
    const first = createEngine(c);
    const play = formation("tackle");
    play.players
      .filter((p) => p.eligible)
      .forEach((p) => (p.route = [{ x: p.start.x, y: 65 }]));
    const changed = createEngine({ ...c, play });
    expect(
      first.players.filter((p) => p.job === "match").map((p) => p.landmark),
    ).toEqual(
      changed.players.filter((p) => p.job === "match").map((p) => p.landmark),
    );
  });
  it("all authored rush approaches remain finite, and QB movement changes the rep", () => {
    for (const move of [
      "bull",
      "speed",
      "swim",
      "rip",
      "spin",
      "interior",
      "edge",
      "twist",
      "delayed",
      "contain",
    ] as const) {
      const result = run(createEngine({ ...defaultConfig(), rushMove: move }));
      expect(result.phase).toBe("done");
      for (const p of result.players)
        expect(Number.isFinite(p.pos.x + p.pos.y)).toBe(true);
    }
    const initial = snap(createEngine(defaultConfig()));
    const still = advanceTicks(initial, 30);
    const moved = advanceTicks(initial, 30, { move: { x: 1, y: 0 } });
    expect(still.players.find((p) => p.job === "qb")!.pos).not.toEqual(
      moved.players.find((p) => p.job === "qb")!.pos,
    );
    expect(
      still.players.filter((p) => p.job === "rush").map((p) => p.pos),
    ).not.toEqual(
      moved.players.filter((p) => p.job === "rush").map((p) => p.pos),
    );
  });
});

it("records a later-arriving help blocker without recounting an existing engagement", () => {
  const s = snap(createEngine({ ...defaultConfig(), help: "RB" }));
  const r = s.players.find((p) => p.job === "rush")!;
  const first = s.players.find((p) => p.job === "block" && p.role === "OL")!;
  const help = s.players.find((p) => p.role === "RB")!;
  s.plan = { [first.id]: r.id, [help.id]: r.id };
  first.pos = { x: r.pos.x, y: r.pos.y - 0.7 };
  help.pos = { x: r.pos.x + 0.3, y: r.pos.y - 0.7 };
  s.engagements = [{ blocker: first.id, rusher: r.id, control: 0.5, since: 0 }];
  resolveBlocks(s, 1 / 30);
  const joined = s.events.filter((e) => e.kind === "engage");
  expect(joined).toHaveLength(1);
  expect(joined[0].actors).toContain(help.id);
});

it("RB protection help physically reaches and engages its assigned threat ahead of the QB", () => {
  const c = defaultConfig();
  c.rules.rushers = 6;
  c.help = "RB";
  let s = snap(createEngine(c));
  const rb = s.players.find((p) => p.role === "RB")!;
  for (
    let i = 0;
    i < 180 &&
    !s.events.some((e) => e.kind === "engage" && e.actors?.includes(rb.id));
    i++
  )
    s = step(s);
  const engaged = s.events.find(
    (e) => e.kind === "engage" && e.actors?.includes(rb.id),
  );
  expect(engaged).toBeDefined();
  const blocker = s.players.find((p) => p.id === rb.id)!;
  const qb = s.players.find((p) => p.job === "qb")!;
  expect(blocker.pos.y).toBeGreaterThan(qb.pos.y + 1);
  expect(s.outcome).not.toBe("sack");
});
