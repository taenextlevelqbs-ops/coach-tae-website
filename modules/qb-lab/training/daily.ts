import type { Pathway } from "../demo";
import { recognitionPreset, type RecognitionPreset } from "../football/presets";
import { drills } from "../platform/catalog";
import { nextStep } from "../platform/next-step";
import type { Activity, LocalState } from "../platform/store";
import { statusFor, type TrainingProfile } from "./progress";

export type DailyTrainingStep = {
  id: string;
  title: string;
  detail: string;
  href: string;
  reference: string;
};

/** Matches the completed activity emitted by RecognitionLab, not a fake session checkbox. */
export function recognitionActivityReference(preset: RecognitionPreset): string {
  return `recognition-${preset.format}-${preset.format === "tackle"
    ? `${preset.personnel}-${preset.front}-${preset.coverage}`
    : preset.example}`.replaceAll(" ", "-");
}

/** A fixed draft sample, not a personalized or automatically dated training prescription. */
export function dailySession(pathway: Pathway): DailyTrainingStep[] {
  const preset = recognitionPreset(pathway === "flag" ? "f5-one" : "t34-c3")!;
  return [
    {
      id: "daily-footwork",
      title: "3-Step Drop + Shuffle",
      detail: "Footwork · 5 minutes · draft sample",
      href: "/qb-lab/workouts/three-step-drop-shuffle",
      reference: "workout:three-step-drop-shuffle",
    },
    {
      id: "daily-shoulder-mobility",
      title: "Gentle Shoulder Mobility",
      detail: "Recovery · comfortable movement · draft sample",
      href: "/qb-lab/recovery/gentle-shoulder-mobility",
      reference: "recovery:gentle-shoulder-mobility",
    },
    {
      id: `daily-${preset.id}`,
      title: pathway === "flag" ? "Flag Defensive Recognition" : "Cover 3 Recognition",
      detail: pathway === "flag"
        ? "Football IQ · select your flag rules before the rep"
        : "Football IQ · observe the shell, then confirm movement",
      href: `/qb-lab/iq?lesson=${preset.id}#recognition`,
      reference: recognitionActivityReference(preset),
    },
  ];
}

export function nextDailyStep(
  activities: readonly Activity[],
  profile: TrainingProfile,
  pathway: Pathway,
): DailyTrainingStep | undefined {
  return dailySession(pathway).find((step) => statusFor(activities, profile, step.reference) !== "completed");
}

/** Preserve the actual local coach queue and its existing deep links; never substitute another drill. */
export function pendingTrainingAssignment(
  state: LocalState,
  pathway: Pathway,
  profile: TrainingProfile,
): DailyTrainingStep | undefined {
  const assignment = state.assignments.find((a) =>
    a.profile === profile && a.status === "assigned" && drills.some((d) =>
      d.id === a.drill && (d.pathway === "both" || d.pathway === pathway)));
  if (!assignment) return undefined;
  const next = nextStep(state, pathway, profile);
  const preset = recognitionPreset(assignment.recognition);
  return {
    id: assignment.id,
    title: next.title,
    detail: "Assigned in this browser's coach demo · not sent from a real account",
    href: next.href,
    reference: preset ? recognitionActivityReference(preset) : assignment.drill,
  };
}
