import { StrictMode } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LabShell } from "@/modules/qb-lab/LabShell";
import { InstructionDetail } from "@/modules/qb-lab/training/InstructionDetail";
import { workoutBySlug } from "@/modules/qb-lab/training/workouts";
import { resetLab, type LocalState } from "@/modules/qb-lab/platform/store";
import { trainingReference } from "@/modules/qb-lab/training/types";

const item = workoutBySlug("three-step-drop-shuffle")!;
const nextItem = workoutBySlug("five-step-drop")!;
const reference = trainingReference(item);
const readSaved = () => JSON.parse(localStorage.getItem("coach-tae-qblab-local-v1")!) as LocalState;
const detail = () => <LabShell><InstructionDetail item={item} /></LabShell>;

beforeEach(async () => {
  resetLab();
  localStorage.clear();
  // Use the real demo selector without letting a previous test's selection create a start event.
  const setup = render(<LabShell><span>Choose a synthetic profile.</span></LabShell>);
  await userEvent.setup().selectOptions(screen.getByLabelText("Demo athlete profile"), "A");
  setup.unmount();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("shared instruction detail lifecycle", () => {
  it("records actual starts and completions once, survives remount and isolates each demo athlete", async () => {
    const user = userEvent.setup();
    const view = render(<StrictMode>{detail()}</StrictMode>);
    expect(screen.getByRole("heading", { name: item.title })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Follow These Steps" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Listen to Instructions" })).not.toBeInTheDocument();
    expect(readSaved().activities).toMatchObject([{ kind: "lesson", profile: "A", reference: `started:${reference}` }]);

    await user.click(screen.getByRole("button", { name: "Mark Drill Complete" }));
    expect(screen.getByRole("status", { name: "Training completion" })).toHaveTextContent("Drill complete");
    expect(screen.getByRole("status", { name: "Training completion" })).toHaveTextContent("Saved on this device only. Not synced to an account.");
    expect(readSaved().activities).toHaveLength(2);
    expect(readSaved().activities[1]).toMatchObject({ kind: "workout", profile: "A", reference });
    expect(readSaved().activities[1]).not.toHaveProperty("points");
    const finishedButton = screen.getByRole("button", { name: "Mark Drill Complete" });
    expect(finishedButton).toBeDisabled();
    await user.click(finishedButton);
    expect(readSaved().activities).toHaveLength(2);
    view.unmount();

    render(<StrictMode>{detail()}</StrictMode>);
    expect(screen.getByRole("button", { name: "Mark Drill Complete" })).toBeDisabled();
    expect(readSaved().activities).toHaveLength(2);
    await user.selectOptions(screen.getByLabelText("Demo athlete profile"), "B");
    expect(screen.queryByRole("status", { name: "Training completion" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mark Drill Complete" })).toBeEnabled();
    expect(readSaved().activities.filter(activity => activity.profile === "A")).toHaveLength(2);
    expect(readSaved().activities.filter(activity => activity.profile === "B")).toMatchObject([{ kind: "lesson", reference: `started:${reference}` }]);
    await user.click(screen.getByRole("button", { name: "Mark Drill Complete" }));
    expect(readSaved().activities.filter(activity => activity.profile === "B" && activity.kind === "workout")).toHaveLength(1);
    await user.selectOptions(screen.getByLabelText("Demo athlete profile"), "A");
    expect(screen.getByRole("button", { name: "Mark Drill Complete" })).toBeDisabled();
    expect(readSaved().activities).toHaveLength(4);
  });

  it("keeps the action usable with blocked storage and truthfully reports memory-only completion", async () => {
    const user = userEvent.setup();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("storage blocked"); });
    render(detail());
    await user.click(screen.getByRole("button", { name: "Mark Drill Complete" }));
    expect(screen.getByRole("status", { name: "Training completion" })).toHaveTextContent("In memory only");
    expect(screen.getByRole("status", { name: "Training completion" })).not.toHaveTextContent("Saved on this device");
    expect(screen.getByRole("button", { name: "Mark Drill Complete" })).toBeDisabled();
    expect(localStorage.getItem("coach-tae-qblab-local-v1")).toBeNull();
  });

  it("optionally narrates the written steps, stops on request and cancels on profile, drill or unmount changes", async () => {
    class Utterance {
      lang = "";
      rate = 1;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(public text: string) {}
    }
    const cancel = vi.fn();
    const speak = vi.fn<(utterance: Utterance) => void>();
    vi.stubGlobal("speechSynthesis", { cancel, speak });
    vi.stubGlobal("SpeechSynthesisUtterance", Utterance);
    const user = userEvent.setup();
    const view = render(detail());
    await user.click(screen.getByRole("button", { name: "Listen to Instructions" }));
    expect(speak).toHaveBeenCalledTimes(1);
    const first = speak.mock.calls[0][0];
    expect(first.text).toContain(item.start);
    for (const step of item.steps) expect(first.text).toContain(step.body);
    expect(first.text).toContain(item.safety[0]);
    expect(first.lang).toBe("en-US");
    expect(screen.getByRole("button", { name: "Stop listening" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Stop listening" }));
    expect(cancel).toHaveBeenCalledTimes(2); // Clear earlier browser speech at start, then stop this narration.
    expect(speak).toHaveBeenCalledTimes(1);
    expect(first.onend).toBeNull(); // An old cancellation callback must not clear a later narration.
    expect(first.onerror).toBeNull();

    await user.click(screen.getByRole("button", { name: "Listen to Instructions" }));
    const beforeProfileChange = cancel.mock.calls.length;
    const priorProfileSpeech = speak.mock.calls[1][0];
    await user.selectOptions(screen.getByLabelText("Demo athlete profile"), "B");
    expect(cancel).toHaveBeenCalledTimes(beforeProfileChange + 1);
    expect(priorProfileSpeech.onend).toBeNull();
    expect(priorProfileSpeech.onerror).toBeNull();
    await user.click(screen.getByRole("button", { name: "Listen to Instructions" }));

    const beforeDrillChange = cancel.mock.calls.length;
    view.rerender(<LabShell><InstructionDetail item={nextItem} /></LabShell>);
    expect(cancel).toHaveBeenCalledTimes(beforeDrillChange + 1);
    await user.click(screen.getByRole("button", { name: "Listen to Instructions" }));
    const newDrillSpeech = speak.mock.calls.at(-1)![0];
    expect(newDrillSpeech.text).toContain(nextItem.title);
    expect(newDrillSpeech.text).toContain(nextItem.steps[0].body);
    act(() => newDrillSpeech.onend?.());
    expect(screen.getByRole("button", { name: "Listen to Instructions" })).toHaveAttribute("aria-pressed", "false");
    await user.click(screen.getByRole("button", { name: "Listen to Instructions" }));
    const beforeUnmount = cancel.mock.calls.length;
    const lastSpeech = speak.mock.calls.at(-1)![0];
    view.unmount();
    expect(cancel).toHaveBeenCalledTimes(beforeUnmount + 1);
    expect(lastSpeech.onend).toBeNull();
    expect(lastSpeech.onerror).toBeNull();
  });
});
