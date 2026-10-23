// @vitest-environment node
import { describe, it, expect } from "vitest";
import { defaultConfig } from "../../modules/qb-lab/live-engine/defaults";
import { createEngine, snap, step, coverageTarget } from "../../modules/qb-lab/live-engine/engine";
import { pocketWindow, throwEstimate } from "../../modules/qb-lab/live-engine/assessment";
import { resolveBlocks } from "../../modules/qb-lab/live-engine/blocking";
import { POST } from "../../app/api/qb-lab/simulator/pocket/route";

describe("playable beta: causal synthetic mechanics", () => {
  it("estimates less pocket time for a free threat and aggressive tempo, more for stronger blocking", () => {
    const balanced = createEngine(defaultConfig());
    const stronger = createEngine({ ...defaultConfig(), matchup: "offense-edge" });
    expect(pocketWindow(stronger)!).toBeGreaterThan(pocketWindow(balanced)!);
    const blitz = defaultConfig(); blitz.rules.rushers = 6; blitz.blitzTempo = 0.25;
    expect(pocketWindow(createEngine(blitz))!).toBeLessThan(pocketWindow(balanced)!);
    const pass = defaultConfig("passing7"); pass.rules.acknowledged = true;
    const none = createEngine(pass);
    none.players = none.players.filter(p => p.job !== "rush");
    expect(pocketWindow(none)).toBeNull();
  });
  it("changes actual engagement control and rush movement, not merely the displayed timer", () => {
    function engage(tempo: number) {
      const s = snap(createEngine({ ...defaultConfig(), blitzTempo: tempo }));
      const r = s.players.find(p => p.job === "rush")!;
      const b = s.players.find(p => p.job === "block")!;
      s.plan = { [b.id]: r.id }; b.pos = { ...r.pos };
      resolveBlocks(s, 1 / 30); return s.engagements[0].control;
    }
    expect(engage(0.25)).toBeLessThan(engage(0));
    const s = snap(createEngine(defaultConfig()));
    const r = s.players.find(p => p.job === "rush")!;
    r.velocity = { x: 0, y: -6 }; s.plan = {};
    const faster = structuredClone(s); faster.config.blitzTempo = 0.25;
    expect(step(faster).players.find(p => p.id === r.id)!.velocity).not.toEqual(step(s).players.find(p => p.id === r.id)!.velocity);
  });
  it("penalizes pressure, movement, early releases and deep pocket drift while staying bounded", () => {
    const s = snap(createEngine(defaultConfig())); s.tick = 60;
    const target = s.players.find(p => p.job === "route")!;
    const clean = throwEstimate(s, target).probability;
    const pressured = structuredClone(s); pressured.pressure = 1;
    expect(throwEstimate(pressured, target).probability).toBeLessThan(clean);
    const qb = s.players.find(p => p.job === "qb")!; qb.velocity.x = 4;
    expect(throwEstimate(s, target).probability).toBeLessThan(clean);
    qb.velocity.x = 0; s.tick = 0;
    expect(throwEstimate(s, target).probability).toBeLessThan(clean);
    s.tick = 60; qb.pos.y -= 9;
    expect(throwEstimate(s, target).probability).toBeLessThan(clean);
    s.pressure = 1; qb.velocity.x = 10;
    expect(throwEstimate(s, target).probability).toBeGreaterThanOrEqual(0.05);
  });
  it("Cover 2 and Cover 3 zones respond to observed routes without abandoning their deep floors", () => {
    for (const coverage of ["Cover 2", "Cover 3"] as const) {
      const s = createEngine({ ...defaultConfig(), coverage });
      const deep = s.players.find(p => p.job === "zone" && p.landmark.y > s.config.rules.los + 12)!;
      const target = s.players.find(p => p.job === "route")!;
      s.players.filter(p => p.job === "route").forEach(p => p.pos = {x:0,y:0});
      target.pos = { x: deep.landmark.x + 3, y: deep.landmark.y - 2 };
      const observed = coverageTarget(deep, s);
      expect(observed.x).toBeGreaterThan(deep.landmark.x);
      expect(observed.y).toBeGreaterThanOrEqual(deep.landmark.y - 3);
      target.route = [{ x: 0, y: 0 }];
      expect(coverageTarget(deep, s)).toEqual(observed);
      target.pos = {x:0,y:0};
      expect(coverageTarget(deep, s)).toEqual(deep.landmark);
    }
  });
});

describe("bounded stateless server pocket calculations", () => {
  const request = (data: unknown, origin = "http://localhost") => new Request("http://localhost/api/qb-lab/simulator/pocket", { method:"POST", headers:{"content-type":"application/json",origin}, body:JSON.stringify(data) });
  it("returns repeatable fixture estimates, no identity or persisted results, and no-store", async () => {
    const a = await POST(request({ matchup:"offense-edge", rushers:4 }));
    const b = await POST(request({ matchup:"offense-edge", rushers:4 }));
    expect(a.status).toBe(200); expect(a.headers.get("cache-control")).toBe("no-store");
    expect(await a.json()).toEqual(await b.json());
    expect((await POST(request({ticks:120}))).status).toBe(200);
  });
  it("rejects malformed, over-budget, cross-origin and identity-bearing input", async () => {
    for (const body of [null,[], {ticks:121},{ticks:-1},{rushers:100},{blitzTempo:2},{matchup:"real-athlete"},{playerId:"minor"},{help:"invalid"}]) expect((await POST(request(body))).status).toBe(400);
    expect((await POST(request({},"https://other.test"))).status).toBe(403);
    expect((await POST(request({extra:"x".repeat(3000)}))).status).toBe(413);
    expect((await POST(new Request("http://localhost/api/qb-lab/simulator/pocket", {method:"POST",body:"{}"}))).status).toBe(415);
  });
});

it("invalid synthetic matchup modifiers fail validation before creating a rep", () => {
  expect(() => createEngine({...defaultConfig(),blitzTempo:Infinity})).toThrow(/tempo/);
  expect(() => createEngine({...defaultConfig(),blitzTempo:-0.1})).toThrow(/tempo/);
});

it("pressure and off-balance movement change the actual release dispersion for the same seeded throw", async () => {
  const { release } = await import("../../modules/qb-lab/live-engine/physics");
  const clean = snap(createEngine(defaultConfig())); clean.tick = 60;
  const target = clean.players.find(p => p.job === "route")!;
  const pressured = structuredClone(clean); pressured.pressure = 1;
  pressured.players.find(p => p.job === "qb")!.velocity.x = 4;
  release(clean,{throwTo:target.id}); release(pressured,{throwTo:target.id});
  const error = (s: typeof clean) => Math.hypot(s.ball!.aim.x-target.pos.x,s.ball!.aim.y-target.pos.y);
  expect(error(pressured)).toBeGreaterThan(error(clean));
});

it("checks the browser-facing host when Next uses an internal proxy URL", async () => {
  const response = await POST(new Request("http://localhost:3150/api/qb-lab/simulator/pocket",{method:"POST",headers:{"content-type":"application/json",origin:"http://127.0.0.1:3150",host:"127.0.0.1:3150"},body:"{}"}));
  expect(response.status).toBe(200);
});

it("rejects a different origin scheme while accepting the proxy's HTTPS transport", async () => {
  const make=(forwarded?: string)=>new Request("http://localhost/api/qb-lab/simulator/pocket",{method:"POST",headers:{"content-type":"application/json",origin:"https://localhost",...(forwarded?{"x-forwarded-proto":forwarded}:{})},body:"{}"});
  expect((await POST(make())).status).toBe(403);
  expect((await POST(make("https"))).status).toBe(200);
});
