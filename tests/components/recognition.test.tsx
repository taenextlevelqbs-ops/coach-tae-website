import { expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LabShell } from "../../modules/qb-lab/LabShell";
import { RecognitionLab } from "../../modules/qb-lab/football/RecognitionLab";
it("requires an explicit flag ruleset and pre-snap observations before enabling the rep", async () => {
  const user = userEvent.setup();
  render(
    <LabShell>
      <RecognitionLab initialPreset="f5-one" />
    </LabShell>,
  );
  const snap = screen.getByRole("button", { name: "Snap recognition rep" });
  expect(snap).toBeDisabled();
  await user.selectOptions(screen.getByLabelText("Flag ruleset"), "nfl");
  await user.selectOptions(
    screen.getByLabelText("Identify personnel or structure"),
    "One rush / three underneath / one deep",
  );
  await user.selectOptions(
    screen.getByLabelText("Possible coverage prediction"),
    "Cannot confirm from alignment",
  );
  expect(snap).toBeEnabled();
  expect(
    screen.getByText("7-yard rush line · configured scale 2 units/yard"),
  ).toBeInTheDocument();
  await user.selectOptions(
    screen.getByLabelText("Recognition format"),
    "flag8",
  );
  expect(snap).toBeDisabled();
  expect(
    screen.queryByRole("option", { name: /NFL FLAG/ }),
  ).not.toBeInTheDocument();
});
