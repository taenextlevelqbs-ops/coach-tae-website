"use client";
import { updateLab, type Activity } from "../platform/store";

export type TrainingStatus = "not-started" | "in-progress" | "completed";
export type TrainingProfile = "A" | "B";

/** Derived browser history only. Imported/self-reported events never prove athlete ability. */
export function statusFor(
  activities: readonly Activity[],
  profile: TrainingProfile,
  reference: string,
): TrainingStatus {
  const mine = activities.filter((a) => (a.profile ?? "A") === profile);
  const completionKind = reference.startsWith("recognition-") ? "lesson" : "workout";
  if (mine.some((a) => a.kind === completionKind && a.reference === reference))
    return "completed";
  if (mine.some((a) => a.kind === "lesson" && a.reference === `started:${reference}`))
    return "in-progress";
  return "not-started";
}

function validateTrainingReference(profile: TrainingProfile, reference: string) {
  // The existing v1 activity schema permits at most 80 characters, including started:.
  // Recognition completion is owned by the actual lesson; this API cannot check it off.
  if (
    !["A", "B"].includes(profile) ||
    reference.length > 72 ||
    !/^(workout|recovery):[a-z0-9]+(?:-[a-z0-9]+)*$/.test(reference)
  ) throw new Error("Choose a valid workout or recovery activity.");
}

export type TrainingUpdate = {
  status: TrainingStatus;
  changed: boolean;
  persisted: boolean;
};

function recordTraining(
  profile: TrainingProfile,
  reference: string,
  target: "in-progress" | "completed",
): TrainingUpdate {
  validateTrainingReference(profile, reference);
  let status: TrainingStatus = "not-started";
  let changed = false;
  const persisted = updateLab((previous) => {
    status = statusFor(previous.activities, profile, reference);
    if (status === "completed" || (target === "in-progress" && status === "in-progress"))
      return previous;
    const activity: Activity = {
      id: crypto.randomUUID(),
      kind: target === "completed" ? "workout" : "lesson",
      profile,
      reference: target === "completed" ? reference : `started:${reference}`,
      at: new Date().toISOString(),
    };
    changed = true;
    status = target;
    return { ...previous, activities: [...previous.activities, activity].slice(-200) };
  });
  return { status, changed, persisted };
}

/** Idempotent while the matching event remains in the shared bounded history. */
export function beginTraining(profile: TrainingProfile, reference: string): TrainingUpdate {
  return recordTraining(profile, reference, "in-progress");
}

/** A self-reported completion; no performance score, account sync or assignment delivery. */
export function completeTraining(profile: TrainingProfile, reference: string): TrainingUpdate {
  return recordTraining(profile, reference, "completed");
}
