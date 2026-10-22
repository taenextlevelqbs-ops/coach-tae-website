import { tuning } from "./tuning";
import type { Actor, EngineState, Engagement } from "./types";
import { bound, distance } from "./roster";
export function assignProtection(
  players: Actor[],
  protection: EngineState["config"]["protection"],
): Record<string, string> {
  const center =
    players.find((p) => p.team === "offense" && p.role === "C")?.start.x ??
    players.find((p) => p.job === "qb")!.start.x;
  const threats = players.filter((p) => p.job === "rush");
  const blockers = players.filter((p) => p.job === "block");
  const plan: Record<string, string> = {};
  const used = new Set<string>();
  const slide = protection.includes("left")
    ? -1
    : protection.includes("right")
      ? 1
      : 0;
  // Slide declarations prioritize that side's threats. They cannot create extra blockers.
  const ordered = [...blockers].sort((a, b) =>
    slide
      ? (a.start.x - b.start.x) * -slide
      : Math.abs(a.start.x - center) - Math.abs(b.start.x - center),
  );
  const line = ordered.filter((p) => p.role === "OL" || p.role === "C");
  for (const b of line) {
    const candidates = threats.filter((t) => !used.has(t.id));
    candidates.sort((a, d) => {
      const bias = protection.startsWith("full")
        ? 4
        : protection.startsWith("half") && Math.abs(b.start.x - center) < 5
          ? 2
          : 0;
      return (
        distance(b.pos, a.pos) -
        distance(b.pos, d.pos) -
        slide * bias * Math.sign(a.start.x - d.start.x)
      );
    });
    if (candidates[0]) {
      plan[b.id] = candidates[0].id;
      used.add(candidates[0].id);
    }
  }
  for (const b of ordered.filter((p) => !line.includes(p))) {
    const unassigned = threats.filter((t) => !used.has(t.id));
    const pool = unassigned.length ? unassigned : threats;
    const t = [...pool].sort(
      (a, d) => distance(b.pos, a.pos) - distance(b.pos, d.pos),
    )[0];
    if (t) {
      plan[b.id] = t.id;
      used.add(t.id);
    }
  }
  return plan;
}
export function blockTarget(
  b: Actor,
  r: Actor,
  qb: Actor,
  los: number,
): { x: number; y: number } {
  const d = Math.max(0.1, distance(r.pos, qb.pos));
  // Interpose on the rusher/QB segment, protect the near shoulder rather than chase behind the QB.
  return {
    x: r.pos.x + ((qb.pos.x - r.pos.x) / d) * 0.8,
    y: Math.max(
      qb.pos.y + 1,
      Math.min(
        b.role === "RB" || b.role === "TE" ? los - 3 : b.start.y - 1.2,
        r.pos.y + ((qb.pos.y - r.pos.y) / d) * 0.8,
      ),
    ),
  };
}
/** Engagement is geometric; strength/technique affect control, never a global sack timer. */
export function resolveBlocks(s: EngineState, dt: number) {
  const next: Engagement[] = [];
  for (const r of s.players.filter((p) => p.job === "rush")) {
    const blockers = s.players.filter(
      (b) =>
        s.plan[b.id] === r.id &&
        s.tick * dt >= b.recoveryUntil &&
        distance(b.pos, r.pos) < tuning.engagementRadiusYards,
    );
    if (!blockers.length) continue;
    const old = s.engagements.filter((e) => e.rusher === r.id);
    const double = blockers.length > 1;
    const attack =
      r.move === "bull"
        ? r.ratings.power + r.ratings.strength
        : r.ratings.finesse + r.ratings.shedding;
    for (const b of blockers) {
      const previous = old.find((e) => e.blocker === b.id);
      const defense =
        b.ratings.passBlock + b.ratings.anchor + (double ? 0.5 : 0);
      const control = bound(
        (previous?.control ?? 0.5) + (defense - attack - 0.14) * dt * 0.45,
        0,
        1,
      );
      next.push({
        blocker: b.id,
        rusher: r.id,
        control,
        since: previous?.since ?? s.tick * dt,
      });
      if (!previous)
        s.events.push({
          tick: s.tick,
          kind: "engage",
          text: `${b.label} engaged ${r.label}${double ? " with protection help" : ""}.`,
          actors: [b.id, r.id],
        });
      // Anchor can lose ground gradually. A nearby, accounted-for blocker limits penetration.
      r.pos.y = Math.max(r.pos.y, b.pos.y + (0.35 + control * 0.5));
      r.velocity.y = Math.max(r.velocity.y, -(1 - control) * 0.7);
      if (control < 0.22) {
        b.recoveryUntil = s.tick * dt + 0.7 + (1 - b.ratings.recovery) * 0.4;
        r.pos.x +=
          r.start.x <
          (s.players.find((p) => p.team === "offense" && p.role === "C")?.start
            .x ?? s.config.rules.width / 2)
            ? -0.2
            : 0.2;
        s.events.push({
          tick: s.tick,
          kind: "shed",
          text: `${r.label} shed ${b.label}'s ${r.move} engagement.`,
          actors: [r.id, b.id],
        });
        next.pop();
      }
    }
  }
  s.engagements = next;
}
