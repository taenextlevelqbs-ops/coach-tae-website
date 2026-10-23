import { beforeEach, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HomeDashboard } from "../../modules/qb-lab/HomeDashboard";
import { LabShell, PathwaySwitch } from "../../modules/qb-lab/LabShell";
import { AdjustmentLesson } from "../../modules/qb-lab/football/AdjustmentLesson";
import { Workouts } from "../../modules/qb-lab/platform/Workouts";
import { resetLab, updateLab } from "../../modules/qb-lab/platform/store";

const router = vi.hoisted(() => ({ pathname: "/qb-lab" }));
vi.mock("next/navigation", () => ({ usePathname: () => router.pathname }));
beforeEach(() => { resetLab(); router.pathname = "/qb-lab"; });

it("shows the selected learning pathway on home and resets the corresponding adjustment lesson", async () => {
  const user = userEvent.setup();
  render(<LabShell><PathwaySwitch /><HomeDashboard /><AdjustmentLesson /></LabShell>);
  await user.selectOptions(screen.getByLabelText("Demo athlete profile"), "A");
  expect(screen.getByRole("radio", { name: "Tackle" })).toBeChecked();
  expect(screen.getByRole("heading", { name: "What's up, Alex!" })).toBeVisible();
  const lesson = within(screen.getByRole("region", { name: "Pre-snap adjustment lesson" }));
  await user.click(lesson.getAllByRole("radio")[1]);
  await user.click(lesson.getByRole("button", { name: "Check adjustment" }));
  await user.click(lesson.getByRole("button", { name: "Next adjustment" }));
  await user.click(screen.getByRole("radio", { name: "Flag" }));
  expect(screen.getByRole("radio", { name: "Flag" })).toBeChecked();
  const updatedLesson = within(screen.getByRole("region", { name: "Pre-snap adjustment lesson" }));
  expect(updatedLesson.getByText(/Three short decisions/)).toHaveTextContent("Flag pathway");
  expect(updatedLesson.getByRole("group")).toHaveAccessibleName(/^1 of 3:/);
  expect(updatedLesson.getByRole("button", { name: "Check adjustment" })).toBeDisabled();
});

it("keeps Simulator active on the nested live simulator route", () => {
  router.pathname = "/qb-lab/simulator/engine";
  render(<LabShell><p>Simulator</p></LabShell>);
  const nav = within(screen.getByRole("navigation", { name: "QB LAB navigation" }));
  expect(nav.getByRole("link", { name: "Simulator" })).toHaveAttribute("aria-current", "page");
  expect(nav.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
});

it("opens the assigned recognition scenario instead of offering a generic completion button", async () => {
  updateLab((s) => ({ ...s, assignments: [
    { id: "assigned-look", profile: "A", drill: "recognition", recognition: "t425-c6", status: "assigned" },
  ] }));
  const user = userEvent.setup();
  render(<LabShell><Workouts initialActivity="recognition" profile="A" /></LabShell>);
  await user.selectOptions(screen.getByLabelText("Demo athlete profile"), "A");
  expect(screen.getByRole("link", { name: "Start interactive recognition" })).toHaveAttribute("href", "/qb-lab/iq?lesson=t425-c6#recognition");
  expect(screen.queryByRole("button", { name: "Complete activity" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Next step" })).not.toBeInTheDocument();
  expect(screen.getByText(/Reading these steps does not complete a coach assignment/)).toBeVisible();
});
