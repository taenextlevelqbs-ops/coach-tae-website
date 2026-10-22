import type { EngineState } from "./types";
export function coaching(s: EngineState) {
  const events = s.events;
  const notes: string[] = [];
  if (s.phase !== "done")
    return [
      "Inspect the alignment, declare protection and observe the actual post-snap movement. A starting safety shell cannot confirm the call.",
    ];
  notes.push(
    `Recorded outcome: ${s.outcome} at ${(s.endedAt ?? s.tick / 30).toFixed(2)}s. ${events.at(-1)?.text ?? ""}`,
  );
  if (events.some((e) => e.kind === "unaccounted"))
    notes.push(events.find((e) => e.kind === "unaccounted")!.text);
  const engagementCount = events.filter((e) => e.kind === "engage").length;
  if (engagementCount)
    notes.push(
      `${engagementCount} recorded block engagements. ${events.filter((e) => e.kind === "shed").length} recorded sheds. A blitz count by itself did not determine the result.`,
    );
  if (s.throwTime !== undefined)
    notes.push(
      `Time to throw: ${s.throwTime.toFixed(2)}s. Peak positional pressure: ${s.peakPressure.toFixed(2)} on this model's 0–1 scale. This is a simulation event, not a real athlete measurement.`,
    );
  else if (s.outcome === "sack")
    notes.push(
      "The rusher reached the controlled QB before release. Review the unaccounted threat and engagement events; changing protection or moving can change the next rep.",
    );
  if (s.config.rules.format === "tackle11")
    notes.push(
      `Called ${s.config.coverage}; pre-snap ${s.config.shell}-high. Inspect the responsibility ledger before describing a rotation. No universal progression or concept mastery is graded.`,
    );
  return notes;
}
export function recommendedLesson(s: EngineState) {
  return s.outcome === "sack" || s.peakPressure > 0.5
    ? { href: "/qb-lab/workouts", label: "Work on a balanced base and reset" }
    : {
        href: "/qb-lab/iq",
        label: "Study coverage clues and post-snap confirmation",
      };
}
