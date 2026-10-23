import type { Actor, EngineState } from "./types";
import { bound, distance } from "./roster";

/** Synthetic coaching model, not measured athlete ability or a calibrated game probability. */
export function pocketWindow(s: EngineState) {
  const rushers = s.players.filter(p => p.job === "rush");
  if (!rushers.length) return null;
  const qb = s.players.find(p => p.job === "qb")!;
  const elapsed = s.tick / 30;
  return Math.min(...rushers.map(r => {
    const blockers = s.players.filter(b => s.plan[b.id] === r.id && b.job === "block" && b.recoveryUntil <= elapsed);
    const best = Math.max(0, ...blockers.map(b => (b.ratings.passBlock + b.ratings.anchor) / 2));
    const attack = (r.ratings.power + r.ratings.finesse) / 2;
    const hold = blockers.length ? bound(1.5 + (best - attack) * 4 + (blockers.length - 1) * 0.6, 0.2, 3) : 0;
    return Math.max(0, r.delay - elapsed) + Math.max(0, distance(r.pos, qb.pos) - 0.72) / (4.2 + r.ratings.speed * 2 + (s.config.blitzTempo ?? 0) * 2) + hold;
  }));
}
export function throwEstimate(s: EngineState, target: Actor) {
  const qb = s.players.find(p => p.job === "qb")!;
  const range = distance(qb.pos, target.pos);
  const defenders = s.players.filter(p => p.team === "defense" && p.job !== "rush");
  const separation = defenders.length ? Math.min(...defenders.map(d => distance(d.pos, target.pos))) : 10;
  const movement = Math.hypot(qb.velocity.x, qb.velocity.y);
  const elapsed = s.tick / 30;
  const early = Math.max(0, 0.8 - elapsed);
  const depth = Math.max(0, qb.start.y - qb.pos.y - 5);
  const probability = bound(0.9 - s.pressure * 0.32 - movement * 0.045 - early * 0.2 - Math.max(0, range - 12) * 0.009 - depth * 0.018 - Math.max(0, 3 - separation) * 0.16, 0.05, 0.95);
  return { probability, pressure: s.pressure, movement, separation, range, early, depth };
}
