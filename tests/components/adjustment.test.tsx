import { it, expect } from "vitest";
import { render, renderHook, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LabShell } from "../../modules/qb-lab/LabShell";
import { AdjustmentLesson } from "../../modules/qb-lab/football/AdjustmentLesson";
import { resetLab, useLocalLab } from "../../modules/qb-lab/platform/store";
it("records only a fully reviewed pre-snap lesson, once, for the selected demo athlete", async () => {
  resetLab(); const { result } = renderHook(() => useLocalLab()); const user = userEvent.setup();
  render(<LabShell><AdjustmentLesson /></LabShell>);
  const lesson = within(screen.getByRole("region", { name: "Pre-snap adjustment lesson" }));
  expect(lesson.getByRole("button",{name:"Check adjustment"})).toBeDisabled();
  for (let i=0;i<3;i++) {
    await user.click(lesson.getAllByRole("radio")[1]);
    await user.click(lesson.getByRole("button",{name:"Check adjustment"}));
    if (i<2) { expect(result.current.state.activities).toHaveLength(0); await user.click(lesson.getByRole("button",{name:"Next adjustment"})); }
  }
  expect(result.current.state.activities).toHaveLength(1);
  expect(result.current.state.activities[0]).toMatchObject({kind:"lesson",review:{correct:3,total:3},profile:"B"});
  expect(lesson.getByRole("button",{name:"Check adjustment"})).toBeDisabled();
  expect(lesson.getByRole("link",{name:/Try the live pocket/})).toHaveAttribute("href","/qb-lab/simulator/engine");
});

it("distinguishes incorrect answers from reviewed/completed decisions", async () => {
  resetLab(); const {result}=renderHook(()=>useLocalLab()); const user=userEvent.setup();
  render(<LabShell><AdjustmentLesson /></LabShell>);
  const lesson=within(screen.getByRole("region",{name:"Pre-snap adjustment lesson"}));
  for(let i=0;i<3;i++) {
    await user.click(lesson.getAllByRole("radio")[i===0?0:1]);
    await user.click(lesson.getByRole("button",{name:"Check adjustment"}));
    if(i<2) await user.click(lesson.getByRole("button",{name:"Next adjustment"}));
  }
  expect(lesson.getByText(/2 of 3 correct · all decisions reviewed/)).toBeVisible();
  expect(result.current.state.activities[0].review).toEqual({correct:2,total:3});
});
