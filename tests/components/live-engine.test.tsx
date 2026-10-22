import { it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LabShell } from "../../modules/qb-lab/LabShell";
import { EngineLab } from "../../modules/qb-lab/live-engine/EngineLab";
it("requires an observation, locks declarations at snap and resets without recording invented activity", async () => {
  const user = userEvent.setup();
  render(
    <LabShell>
      <EngineLab />
    </LabShell>,
  );
  const lab = screen.getByRole("region", { name: "Live pocket engine" });
  const snap = within(lab).getByRole("button", { name: "Snap live rep" });
  expect(snap).toBeDisabled();
  await user.selectOptions(
    within(lab).getByLabelText("Your possible coverage"),
    "Cannot confirm from alignment",
  );
  expect(snap).toBeEnabled();
  await user.click(snap);
  expect(within(lab).getByLabelText("Game environment")).toBeDisabled();
  expect(
    within(lab).queryByRole("button", { name: "Record this completed rep" }),
  ).not.toBeInTheDocument();
  await user.click(
    within(lab).getByRole("button", { name: "Step 0.2 seconds" }),
  );
  expect(
    within(lab).getByText("0.20s", { selector: "strong" }),
  ).toBeInTheDocument();
  await user.click(within(lab).getByRole("button", { name: "Reset live rep" }));
  await user.selectOptions(
    within(lab).getByLabelText("Game environment"),
    "passing7",
  );
  expect(within(lab).getByLabelText("Assigned rush count")).toBeDisabled();
  expect(
    within(lab).queryByText("No physical protection in this format."),
  ).not.toBeInTheDocument();
  expect(
    within(lab).getByRole("status", { name: "Engine configuration issues" }),
  ).toHaveTextContent(/Confirm the rules/);
  expect(snap).not.toBeInTheDocument(); // unconfirmed rules do not create a playable engine state
});
