import { it, expect } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LabShell } from "../../modules/qb-lab/LabShell";
import { CoachWorkspace } from "../../modules/qb-lab/coach/CoachWorkspace";
it("supports keyboard tabs, real depth placement and independent per-athlete planning values", async () => {
  const user = userEvent.setup();
  render(
    <LabShell>
      <CoachWorkspace />
    </LabShell>,
  );
  const tabs = screen.getByRole("tablist", {
    name: "Coach workspace sections",
  });
  await user.click(within(tabs).getByRole("tab", { name: "Roster" }));
  await user.selectOptions(screen.getByLabelText("QB depth 1"), "A");
  await user.selectOptions(screen.getByLabelText("X depth 2"), "A");
  expect(screen.getByLabelText("QB depth 1")).toHaveValue("");
  expect(screen.getByLabelText("X depth 2")).toHaveValue("A");
  const focus = screen.getByRole("slider", {
    name: "Footwork emphasis for Alex",
  });
  fireEvent.change(focus, { target: { value: "5" } });
  expect(focus).toHaveValue("5");
  await user.click(screen.getByRole("button", { name: "Select Jordan" }));
  expect(
    screen.getByRole("slider", { name: "Footwork emphasis for Jordan" }),
  ).toHaveValue("3");
  await user.click(within(tabs).getByRole("tab", { name: "Roster" }));
  await user.keyboard("{ArrowRight}");
  expect(within(tabs).getByRole("tab", { name: "Playbook" })).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "Parse script" }));
  expect(
    screen.getByRole("status", { name: "Script parser result" }),
  ).toHaveTextContent("Script parsed");
  expect(
    screen.queryByRole("link", { name: /Run .* in simulator/ }),
  ).not.toBeInTheDocument();
});

it("rejects external or mismatched private media paths before rendering a video element", async () => {
  const { ProtectedVideoPlayer, validMediaPaths } = await import(
    "../../modules/qb-lab/coach/ProtectedVideoPlayer"
  );
  expect(
    validMediaPaths(
      "/api/qb-lab/video/demo/playback",
      "/api/qb-lab/video/demo/captions",
    ),
  ).toBe(true);
  expect(
    validMediaPaths(
      "/api/qb-lab/video/demo/playback",
      "/api/qb-lab/video/other/captions",
    ),
  ).toBe(false);
  const { container } = render(
    <ProtectedVideoPlayer
      playbackPath="https://example.com/athlete.mp4"
      captionsPath="https://example.com/cc.vtt"
    />,
  );
  expect(container.querySelector("video")).toBeNull();
  expect(
    screen.getByText("No authorized media endpoint was provided."),
  ).toBeInTheDocument();
});
