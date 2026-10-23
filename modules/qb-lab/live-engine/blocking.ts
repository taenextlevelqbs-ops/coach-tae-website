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
  // Solve the small line/threat matching together. Greedily assigning the center
  // first could send LT across the whole line to the right edge and leave RT idle.
  // At most five linemen and six threats are supported; this bounded search avoids
  // that crossing-assignment defect without guaranteeing an engagement or a win.
  let bestCost = Infinity;
  let best: Record<string, string> = {};
  const count = Math.min(line.length, threats.length);
  function match(index: number, remaining: number, cost: number, pairs: Record<string, string>, taken: Set<string>) {
    if (!remaining) {
      if (cost < bestCost - 1e-9) { bestCost = cost; best = { ...pairs }; }
      return;
    }
    if (line.length - index < remaining) return;
    const b = line[index];
    const bias = protection.startsWith("full")
      ? 4
      : protection.startsWith("half") && Math.abs(b.start.x - center) < 5 ? 2 : 0;
    for (const t of threats) if (!taken.has(t.id)) {
      pairs[b.id] = t.id; taken.add(t.id);
      match(index + 1, remaining - 1,
        cost + distance(b.pos, t.pos) - slide * bias * Math.sign(t.start.x - center),
        pairs, taken);
      delete pairs[b.id]; taken.delete(t.id);
    }
    if (line.length - index > remaining) match(index + 1, remaining, cost, pairs, taken);
  }
  match(0, count, 0, {}, new Set());
  Object.assign(plan, best);
  Object.values(best).forEach((id) => used.add(id));
  // A spare lineman can help a nearby accounted threat; he is not left motionless.
  for (const b of line.filter((p) => !plan[p.id])) {
    const t = [...threats].sort((a, d) => distance(b.pos, a.pos) - distance(b.pos, d.pos))[0];
    if (t) plan[b.id] = t.id;
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
  arc = false,
): { x: number; y: number } {
  const d = Math.max(0.1, distance(r.pos, qb.pos));
  if (arc && (b.role === "OL" || b.role === "C")) {
    const offset = Math.abs(b.start.x - qb.start.x);
    const anchorY = b.start.y - (b.role === "C" ? 0.8 : offset > 4 ? 2.5 : 1.4);
    return {
      // Set an arc in depth but mirror the threat's near shoulder laterally;
      // a fixed one-yard x cage let an accounted rusher simply run past the block.
      x: r.pos.x + ((qb.pos.x - r.pos.x) / d) * 0.8,
      y: Math.max(qb.pos.y + 1, Math.min(anchorY, r.pos.y - 0.7)),
    };
  }
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
/** RB/TE helpers scan actual uncovered or shed threats; no extra blocker is manufactured. */
export function scanProtection(s: EngineState) {
  const qb = s.players.find((p) => p.job === "qb")!;
  const time = s.tick / tuning.tickRate;
  for (const helper of s.players.filter(
    (p) => p.job === "block" && (p.role === "RB" || p.role === "TE"),
  )) {
    if (
      time < helper.recoveryUntil ||
      s.engagements.some((e) => e.blocker === helper.id)
    ) continue;
    const needsHelp = s.players.filter((r) => {
      if (r.job !== "rush") return false;
      const assigned = s.players.filter(
        (b) => b.job === "block" && b.id !== helper.id && s.plan[b.id] === r.id,
      );
      return !assigned.length || assigned.every((b) => b.recoveryUntil > time);
    });
    // Keep an existing uncovered assignment; otherwise pick the nearest urgent threat.
    const current = needsHelp.find((r) => r.id === s.plan[helper.id]);
    const target = current ?? needsHelp.sort(
      (a, b) =>
        distance(a.pos, qb.pos) + distance(helper.pos, a.pos) * 0.4 -
        distance(b.pos, qb.pos) - distance(helper.pos, b.pos) * 0.4 ||
        a.id.localeCompare(b.id),
    )[0];
    if (target && s.plan[helper.id] !== target.id) {
      s.plan[helper.id] = target.id;
      s.events.push({
        tick: s.tick,
        kind: "protection-scan",
        text: `${helper.label} scanned to ${target.label}, an uncovered or shed threat. Pickup still requires reaching engagement distance.`,
        actors: [helper.id, target.id],
      });
    }
  }
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
      // Losing the near shoulder reduces control. A squared, stronger blocker can hold
      // indefinitely in this simplified model; elapsed time alone never guarantees a shed.
      const lateral = Math.abs(r.pos.x - b.pos.x);
      const leverage = bound(lateral / tuning.engagementRadiusYards, 0, 1);
      const defense =
        b.ratings.passBlock + b.ratings.anchor + (double ? 0.5 : 0);
      const control = bound(
        (previous?.control ?? 0.5) +
          (defense - attack - leverage * 0.3 - (s.config.blitzTempo ?? 0)) * dt * 0.45,
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
      // Bull pressure moves the actual blocker back at a bounded yards/second rate.
      // Position still governs pressure/contact; no clock releases the engagement.
      if (r.move === "bull") {
        const drive = Math.max(0,
          r.ratings.power + r.ratings.strength -
          b.ratings.anchor - b.ratings.strength - (double ? 0.5 : 0),
        );
        const push = Math.min(0.8, drive) * dt;
        b.pos.y -= push;
        b.velocity.y = Math.min(b.velocity.y, -Math.min(0.8, drive));
      }
      // A nearby, accounted-for blocker limits penetration until leverage/control is lost.
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
