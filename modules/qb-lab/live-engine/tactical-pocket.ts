import type { Actor, EngineConfig } from "./types";
/** Optional fixed teaching target only. It never changes engagements, movement or outcomes. */
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
  return { deadline };
}
