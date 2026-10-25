import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import {
  recordActivity,
  resetLab,
  updateLab,
  useLocalLab,
} from "../../modules/qb-lab/platform/store";

beforeEach(() => resetLab());

it("does not complete scenario assignments from a generic recognition walkthrough", () => {
  const { result } = renderHook(() => useLocalLab());
  act(() => {
    updateLab((s) => ({
      ...s,
      assignments: [
        { id: "cover-2", profile: "A", drill: "recognition", recognition: "t43-c2", status: "assigned" },
        { id: "cover-6", profile: "A", drill: "recognition", recognition: "t425-c6", status: "assigned" },
        { id: "footwork-a", profile: "A", drill: "footwork", status: "assigned" },
        { id: "footwork-b", profile: "B", drill: "footwork", status: "assigned" },
      ],
    }));
    recordActivity("workout", "recognition", undefined, "A");
  });
  expect(result.current.state.assignments.every((a) => a.status === "assigned")).toBe(true);
  act(() => recordActivity("workout", "footwork", undefined, "A"));
  expect(result.current.state.assignments.map((a) => [a.id, a.status])).toEqual([
    ["cover-2", "assigned"],
    ["cover-6", "assigned"],
    ["footwork-a", "complete"],
    ["footwork-b", "assigned"],
  ]);
});
