import { tuning } from "./tuning";
import type { Actor, EngineState, Input, Outcome } from "./types";
import type { Point } from "../simulation/model";
import { bound, distance, seeded } from "./roster";
export function finish(s: EngineState, outcome: Outcome, text: string) {
  if (s.phase === "done") return;
  s.phase = "done";
  s.outcome = outcome;
  s.endedAt = s.tick / 30;
  s.events.push({ tick: s.tick, kind: outcome, text });
}
export function moveToward(
  p: Actor,
  target: Point,
  dt: number,
  speed?: number,
) {
  const dx = target.x - p.pos.x,
    dy = target.y - p.pos.y,
    d = Math.hypot(dx, dy);
  const max = speed ?? (3.3 + p.ratings.speed * 3) * (1 - p.fatigue * 0.12);
  const desired = {
    x: d > 0.05 ? (dx / d) * Math.min(max, d / dt) : 0,
    y: d > 0.05 ? (dy / d) * Math.min(max, d / dt) : 0,
  };
  const acceleration = (4 + p.ratings.acceleration * 7) * dt;
  const change = Math.hypot(desired.x - p.velocity.x, desired.y - p.velocity.y);
  const blend = change > 0 ? Math.min(1, acceleration / change) : 1;
  p.velocity = {
    x: p.velocity.x + (desired.x - p.velocity.x) * blend,
    y: p.velocity.y + (desired.y - p.velocity.y) * blend,
  };
  p.pos = { x: p.pos.x + p.velocity.x * dt, y: p.pos.y + p.velocity.y * dt };
  p.fatigue = Math.min(1, p.fatigue + dt * (1 - p.ratings.stamina) * 0.025);
}
/** Arc is parameterized in yards/seconds, not calibrated to any athlete. */
export function release(s: EngineState, input: Input) {
  const qb = s.players.find((p) => p.job === "qb")!;
  const r = s.config.rules;
  if (input.throwAway) {
    if (qb.pos.y >= r.los) {
      s.events.push({
        tick: s.tick,
        kind: "invalid-input",
        text: "A forward pass cannot be released beyond the line in this exercise.",
      });
      return;
    }
    finish(
      s,
      "throw-away",
      "You ended the teaching rep with a throw-away. Intentional-grounding eligibility is not adjudicated.",
    );
    return;
  }
  const target = s.players.find(
    (p) => p.id === input.throwTo && p.job === "route" && p.eligible,
  );
  if (!target || qb.pos.y >= r.los) return;
  const speed = tuning.throwSpeedYardsPerSecond; // tunable synthetic throw velocity in yards/second
  const lead = distance(qb.pos, target.pos) / speed;
  const moving = Math.hypot(qb.velocity.x, qb.velocity.y);
  const error = 0.2 + s.pressure * 1.0 + moving * 0.1;
  const offset = input.placement ?? { x: 0, y: 0 };
  if (!Number.isFinite(offset.x) || !Number.isFinite(offset.y))
    throw new Error("Throw placement must be finite.");
  const aim = {
    x:
      target.pos.x +
      target.velocity.x * lead +
      bound(offset.x, -3, 3) +
      (seeded(s.config.seed, `x${s.tick}`) - 0.5) * error,
    y:
      target.pos.y +
      target.velocity.y * lead +
      bound(offset.y, -3, 3) +
      (seeded(s.config.seed, `y${s.tick}`) - 0.5) * error,
  };
  const flight = Math.max(0.22, distance(qb.pos, aim) / speed);
  s.ball = {
    origin: { ...qb.pos },
    pos: { ...qb.pos },
    aim,
    height: 1.8,
    elapsed: 0,
    flight,
    apex: Math.min(5, 1.1 + flight),
    target: target.id,
    released: s.tick / 30,
  };
  s.phase = "flight";
  s.throwTime = s.tick / 30;
  s.qbState = "release";
  s.events.push({
    tick: s.tick,
    kind: "throw",
    text: `Released toward ${target.label} at ${(s.tick / 30).toFixed(2)}s; pressure ${s.pressure.toFixed(2)}, moving ${moving.toFixed(1)} yd/s.`,
    actors: ["QB", target.id],
  });
}
export function advanceBall(s: EngineState, dt: number) {
  const b = s.ball;
  if (!b) return;
  b.elapsed += dt;
  const u = bound(b.elapsed / b.flight, 0, 1);
  b.pos = {
    x: b.origin.x + (b.aim.x - b.origin.x) * u,
    y: b.origin.y + (b.aim.y - b.origin.y) * u,
  };
  b.height = 1.8 + 4 * b.apex * u * (1 - u);
  const defense = s.players.filter((p) => p.team === "defense");
  const interceptor = defense.find(
    (p) =>
      distance(p.pos, b.pos) < tuning.interceptionRadiusYards &&
      b.height < 2.5 &&
      b.elapsed > 0.12,
  );
  if (interceptor) {
    finish(
      s,
      "interception",
      `${interceptor.label} reached the low ball within the 0.55-yard control radius.`,
    );
    return;
  }
  const tip = defense.find(
    (p) =>
      distance(p.pos, b.pos) < tuning.disruptionRadiusYards &&
      b.height < 2.4 &&
      b.elapsed > 0.12,
  );
  if (tip) {
    finish(
      s,
      "deflection",
      `${tip.label} reached the ball within the 0.95-yard disruption radius.`,
    );
    return;
  }
  if (u < 1) return;
  const r = s.config.rules;
  if (b.pos.x < 0 || b.pos.x > r.width || b.pos.y < 0 || b.pos.y > r.length) {
    finish(s, "incomplete", "The pass landed outside the configured field.");
    return;
  }
  const catcher = s.players.find(
    (p) =>
      p.job === "route" &&
      p.eligible &&
      distance(p.pos, b.pos) <= tuning.catchRadiusYards,
  );
  if (catcher) {
    finish(
      s,
      b.pos.y >= r.length - 0.5 ? "touchdown" : "completion",
      `${catcher.label} reached the ball within the 1.1-yard catch radius. This exercise is dead at the catch${b.pos.y >= r.length - 0.5 ? `; configured touchdown value ${r.touchdown}` : ""}.`,
    );
  } else
    finish(
      s,
      "incomplete",
      "No eligible receiver reached the landing point within the catch radius.",
    );
}
