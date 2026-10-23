import type { Actor, EngineConfig, EngineState } from "./types";
export function makePocket(config: EngineConfig, players: Actor[]) {
  if (!config.pocketPreset || config.rules.format !== "tackle11")
    return undefined;
  const blockers = players.filter((p) => p.job === "block");
  const rush = players.filter((p) => p.job === "rush");
  const advantage =
    blockers.reduce(
      (sum, p) => sum + (p.ratings.passBlock + p.ratings.anchor) / 2,
      0,
    ) /
      Math.max(1, blockers.length) -
    rush.reduce(
      (sum, p) => sum + (p.ratings.power + p.ratings.finesse) / 2,
      0,
    ) /
      Math.max(1, rush.length);
  const blitz = rush.length >= 5;
  const base = blitz ? (rush.length >= 6 ? 1.8 : 2.2) : 3;
  const deadline = Math.max(
    blitz ? 1.8 : 2.5,
    Math.min(blitz ? 2.2 : 3.5, base + advantage),
  );
  return {
    deadline,
    escaped: false,
    origin: { ...players.find((p) => p.job === "qb")!.start },
    broken: false,
  };
}
export function updatePocket(s: EngineState, repositioning = false) {
  const p = s.pocket;
  if (!p || s.phase !== "live") return;
  const time = s.tick / 30;
  const qb = s.players.find((a) => a.job === "qb")!;
  const shed = s.events.some((e) => e.kind === "shed");
  // A single earned extension, not an endlessly renewable protection guarantee.
  if (
    shed &&
    repositioning &&
    time >= 0.9 &&
    !p.escaped &&
    Math.hypot(qb.pos.x - p.origin.x, qb.pos.y - (p.origin.y - 3)) >= 2 &&
    s.pressure < 0.8
  ) {
    p.deadline += 1;
    p.escaped = true;
    s.events.push({
      tick: s.tick,
      kind: "pocket-reset",
      text: "One-time +1.0s teaching adjustment after a shed and a reposition. Existing rushers are not reset or removed.",
    });
  }
  if (time < p.deadline || p.broken) return;
  p.broken = true;
  const pairs = Object.entries(s.plan)
    .map(([blocker, rusher]) => ({
      b: s.players.find((a) => a.id === blocker)!,
      r: s.players.find((a) => a.id === rusher)!,
    }))
    .filter((pair) => pair.b && pair.r);
  pairs.sort(
    (a, b) =>
      a.b.ratings.passBlock -
      a.r.ratings.finesse -
      (b.b.ratings.passBlock - b.r.ratings.finesse),
  );
  const pair = pairs[0];
  if (pair) pair.b.recoveryUntil = time + 1;
  s.events.push({
    tick: s.tick,
    kind: "pocket-break",
    text: "The selected teaching pocket deadline released a vulnerable blocker. Find a hot answer or move; contact still determines the outcome.",
  });
}
