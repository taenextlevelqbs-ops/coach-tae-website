import { throwEstimate } from "./assessment";
import { tuning } from "./tuning";
import type { Actor, Ball, EngineState, Input, Outcome } from "./types";
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
  const estimate = throwEstimate(s, target);
  const error = 0.2 + (1 - estimate.probability) * 4;
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
    text: `Released toward ${target.label} at ${(s.tick / 30).toFixed(2)}s; pressure ${s.pressure.toFixed(2)}, moving ${moving.toFixed(1)} yd/s; synthetic completion estimate ${Math.round(estimate.probability * 100)}% (not measured athlete performance).`,
    actors: ["QB", target.id],
  });
}
/** Earliest contact in the tick: linear planar paths, parabolic height, bounded reach.
 * Defender motion is interpolated from the current tick's velocity. This avoids
 * fast balls skipping a defender between render/tick positions; it is not hand physics.
 */
function sweptContact(
  b: Ball, p: Actor, start: number, end: number, dt: number,
  radius: number, ceiling: number,
): number | null {
  const span = end - start;
  if (span <= 0) return null;
  const u0 = bound(start / b.flight, 0, 1);
  const u1 = bound(end / b.flight, 0, 1);
  const from = {
    x: b.origin.x + (b.aim.x - b.origin.x) * u0 - p.pos.x + p.velocity.x * dt,
    y: b.origin.y + (b.aim.y - b.origin.y) * u0 - p.pos.y + p.velocity.y * dt,
  };
  const delta = {
    x: (b.aim.x - b.origin.x) * (u1 - u0) - p.velocity.x * span,
    y: (b.aim.y - b.origin.y) * (u1 - u0) - p.velocity.y * span,
  };
  const aa = delta.x ** 2 + delta.y ** 2;
  const bb = 2 * (from.x * delta.x + from.y * delta.y);
  const cc = from.x ** 2 + from.y ** 2 - radius ** 2;
  let low = 0, high = 1;
  if (aa < 1e-12) {
    if (cc > 0) return null;
  } else {
    const disc = bb ** 2 - 4 * aa * cc;
    if (disc < 0) return null;
    low = Math.max(0, (-bb - Math.sqrt(disc)) / (2 * aa));
    high = Math.min(1, (-bb + Math.sqrt(disc)) / (2 * aa));
    if (low > high) return null;
  }
  const first = Math.max(start + low * span, 0.12 + 1e-9);
  const last = start + high * span;
  if (first > last) return null;
  const c = (ceiling - 1.8) / (4 * b.apex);
  if (c >= 0.25 || b.apex <= 0) return first;
  const root = Math.sqrt(Math.max(0, 1 - 4 * c));
  const rising = (b.flight * (1 - root)) / 2;
  const falling = (b.flight * (1 + root)) / 2;
  if (first <= Math.min(last, rising)) return first;
  const late = Math.max(first, falling);
  return late <= last ? late : null;
}
export function advanceBall(s: EngineState, dt: number) {
  const b = s.ball;
  if (!b) return;
  const prior = b.elapsed;
  b.elapsed = Math.min(b.flight, b.elapsed + dt);
  const u = bound(b.elapsed / b.flight, 0, 1);
  b.pos = {
    x: b.origin.x + (b.aim.x - b.origin.x) * u,
    y: b.origin.y + (b.aim.y - b.origin.y) * u,
  };
  b.height = 1.8 + 4 * b.apex * u * (1 - u);
  const defense = s.players.filter((p) => p.team === "defense");
  const contacts = defense.flatMap<{ p: Actor; at: number; outcome: "interception" | "deflection" }>((p) => {
    const control = sweptContact(b, p, prior, b.elapsed, dt, tuning.interceptionRadiusYards, 2.5);
    // Control has priority when the same defender can secure this tick's low ball.
    // Otherwise an earlier disruption ends the pass before a later defender arrives.
    const disruption = control === null
      ? sweptContact(b, p, prior, b.elapsed, dt, tuning.disruptionRadiusYards, 2.4)
      : null;
    return control !== null
      ? [{ p, at: control, outcome: "interception" as const }]
      : disruption !== null
        ? [{ p, at: disruption, outcome: "deflection" as const }]
        : [];
  }).sort((a, c) => a.at - c.at || a.p.id.localeCompare(c.p.id));
  const contact = contacts[0];
  if (contact) {
    b.elapsed = contact.at;
    const hitU = bound(b.elapsed / b.flight, 0, 1);
    b.pos = { x: b.origin.x + (b.aim.x - b.origin.x) * hitU, y: b.origin.y + (b.aim.y - b.origin.y) * hitU };
    b.height = 1.8 + 4 * b.apex * hitU * (1 - hitU);
    finish(
      s,
      contact.outcome,
      `${contact.p.label} ${contact.outcome === "interception" ? "controlled" : "disrupted"} the low ball along its swept flight segment (${contact.outcome === "interception" ? "0.55-yard control" : "0.95-yard disruption"} radius).`,
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
