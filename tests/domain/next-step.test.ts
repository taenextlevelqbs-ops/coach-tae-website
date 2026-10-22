import { describe, it, expect } from "vitest";
import { nextStep } from "../../modules/qb-lab/platform/next-step";
import { empty, type LocalState } from "../../modules/qb-lab/platform/store";
const lesson = {
  id: "lesson",
  kind: "lesson" as const,
  reference: "observation-tackle",
  at: "2026-10-22T12:00:00Z",
  profile: "A" as const,
};
describe("personal next step", () => {
  it("starts honestly and prioritizes open assignments for the matching athlete and pathway", () => {
    expect(nextStep(empty, "tackle").href).toBe("/qb-lab/iq");
    const state: LocalState = {
      ...empty,
      assignments: [
        { id: "other", drill: "footwork", profile: "B", status: "assigned" },
        {
          id: "wrong-path",
          drill: "flag-space",
          profile: "A",
          status: "assigned",
        },
        { id: "mine", drill: "observe", profile: "A", status: "assigned" },
      ],
    };
    expect(nextStep(state, "tackle").href).toContain(
      "activity=observe&profile=A",
    );
    expect(nextStep(state, "flag").href).toContain("activity=flag-space");
  });
  it("connects a missed observation to a walkthrough and respects later completion", () => {
    const activities = [{ ...lesson, reference: "observation-tackle-revisit" }];
    expect(nextStep({ ...empty, activities }, "tackle").href).toContain(
      "activity=observe",
    );
    expect(
      nextStep(
        {
          ...empty,
          activities: [
            ...activities,
            {
              ...lesson,
              id: "work",
              kind: "workout",
              reference: "observe",
              at: "2026-10-22T13:00:00Z",
            },
          ],
        },
        "tackle",
      ).href,
    ).toBe("/qb-lab/simulator");
  });
  it("keeps other profiles and flag lessons from advancing tackle practice", () => {
    expect(
      nextStep(
        { ...empty, activities: [{ ...lesson, profile: "B" }] },
        "tackle",
      ).href,
    ).toBe("/qb-lab/iq");
    expect(nextStep({ ...empty, activities: [lesson] }, "flag").href).toBe(
      "/qb-lab/iq",
    );
    expect(
      nextStep(
        {
          ...empty,
          activities: [
            lesson,
            {
              ...lesson,
              id: "sim",
              kind: "simulation",
              reference: "tackle-spacing",
            },
          ],
        },
        "tackle",
      ).href,
    ).toBe("/qb-lab/film");
  });
});
