import { expect, it } from "vitest";
import {
  HS_FIELD_WIDTH,
  HS_HASH_INSET,
  ballX,
  toField,
  fromField,
  deepZones,
  zoneContains,
} from "@/modules/qb-lab/football/geometry";
import { defaultConfig } from "@/modules/qb-lab/live-engine/defaults";
import {
  createEngine,
  coverageTarget,
  snap,
  advanceTicks,
} from "@/modules/qb-lab/live-engine/engine";
import { formation } from "@/modules/qb-lab/simulation/model";
import { parseState, empty, validPlay } from "@/modules/qb-lab/platform/store";
it("uses exact HS yard dimensions and invertible hash/route transforms", () => {
  expect(HS_FIELD_WIDTH).toBeCloseTo(53 + 1 / 3, 12);
  expect(HS_HASH_INSET * 3).toBeCloseTo(53 + 4 / 12, 12);
  expect(ballX("right")).toBeCloseTo(HS_FIELD_WIDTH - HS_HASH_INSET, 12);
  for (const hash of ["left", "middle", "right"] as const) {
    const tactics = {
      hash,
      strongSide: "right" as const,
      boundaryBreakScale: 0.85,
    };
    for (const p of [
      { x: 10, y: 40 },
      { x: 90, y: 24 },
      { x: 50, y: 70 },
    ]) {
      const actual = fromField(
        toField(p, HS_FIELD_WIDTH, 30, tactics, { x: 10, y: 74 }),
        HS_FIELD_WIDTH,
        30,
        tactics,
        { x: 10, y: 74 },
      );
      expect(actual.x).toBeCloseTo(p.x);
      expect(actual.y).toBeCloseTo(p.y);
    }
  }
});
it("persists tactical metadata and rejects malformed imports", () => {
  const p = {
    ...formation("tackle"),
    tactics: {
      hash: "left" as const,
      strongSide: "left" as const,
      boundaryBreakScale: 0.85,
    },
  };
  expect(
    parseState(JSON.stringify({ ...empty, plays: [p] })).plays[0].tactics,
  ).toEqual(p.tactics);
  expect(
    validPlay({ ...p, tactics: { ...p.tactics, boundaryBreakScale: 0 } }),
  ).toBe(false);
  const config = { ...defaultConfig(), play: p };
  expect(
    createEngine(config).players.find((p) => p.id === "C")!.pos.x,
  ).toBeCloseTo(HS_HASH_INSET);
});
it("divides split coverages into exact disjoint half and quarter widths", () => {
  for (const side of ["left", "right"] as const) {
    const zones = deepZones("Cover 6", HS_FIELD_WIDTH, side);
    expect(zones.reduce((n, z) => n + z.maxX - z.minX, 0)).toBeCloseTo(
      HS_FIELD_WIDTH,
    );
    expect(zones.filter((z) => z.match)).toHaveLength(0);
    expect(zones.filter((z) => Math.abs(z.maxX - z.minX - HS_FIELD_WIDTH / 4) < 1e-9)).toHaveLength(2);
    expect(
      zones.filter((z) =>
        zoneContains(z, { x: HS_FIELD_WIDTH / 2, y: 50 }, 30, HS_FIELD_WIDTH),
      ),
    ).toHaveLength(1);
  }
});
it("only matches an observed vertical in the actual quarter and carries it across a boundary", () => {
  const s = createEngine({
    ...defaultConfig(),
    coverage: "Quarters match",
    matchDepth: 11,
  });
  const d = s.players.find((p) => p.zone?.match)!;
  const receiver = s.players.find((p) => p.job === "route")!;
  receiver.pos = {
    x: (d.zone!.minX + d.zone!.maxX) / 2,
    y: s.config.rules.los + 10,
  };
  coverageTarget(d, s);
  expect(d.matched).toBe(false);
  receiver.pos.y += 1;
  coverageTarget(d, s);
  expect(d.receiver).toBe(receiver.id);
  expect(d.matched).toBe(true);
  receiver.pos.x = s.config.rules.width;
  expect(coverageTarget(d, s).x).toBe(receiver.pos.x);
});
it("passing 7v7 has two deep halves, five underneath pockets, exchanges and no rush", () => {
  const config = defaultConfig("passing7");
  config.rules.acknowledged = true;
  const s = createEngine(config);
  expect(s.players.filter((p) => p.job === "rush")).toHaveLength(0);
  expect(s.players.filter((p) => p.zone?.minDepth === 15)).toHaveLength(2);
  const under = s.players.filter((p) => p.zone?.maxDepth === 15);
  expect(under).toHaveLength(5);
  const receiver = s.players.find((p) => p.job === "route")!;
  receiver.pos = { x: under[0].landmark.x, y: s.config.rules.los + 5 };
  expect(coverageTarget(under[0], s)).not.toEqual(under[0].landmark);
  receiver.pos.x = under[1].landmark.x;
  expect(coverageTarget(under[0], s)).toEqual(under[0].landmark);
  expect(coverageTarget(under[1], s)).not.toEqual(under[1].landmark);
});
it("keeps the optional pocket target display-only, including after movement or target expiry", () => {
  for (const rushers of [4, 5, 6]) {
    const c = defaultConfig();
    c.pocketPreset = true;
    c.rules.rushers = rushers;
    const s = createEngine(c);
    expect(s.pocket!.deadline).toBeGreaterThanOrEqual(
      rushers === 4 ? 2.5 : 1.8,
    );
    expect(s.pocket!.deadline).toBeLessThanOrEqual(rushers === 4 ? 3.5 : 2.2);
  }
  const c = defaultConfig();
  c.pocketPreset = true;
  let s = snap(createEngine(c));
  const original = s.pocket!.deadline;
  const without = snap(createEngine({ ...c, pocketPreset: false }));
  const input = { move: { x: 0.2, y: 0.1 } };
  s = advanceTicks(s, 180, input);
  const other = advanceTicks(without, 180, input);
  expect(s.pocket!.deadline).toBe(original);
  expect({ ...s, config: undefined, pocket: undefined }).toEqual({ ...other, config: undefined, pocket: undefined });
  expect(s.events.some((e) => ["pocket-reset", "pocket-break"].includes(e.kind))).toBe(false);
});
it("shows strong three/weak one in Over and weak three/strong one in Under", () => {
  const config = defaultConfig();
  config.play = {
    ...formation("tackle"),
    tactics: { hash: "left", strongSide: "right", boundaryBreakScale: 1 },
  };
  const over = createEngine({ ...config, front: "Over" });
  const under = createEngine({ ...config, front: "Under" });
  const rg = over.players.find((p) => p.label === "RG")!,
    lg = over.players.find((p) => p.label === "LG")!,
    center = over.players.find((p) => p.role === "C")!;
  expect(over.players.find((p) => p.id === "D3")!.start.x).toBeGreaterThan(
    rg.start.x,
  );
  expect(over.players.find((p) => p.id === "D2")!.start.x).toBeLessThan(
    center.start.x,
  );
  expect(under.players.find((p) => p.id === "D2")!.start.x).toBeLessThan(
    lg.start.x,
  );
  expect(under.players.find((p) => p.id === "D3")!.start.x).toBeGreaterThan(
    center.start.x,
  );
});
it('keeps field side separate from formation strength for the local Cover 8 alias',()=>{
 const c=defaultConfig();c.coverage='Cover 8';c.play={...formation('tackle'),tactics:{hash:'right',strongSide:'right',boundaryBreakScale:1}};
 const s=createEngine(c);const half=s.players.find(p=>p.zone && !p.zone.match && p.zone.minDepth===15)!;
 expect(half.zone!.minX).toBe(0);expect(half.zone!.maxX).toBeCloseTo(c.rules.width/2);
 const flipped=createEngine({...c,halfSide:'right'}).players.find(p=>p.zone && !p.zone.match && p.zone.minDepth===15)!;
 expect(flipped.zone!.minX).toBeCloseTo(c.rules.width/2);
});
it('rejects a hash-tagged center moved off the declared ball spot',()=>{
 const c=defaultConfig();c.play={...formation('tackle'),tactics:{hash:'left',strongSide:'right',boundaryBreakScale:1}};
 c.play.players.find(p=>p.role==='C')!.start.x=48;
 expect(()=>createEngine(c)).toThrow('center at editor x=50');
});
