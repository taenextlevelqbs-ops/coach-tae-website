import { describe, expect, it } from "vitest";
import { getRecoveryExercise, recoveryCategories, recoveryExercises } from "../../modules/qb-lab/training/recovery";

describe("draft recovery content contracts", () => {
  it("provides the ten requested studies in three distinct, nonempty categories", () => {
    expect(recoveryCategories).toEqual([
      "Shoulder & Upper Body", "Mobility & Flexibility", "After-Training Cooldown",
    ]);
    expect(recoveryExercises.map((item) => item.slug)).toEqual([
      "gentle-shoulder-mobility", "shoulder-blade-movement", "upper-back-mobility", "upper-back-rotation",
      "hip-flexor-mobility", "gentle-hamstring-stretch", "chest-upper-body-stretch", "controlled-trunk-mobility",
      "post-training-cooldown", "rest-recovery-education",
    ]);
    for (const category of recoveryCategories) {
      expect(recoveryExercises.filter((item) => item.category === category).length).toBeGreaterThan(0);
    }
    expect(new Set(recoveryExercises.map((item) => item.start)).size).toBe(10);
    expect(new Set(recoveryExercises.map((item) => item.steps.map((step) => step.body).join(" "))).size).toBe(10);
  });

  it("requires practical starting positions, distinct steps, mistakes and explicit draft safety", () => {
    for (const item of recoveryExercises) {
      expect(item.kind).toBe("recovery");
      expect(item.slug).toMatch(/^[a-z]+(?:-[a-z]+)*$/);
      expect(recoveryCategories).toContain(item.category);
      expect(item.start.length, item.slug).toBeGreaterThan(60);
      expect(item.purpose.length, item.slug).toBeGreaterThan(40);
      expect(item.steps.length, item.slug).toBeGreaterThanOrEqual(4);
      expect(new Set(item.steps.map((step) => step.title)).size).toBe(item.steps.length);
      for (const step of item.steps) expect(step.body.length, `${item.slug}: ${step.title}`).toBeGreaterThan(40);
      expect(item.mistakes.length, item.slug).toBeGreaterThanOrEqual(2);
      expect(item.safety.join(" "), item.slug).toMatch(/parent\/guardian/);
      expect(item.safety.join(" "), item.slug).toMatch(/qualified healthcare professional/);
      expect(item.safety.join(" "), item.slug).toMatch(/pain/i);
      expect(item.reviewNote, item.slug).toMatch(/^DRAFT/);
      expect(item.reviewNote, item.slug).toContain("age adaptations and dose");
      expect(item.duration, item.slug).toBe("At your pace");
      expect(item.dose, item.slug).toContain("dose pending review");
      expect(item.dose, item.slug).not.toMatch(/\d/);
      expect(item.tip.length, item.slug).toBeGreaterThan(30);
    }
  });

  it("keeps supported floor positioning coherent with the actual instructions", () => {
    const side = getRecoveryExercise("upper-back-rotation")!;
    expect(side.start).toMatch(/on your side.*knees comfortably bent and stacked/);
    expect(side.steps.map((step) => step.body).join(" ")).toMatch(/knees stay together/);
    expect(side.mistakes.join(" ")).toContain("Forcing the top hand toward the floor");
    const back = getRecoveryExercise("controlled-trunk-mobility")!;
    expect(back.start).toMatch(/on your back.*knees bent.*feet resting on the floor/);
    expect(back.steps.map((step) => step.body).join(" ")).toMatch(/both shoulders supported/);
    const rest = getRecoveryExercise("rest-recovery-education")!;
    expect(rest.start).toContain("no physical exercise");
    expect(rest.steps.map((step) => step.body).join(" ")).toContain("does not prescribe a diet");
  });

  it("looks up only known exercise slugs and does not manufacture unknown instructions", () => {
    for (const item of recoveryExercises) expect(getRecoveryExercise(item.slug)).toBe(item);
    for (const value of ["", "__proto__", "Gentle-Shoulder-Mobility", "../film", "shoulder-rehabilitation"])
      expect(getRecoveryExercise(value)).toBeUndefined();
  });
});
