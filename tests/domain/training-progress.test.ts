import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Activity, LocalState } from "../../modules/qb-lab/platform/store";

const key = "coach-tae-qblab-local-v1";
const workout = "workout:three-step-drop-shuffle";
const recovery = "recovery:gentle-shoulder-mobility";
const at = "2026-10-23T16:00:00Z";
const event = (overrides: Partial<Activity> = {}): Activity => ({
  id: "event-one", kind: "workout", reference: workout, profile: "A", at, ...overrides,
});
const readSaved = () => JSON.parse(localStorage.getItem(key)!) as LocalState;

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
});
afterEach(() => vi.restoreAllMocks());

describe("training status derives from the existing local activity history", () => {
  it("requires the correct event kind, exact reference and demo profile", async () => {
    const { statusFor } = await import("../../modules/qb-lab/training/progress");
    expect(statusFor([], "A", workout)).toBe("not-started");
    expect(statusFor([event({ kind: "lesson", reference: `started:${workout}` })], "A", workout)).toBe("in-progress");
    expect(statusFor([event({ kind: "lesson" })], "A", workout)).toBe("not-started");
    expect(statusFor([event({ reference: recovery })], "A", workout)).toBe("not-started");
    expect(statusFor([event({ profile: "B" })], "A", workout)).toBe("not-started");
    expect(statusFor([event()], "A", workout)).toBe("completed");
    expect(statusFor([event({ profile: undefined })], "A", workout)).toBe("completed");
    expect(statusFor([event({ profile: undefined })], "B", workout)).toBe("not-started");
  });

  it("persists start/reload/complete idempotently without changing plays, goals or legacy assignments", async () => {
    let progress = await import("../../modules/qb-lab/training/progress");
    let store = await import("../../modules/qb-lab/platform/store");
    const { formation } = await import("../../modules/qb-lab/simulation/model");
    const play = formation("tackle");
    store.updateLab((s) => ({
      ...s,
      plays: [play],
      goals: ["Ask one specific coaching question"],
      assignments: [{ id: "legacy", profile: "A", drill: "footwork", status: "assigned" }],
    }));
    expect(progress.beginTraining("A", workout)).toEqual({ status: "in-progress", changed: true, persisted: true });
    expect(progress.beginTraining("A", workout).changed).toBe(false);
    expect(readSaved().activities).toHaveLength(1);
    const exported = store.parseState(JSON.stringify(readSaved()));
    expect(exported.activities[0]).toMatchObject({ kind: "lesson", profile: "A", reference: `started:${workout}` });
    expect(localStorage.length).toBe(1);

    // Fresh module instance must initialize from the same stored v1 history.
    vi.resetModules();
    progress = await import("../../modules/qb-lab/training/progress");
    store = await import("../../modules/qb-lab/platform/store");
    expect(progress.statusFor(store.parseState(JSON.stringify(exported)).activities, "A", workout)).toBe("in-progress");
    expect(progress.beginTraining("A", workout).changed).toBe(false);
    expect(progress.completeTraining("A", workout)).toEqual({ status: "completed", changed: true, persisted: true });
    expect(progress.completeTraining("A", workout).changed).toBe(false);
    expect(progress.beginTraining("A", workout).status).toBe("completed");
    const restored = store.parseState(JSON.stringify(readSaved()));
    expect(restored.activities).toHaveLength(2);
    expect(restored.activities[1]).toMatchObject({ kind: "workout", profile: "A", reference: workout });
    expect(restored.plays).toEqual([play]);
    expect(restored.goals).toEqual(exported.goals);
    expect(restored.assignments).toEqual(exported.assignments);
  });

  it("keeps starts and completions separate between profiles and recovery/workout references", async () => {
    const { beginTraining, completeTraining, statusFor } = await import("../../modules/qb-lab/training/progress");
    completeTraining("A", workout);
    beginTraining("B", workout);
    beginTraining("A", recovery);
    const { activities } = readSaved();
    expect(statusFor(activities, "A", workout)).toBe("completed");
    expect(statusFor(activities, "B", workout)).toBe("in-progress");
    expect(statusFor(activities, "A", recovery)).toBe("in-progress");
    expect(statusFor(activities, "B", recovery)).toBe("not-started");
  });

  it("reset removes training progress from the same shared data and exports", async () => {
    const { beginTraining, completeTraining, statusFor } = await import("../../modules/qb-lab/training/progress");
    const { resetLab, updateLab, parseState } = await import("../../modules/qb-lab/platform/store");
    beginTraining("A", workout); completeTraining("A", recovery);
    expect(readSaved().activities).toHaveLength(2);
    resetLab();
    expect(localStorage.getItem(key)).toBeNull();
    let snapshot: LocalState | undefined;
    updateLab((s) => { snapshot = s; return s; });
    const exported = parseState(JSON.stringify(snapshot));
    expect(exported.activities).toEqual([]);
    expect(statusFor(exported.activities, "A", workout)).toBe("not-started");
    expect(statusFor(exported.activities, "A", recovery)).toBe("not-started");
  });

  it("respects the existing 200-event bound and does not retain hidden completion state", async () => {
    const { completeTraining, statusFor } = await import("../../modules/qb-lab/training/progress");
    const { updateLab, parseState } = await import("../../modules/qb-lab/platform/store");
    updateLab((s) => ({ ...s, activities: Array.from({ length: 200 }, (_, i) =>
      event({ id: `history-${i}`, reference: `other-${i}` })) }));
    completeTraining("A", workout);
    const exported = parseState(JSON.stringify(readSaved()));
    expect(exported.activities).toHaveLength(200);
    expect(exported.activities[0].id).toBe("history-1");
    expect(statusFor(exported.activities, "A", workout)).toBe("completed");
    updateLab((s) => ({ ...s, activities: [] }));
    expect(statusFor(readSaved().activities, "A", workout)).toBe("not-started");
  });

  it("reports memory-only progress when browser persistence fails", async () => {
    const { beginTraining, completeTraining, statusFor } = await import("../../modules/qb-lab/training/progress");
    const { updateLab } = await import("../../modules/qb-lab/platform/store");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked storage"); });
    expect(beginTraining("A", workout)).toEqual({ status: "in-progress", changed: true, persisted: false });
    expect(completeTraining("A", workout)).toEqual({ status: "completed", changed: true, persisted: false });
    let memory: Activity[] = [];
    updateLab((s) => { memory = s.activities; return s; });
    expect(statusFor(memory, "A", workout)).toBe("completed");
    expect(localStorage.getItem(key)).toBeNull();
  });

  it("bounds activity references and cannot mark Football IQ complete through the training API", async () => {
    const { beginTraining, completeTraining } = await import("../../modules/qb-lab/training/progress");
    const maxReference = `workout:${"a".repeat(64)}`;
    expect(beginTraining("A", maxReference).status).toBe("in-progress");
    expect(readSaved().activities[0].reference).toHaveLength(80);
    for (const bad of ["workout:", "workout:bad--slug", `workout:${"a".repeat(65)}`, "recovery:<script>", "recognition-tackle-3-4-Odd-Cover-3"])
      expect(() => completeTraining("A", bad)).toThrow(/valid workout or recovery/);
    expect(readSaved().activities).toHaveLength(1);
  });
});

