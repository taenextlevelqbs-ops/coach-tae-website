import { describe, expect, it } from "vitest";
import { featuredWorkoutSlug, workoutBySlug, workoutCategories, workouts } from "@/modules/qb-lab/training/workouts";
import { trainingReference } from "@/modules/qb-lab/training/types";
import { dailySession } from "@/modules/qb-lab/training/daily";

describe("curated draft backyard workout library", () => {
  it("covers the required distinct skills with routable unique records and short category lists", () => {
    const required = [
      "three-step-drop", "five-step-drop", "three-step-drop-shuffle", "five-step-drop-shuffle",
      "three-cone-footwork", "pocket-ladder", "reset-your-feet", "quick-game-footwork",
      "step-up-pocket", "slide-left-reset", "slide-right-reset", "escape-reset", "rollout-footwork", "climb-pocket",
      "qb-stance-ball-position", "grip-release-fundamentals", "hip-rotation", "weight-transfer", "follow-through", "set-feet-before-throwing",
      "balance-base", "controlled-shuffle", "reset-throw", "throwing-on-move-fundamentals",
    ];
    expect(new Set(workouts.map(item => item.slug))).toEqual(new Set(required));
    expect(new Set(workouts.map(item => item.title)).size).toBe(24);
    expect(new Set(workouts.map(item => item.steps.map(step => step.body).join(" "))).size).toBe(24);
    for (const category of workoutCategories) {
      const list = workouts.filter(item => item.category === category.title);
      expect(list.length).toBeGreaterThanOrEqual(4);
      expect(list.length).toBeLessThanOrEqual(8);
    }
    for (const item of workouts) {
      expect(workoutBySlug(item.slug)).toBe(item);
      expect(item.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(item.kind).toBe("workout");
      expect(item.start.length).toBeGreaterThan(30);
      expect(item.purpose.length).toBeGreaterThan(30);
      expect(item.steps.length).toBeGreaterThanOrEqual(4);
      expect(item.steps.every(step => step.title.length > 3 && step.body.length > 35)).toBe(true);
      expect(item.mistakes.length).toBeGreaterThanOrEqual(2);
      expect(item.safety.join(" ")).toMatch(/stop/i);
      expect(item.reviewNote).toMatch(/Draft.*review/i);
      expect(item.duration).toMatch(/draft estimate/);
      expect(item.dose).toBe("Coach sets your reps");
      expect(item.tip.length).toBeGreaterThan(30);
    }
    expect(workoutBySlug("unknown")).toBeUndefined();
    expect(workoutBySlug("__proto__")).toBeUndefined();
  });

  it("uses a true backward-drop then forward-shuffle diagram and the same daily-training destination", () => {
    const main = workoutBySlug(featuredWorkoutSlug)!;
    const [start, drop, finish] = main.diagram!.points;
    expect(drop.y).toBeGreaterThan(start.y); // Downfield points up; a drop moves down the drawing.
    expect(finish.y).toBeLessThan(drop.y); // The following shuffle moves forward again.
    expect(finish.y).toBeGreaterThan(start.y); // The short shuffle does not erase the whole drop.
    expect([start.x, drop.x, finish.x]).toEqual([160, 160, 160]);
    expect(main.diagram!.caption).toMatch(/not a footprint or distance prescription/);
    expect(main.steps.find(step => step.title === "Shuffle up")?.body).toMatch(/forward/);
    for (const pathway of ["tackle", "flag"] as const) {
      expect(dailySession(pathway)[0].href).toBe(`/qb-lab/workouts/${main.slug}`);
      expect(dailySession(pathway)[0].reference).toBe(trainingReference(main));
    }
    for (const item of workouts.filter(item => item.diagram)) {
      for (const point of item.diagram!.points) {
        expect(point.x).toBeGreaterThanOrEqual(20);
        expect(point.x).toBeLessThanOrEqual(300);
        expect(point.y).toBeGreaterThanOrEqual(20);
        expect(point.y).toBeLessThanOrEqual(140);
      }
    }
  });

  it("teaches pressure and movement as conditional choices instead of automatic rewards", () => {
    expect(workoutBySlug("step-up-pocket")!.steps[0].body).toMatch(/interior pressure.*unsafe/);
    expect(workoutBySlug("climb-pocket")!.tip).toMatch(/do not earn extra time/);
    expect(workoutBySlug("quick-game-footwork")!.steps[0].body).toMatch(/under-center or shotgun/);
    expect(workoutBySlug("throwing-on-move-fundamentals")!.safety.join(" ")).toMatch(/review before adding a real moving throw/);
    expect(workoutBySlug("grip-release-fundamentals")!.steps[0].body).toMatch(/no single finger count/);
    expect(workoutBySlug("follow-through")!.steps[1].body).toMatch(/Do not force/);
  });
});
