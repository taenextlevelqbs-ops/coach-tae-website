import { gameFormats, type GameFormat } from "./formats";
import type { EngineState, Outcome } from "./types";
export type EngineReport = {
  format: GameFormat;
  outcome: Outcome;
  elapsed: number;
  throwTime?: number;
  peakPressure: number;
  engagements: number;
  sheds: number;
  seed: number;
};
const outcomes: Outcome[] = [
  "sack",
  "flag-pull",
  "tackle",
  "clock",
  "incomplete",
  "deflection",
  "interception",
  "completion",
  "touchdown",
  "out-of-bounds",
  "throw-away",
  "practice-ended",
];
export function validReport(value: unknown): value is EngineReport {
  if (!value || typeof value !== "object") return false;
  const r = value as EngineReport;
  return (
    gameFormats.includes(r.format) &&
    outcomes.includes(r.outcome) &&
    Number.isFinite(r.elapsed) &&
    r.elapsed >= 0 &&
    r.elapsed <= 18.04 &&
    (r.throwTime === undefined ||
      (Number.isFinite(r.throwTime) &&
        r.throwTime >= 0 &&
        r.throwTime <= r.elapsed)) &&
    Number.isFinite(r.peakPressure) &&
    r.peakPressure >= 0 &&
    r.peakPressure <= 1 &&
    [r.engagements, r.sheds].every(
      (n) => Number.isInteger(n) && n >= 0 && n <= 6000,
    ) &&
    Number.isSafeInteger(r.seed) &&
    r.seed >= 0 &&
    r.seed <= 2147483647
  );
}
export function cleanReport(r: EngineReport): EngineReport {
  return {
    format: r.format,
    outcome: r.outcome,
    elapsed: r.elapsed,
    ...(r.throwTime !== undefined ? { throwTime: r.throwTime } : {}),
    peakPressure: r.peakPressure,
    engagements: r.engagements,
    sheds: r.sheds,
    seed: r.seed,
  };
}
export function report(s: EngineState): EngineReport {
  if (s.phase !== "done" || !s.outcome)
    throw new Error("Only completed reps have reports.");
  return {
    format: s.config.rules.format,
    outcome: s.outcome,
    elapsed: s.endedAt ?? s.tick / 30,
    ...(s.throwTime !== undefined ? { throwTime: s.throwTime } : {}),
    peakPressure: s.peakPressure,
    engagements: s.events.filter((e) => e.kind === "engage").length,
    sheds: s.events.filter((e) => e.kind === "shed").length,
    seed: s.config.seed,
  };
}