describe("daily session connects existing activities and local assignments", () => {
  it("advances in order only from matching recorded completion, including the real recognition reference", async () => {
    const { dailySession, nextDailyStep } = await import("../../modules/qb-lab/training/daily");
    const { completeTraining, statusFor } = await import("../../modules/qb-lab/training/progress");
    const { recordActivity } = await import("../../modules/qb-lab/platform/store");
    const tackle = dailySession("tackle"), flag = dailySession("flag");
    expect(tackle).toHaveLength(3);
    expect(tackle.map((s) => s.reference)).toEqual([workout, recovery, "recognition-tackle-3-4-Odd-Cover-3"]);
    expect(flag[2].href).toBe("/qb-lab/iq?lesson=f5-one#recognition");
    expect(flag[2].reference).toBe("recognition-flag5-0");
    expect(nextDailyStep([], "A", "tackle")?.id).toBe(tackle[0].id);
    completeTraining("A", workout);
    expect(nextDailyStep(readSaved().activities, "A", "tackle")?.id).toBe(tackle[1].id);
    completeTraining("A", recovery);
    expect(nextDailyStep(readSaved().activities, "A", "tackle")?.id).toBe(tackle[2].id);
    recordActivity("workout", tackle[2].reference, undefined, "A");
    recordActivity("lesson", flag[2].reference, undefined, "A");
    recordActivity("lesson", tackle[2].reference, undefined, "B");
    expect(statusFor(readSaved().activities, "A", tackle[2].reference)).toBe("not-started");
    recordActivity("lesson", tackle[2].reference, undefined, "A");
    expect(nextDailyStep(readSaved().activities, "A", "tackle")).toBeUndefined();
  });

  it("keeps the first eligible local assignment and its exact legacy deep link", async () => {
    const { pendingTrainingAssignment } = await import("../../modules/qb-lab/training/daily");
    const { empty } = await import("../../modules/qb-lab/platform/store");
    const state: LocalState = {
      ...empty,
      assignments: [
        { id: "other-profile", profile: "B", drill: "footwork", status: "assigned" },
        { id: "completed", profile: "A", drill: "footwork", status: "complete" },
        { id: "flag-only", profile: "A", drill: "flag-space", status: "assigned" },
        { id: "mine", profile: "A", drill: "footwork", status: "assigned" },
        { id: "later", profile: "A", drill: "observe", status: "assigned" },
      ],
    };
    expect(pendingTrainingAssignment(state, "tackle", "A")).toMatchObject({
      id: "mine", reference: "footwork", href: "/qb-lab/workouts?activity=footwork&profile=A",
    });
    expect(pendingTrainingAssignment(state, "flag", "A")?.id).toBe("flag-only");
    expect(pendingTrainingAssignment({ ...state, assignments: [] }, "tackle", "A")).toBeUndefined();
    state.assignments = [{ id: "coverage", profile: "A", drill: "recognition", recognition: "t34-c3", status: "assigned" }];
    expect(pendingTrainingAssignment(state, "tackle", "A")).toMatchObject({
      id: "coverage", href: "/qb-lab/iq?lesson=t34-c3#recognition", reference: "recognition-tackle-3-4-Odd-Cover-3",
    });
  });
});
