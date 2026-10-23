import { spatialTarget } from "./spatial";
import { makePocket } from "./tactical-pocket";
import { tuning } from "./tuning";
import type { Point } from "../simulation/model";
import type { EngineConfig, EngineState, Actor, Input } from "./types";
import { bound, distance, makeRoster, validateConfig } from "./roster";
import { assignProtection, blockTarget, resolveBlocks, scanProtection } from "./blocking";
import { advanceBall, finish, moveToward, release } from "./physics";
export const STEP = 1 / tuning.tickRate;
export function createEngine(config: EngineConfig): EngineState {
  const issues = validateConfig(config);
  if (issues.length) throw new Error(issues.join(" "));
  const players = makeRoster(config);
  return {
    config: structuredClone(config),
    tick: 0,
    phase: "ready",
    players,
    plan: assignProtection(players, config.protection),
    engagements: [],
    events: [],
    pressure: 0,
    peakPressure: 0,
    qbState: "stance",
    pocket: makePocket(config, players),
  };
}
export function snap(state: EngineState): EngineState {
  if (state.phase !== "ready") return state;
  const s = structuredClone(state);
  s.phase = "live";
  s.events.push({
    tick: 0,
    kind: "snap",
    text: `Snap: ${s.config.rules.offense} offense, ${s.config.rules.defense} defense, ${s.config.rules.rushers} assigned rushers. Shell is a clue, not a coverage guarantee.`,
  });
  const accounted = new Set(Object.values(s.plan));
  const free = s.players.filter(
    (p) => p.job === "rush" && !accounted.has(p.id),
  );
  if (free.length)
    s.events.push({
      tick: 0,
      kind: "unaccounted",
      text: `${free.map((p) => p.label).join(", ")} not accounted for by this protection. Position and pursuit still determine pressure, not blitz count alone.`,
    });
  return s;
}
export function routePoint(a: Actor, t: number): Point {
  let remaining = t * (3.3 + a.ratings.speed * 3);
  let from = a.start;
  for (const to of a.route) {
    const d = distance(from, to);
    if (remaining <= d)
      return {
        x: from.x + ((to.x - from.x) * remaining) / Math.max(d, 0.001),
        y: from.y + ((to.y - from.y) * remaining) / Math.max(d, 0.001),
      };
    remaining -= d;
    from = to;
  }
  return from;
}
function rushTarget(a: Actor, qb: Actor, los: number): Point {
  if (a.move === "twist" && a.pos.y > los - 0.5)
    return { x: a.start.x + (a.start.x < qb.start.x ? 3 : -3), y: los - 0.8 };
  if (
    ["speed", "edge", "rip", "swim", "spin"].includes(a.move) &&
    a.pos.y > qb.pos.y + 1.7
  ) {
    return {
      x: a.start.x + (a.start.x < qb.start.x ? -1.8 : 1.8),
      y: qb.pos.y + 0.9,
    };
  }
  if (
    a.move === "contain" &&
    Math.abs(qb.pos.x - qb.start.x) < 8 &&
    a.pos.y > qb.pos.y + 1
  )
    return { x: a.start.x, y: qb.pos.y + 0.7 };
  return {
    x: qb.pos.x + qb.velocity.x * (0.12 + a.ratings.pursuit * 0.12),
    y: qb.pos.y + qb.velocity.y * 0.12,
  };
}
export function coverageTarget(a: Actor, s: EngineState): Point {
  const spatial = spatialTarget(a, s);
  if (spatial) return spatial;
  const receiver = s.players.find(
    (p) => p.id === a.receiver && p.team === "offense",
  );
  const los = s.config.rules.los;
  if (a.job === "man" && receiver)
    return { x: receiver.pos.x, y: receiver.pos.y + 0.7 };
  if (
    a.job === "match" &&
    receiver &&
    receiver.pos.y > los + tuning.matchVerticalDepthYards
  )
    return { x: receiver.pos.x, y: receiver.pos.y + 0.9 };
  if (
    s.ball &&
    s.ball.elapsed >
      tuning.throwReactionDelaySeconds + (1 - a.ratings.awareness) * 0.4 &&
    distance(a.pos, s.ball.aim) < 9
  )
    return s.ball.aim;
  const qb = s.players.find((p) => p.job === "qb")!;
  if (s.phase === "live" && qb.pos.y > los) return qb.pos;
  const close = s.players
    .filter(
      (p) =>
        p.job === "route" &&
        Math.abs(p.pos.x - a.landmark.x) < (a.landmark.y > los + 12 ? 10 : 6) &&
        Math.abs(p.pos.y - a.landmark.y) < 9,
    )
    .sort((p, q) => distance(p.pos, a.pos) - distance(q.pos, a.pos))[0];
  if (close)
    return {
      x: bound(close.pos.x, a.landmark.x - 5, a.landmark.x + 5),
      y: bound(close.pos.y + 1, a.landmark.y - 3, a.landmark.y + 4),
    };
  return a.landmark;
}
/** One fixed tick; wall-clock scheduling cannot change the result of the same input sequence. */
export function step(state: EngineState, input: Input = {}): EngineState {
  if (state.phase === "ready" || state.phase === "done") return state;
  const s = structuredClone(state);
  s.tick++;
  const t = s.tick * STEP;
  const r = s.config.rules;
  const qb = s.players.find((p) => p.job === "qb")!;
  if (s.phase === "live") {
    const move = input.move ?? { x: 0, y: 0 };
    const m = Math.hypot(move.x, move.y);
    const dir = m > 1 ? { x: move.x / m, y: move.y / m } : move;
    if (!Number.isFinite(dir.x) || !Number.isFinite(dir.y))
      throw new Error("QB movement must be finite.");
    const autoDrop = s.config.rules.format === "tackle11" && t < 0.9 && !m;
    const target = autoDrop
      ? { x: qb.start.x, y: qb.start.y - 3 }
      : m
        ? { x: qb.pos.x + dir.x * 3, y: qb.pos.y + dir.y * 3 }
        : qb.pos;
    moveToward(qb, target, STEP, autoDrop ? 3 : 5);
    s.qbState = autoDrop
      ? "drop"
      : m
        ? Math.abs(qb.pos.x - r.width / 2) > 8
          ? "escape"
          : "hitch"
        : "reset";
    if (!r.qbRun || (r.noRunZone > 0 && r.length - r.los <= r.noRunZone)) {
      if (qb.pos.y >= r.los - 0.15) {
        qb.pos.y = r.los - 0.15;
        qb.velocity.y = Math.min(0, qb.velocity.y);
      }
    }
    if (
      qb.pos.x < 0 ||
      qb.pos.x > r.width ||
      qb.pos.y < 0 ||
      qb.pos.y > r.length
    ) {
      finish(
        s,
        "out-of-bounds",
        "The controlled QB left the configured field.",
      );
      return s;
    }
    if (qb.pos.y >= r.length - 0.5) {
      finish(
        s,
        "touchdown",
        `The QB crossed the instructional goal line; configured touchdown value ${r.touchdown}.`,
      );
      return s;
    }
  } else
    s.qbState = s.ball && s.ball.elapsed < 0.25 ? "release" : "follow-through";
  for (const a of s.players.filter((p) => p.job === "route"))
    moveToward(a, routePoint(a, t), STEP);
  if (r.blocking) scanProtection(s);
  for (const a of s.players.filter((p) => p.job === "block")) {
    const threat = s.players.find((p) => p.id === s.plan[a.id]);
    if (threat && t >= a.recoveryUntil) {
      const target = blockTarget(a, threat, qb, r.los, r.format === "tackle11");
      if (s.engagements.some((e) => e.blocker === a.id))
        target.y = Math.min(target.y, a.pos.y);
      moveToward(
        a,
        target,
        STEP,
        2.3 + a.ratings.footwork,
      );
    }
  }
  for (const a of s.players.filter((p) => p.team === "defense")) {
    if (a.job === "rush") {
      if (t < a.delay) continue;
      moveToward(
        a,
        rushTarget(a, qb, r.los),
        STEP,
        4.2 + a.ratings.speed * 2 + (s.config.blitzTempo ?? 0) * 2,
      );
    } else moveToward(a, coverageTarget(a, s), STEP);
  }
  if (r.blocking) resolveBlocks(s, STEP);
  const rush = s.players.filter((p) => p.job === "rush");
  const nearest = rush.length
    ? Math.min(...rush.map((p) => distance(p.pos, qb.pos)))
    : Infinity;
  s.pressure = bound(
    (tuning.pressureDistanceYards - nearest) /
      (tuning.pressureDistanceYards - tuning.pressureFullDistanceYards),
    0,
    1,
  );
  s.peakPressure = Math.max(s.peakPressure, s.pressure);
  if (
    s.phase === "live" &&
    s.pressure > 0.5 &&
    !s.events.some((e) => e.kind === "pressure")
  )
    s.events.push({
      tick: s.tick,
      kind: "pressure",
      text: `Live pressure: nearest rusher ${nearest.toFixed(1)} yards from QB; actual positions determine urgency.`,
    });
  if (s.phase === "live" && nearest < tuning.contactRadiusYards) {
    finish(
      s,
      r.format === "tackle11"
        ? qb.pos.y < r.los
          ? "sack"
          : "tackle"
        : "flag-pull",
      `${rush.sort((a, b) => distance(a.pos, qb.pos) - distance(b.pos, qb.pos))[0].label} reached the QB within the 0.72-yard ${r.format.startsWith("flag") ? "flag-pull" : "contact"} radius at ${t.toFixed(2)}s. This is a simplified positional outcome, not contact biomechanics.`,
    );
    return s;
  }
  if (s.phase === "live" && r.passClock !== null && t + 1e-9 >= r.passClock) {
    finish(
      s,
      "clock",
      `The selected ${r.passClock}-second direct-pass clock expired before release. This is not a sack.`,
    );
    return s;
  }
  if (s.phase === "live" && (input.throwTo || input.throwAway))
    release(s, input);
  if (s.phase === "flight") advanceBall(s, STEP);
  // Bounded teaching horizon is a reset request, never an invented sack.
  if (s.phase !== "done" && t >= tuning.teachingHorizon)
    finish(
      s,
      "practice-ended",
      "The 18-second teaching horizon ended. No sack or completion was inferred; reset for another rep.",
    );
  for (const a of s.players.filter((p) => p.job !== "qb")) {
    a.pos.x = bound(a.pos.x, 0, r.width);
    a.pos.y = bound(a.pos.y, 0, r.length);
  }
  return s;
}
export function advanceTicks(
  s: EngineState,
  count: number,
  input: Input = {},
): EngineState {
  if (!Number.isInteger(count) || count < 0 || count > 600)
    throw new Error("Advance 0–600 whole ticks.");
  for (let i = 0; i < count; i++) s = step(s, input);
  return s;
}
