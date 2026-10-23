import { expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LabShell } from "@/modules/qb-lab/LabShell";
import { SimulatorHome } from "@/modules/qb-lab/training/SimulatorHome";
import { EngineLab } from "@/modules/qb-lab/live-engine/EngineLab";
import { formation } from "@/modules/qb-lab/simulation/model";
import { resetLab, updateLab } from "@/modules/qb-lab/platform/store";

it("offers three honest simulator modes and keeps the existing training tools reachable", () => {
  render(<LabShell><SimulatorHome /></LabShell>);
  const modes = screen.getByRole("region", { name: "Simulator modes" });
  expect(within(modes).getAllByRole("link")).toHaveLength(3);
  expect(screen.getByRole("link", { name: "Start learning" })).toHaveAttribute("href", "/qb-lab/simulator/engine?mode=learn");
  expect(screen.getByRole("link", { name: "Start practice" })).toHaveAttribute("href", "/qb-lab/simulator/engine?mode=practice");
  expect(screen.getByRole("link", { name: "Try challenge preview" })).toHaveAttribute("href", "/qb-lab/simulator/engine?mode=challenge");
  expect(within(modes).getByText(/Scored challenges and a difficulty curriculum are not available/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Recognition & spacing tools" })).toHaveAttribute("href", "/qb-lab/simulator/spacing");
  expect(screen.getByRole("link", { name: "Study Football IQ" })).toHaveAttribute("href", "/qb-lab/iq");
});

it("keeps the observation visible, honors the selected mode and opens technical settings only on request", async () => {
  const user = userEvent.setup();
  render(<LabShell><EngineLab initialMode="practice" /></LabShell>);
  expect(screen.getByRole("heading", { level: 1, name: "Practice" })).toBeInTheDocument();
  expect(screen.getByLabelText("Your possible coverage")).toBeVisible();
  expect(screen.getByRole("button", { name: "Snap live rep" })).toBeDisabled();
  const summary = screen.getByText("Advanced Settings", { exact: true });
  expect(summary.parentElement).not.toHaveAttribute("open");
  expect(screen.getByLabelText("Game environment")).not.toBeVisible();
  await user.click(summary);
  expect(summary.parentElement).toHaveAttribute("open");
  expect(screen.getByLabelText("Game environment")).toBeVisible();
  expect(screen.getByLabelText("Learning mode")).toHaveValue("practice");
});

it("returning from an example restores the exact saved formation or starter instead of retaining a different play", async () => {
  const user = userEvent.setup();
  const saved = formation("tackle");
  saved.id = "restorable-play"; saved.name = "My saved hash play";
  saved.tactics = { hash: "left", strongSide: "left", boundaryBreakScale: 1 };
  saved.players.find(p => p.label === "X")!.label = "Split";
  for (const initialPlay of [undefined, saved]) {
    updateLab(s => ({ ...s, plays: initialPlay ? [initialPlay] : [] }));
    const view = render(<LabShell><EngineLab initialPlayId={initialPlay?.id} initialMode="practice" /></LabShell>);
    try {
      const field = screen.getByRole("img", { name: /Live engine field/ });
      const originalField = field.innerHTML;
      const select = screen.getByLabelText("Authored practice setup");
      await user.selectOptions(select, "cover-three-stretch");
      expect(screen.getByText(/Current play: Three-level right-side distribution/)).toBeInTheDocument();
      expect(field.innerHTML).not.toBe(originalField);
      await user.selectOptions(select, "");
      expect(field.innerHTML).toBe(originalField);
      expect(screen.getByRole("heading", { level: 1, name: "Practice" })).toBeInTheDocument();
      expect(screen.getByLabelText("Your possible coverage")).toHaveValue("");
      expect(screen.queryByText(/Current play: Three-level right-side distribution/)).not.toBeInTheDocument();
      if (initialPlay) expect(screen.getByText(/Current play: My saved hash play/)).toBeInTheDocument();
    } finally { view.unmount(); resetLab(); }
  }
});

it("hydrates the actual instructional field without changing SVG title text", async () => {
  const { renderToString } = await import("react-dom/server");
  const { hydrateRoot } = await import("react-dom/client");
  const { act } = await import("react");
  const { EngineField } = await import("@/modules/qb-lab/live-engine/EngineField");
  const { createEngine } = await import("@/modules/qb-lab/live-engine/engine");
  const { defaultConfig } = await import("@/modules/qb-lab/live-engine/defaults");
  const state = createEngine(defaultConfig());
  const container = document.createElement("div");
  container.innerHTML = renderToString(<EngineField state={state} />);
  document.body.append(container);
  const errors: unknown[] = [];
  let root: ReturnType<typeof hydrateRoot> | undefined;
  try {
    await act(async () => { root = hydrateRoot(container, <EngineField state={state} />, { onRecoverableError: error => errors.push(error) }); });
    expect(errors).toEqual([]);
    expect([...container.querySelectorAll("title")].some(title => title.textContent?.startsWith("Mike:"))).toBe(true);
  } finally { await act(async () => root?.unmount()); container.remove(); }
});
