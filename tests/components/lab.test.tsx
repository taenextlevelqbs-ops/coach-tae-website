import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LabShell } from "../../modules/qb-lab/LabShell";
import { Athlete } from "../../modules/qb-lab/Athlete";
import { FootballIQ } from "../../modules/qb-lab/FootballIQ";
import { Family } from "../../modules/qb-lab/Family";
import { Field } from "../../modules/qb-lab/Field";
import { FilmReview } from "../../modules/qb-lab/FilmReview";

describe("QB LAB interactive components", () => {
  it("keeps tackle and flag rosters distinct and exposes a descriptive diagram", () => {
    const { container, rerender } = render(<Field pathway="tackle" />);
    expect(container.querySelectorAll("circle")).toHaveLength(22);
    expect(screen.getByRole("img")).toHaveAccessibleName(
      /Eleven players per side/,
    );
    rerender(<Field pathway="flag" />);
    expect(container.querySelectorAll("circle")).toHaveLength(10);
    expect(screen.getByRole("img")).toHaveAccessibleName(
      /Five players per side/,
    );
  });
  it("changes learning context without inventing activity and resets real demo interactions", async () => {
    const user = userEvent.setup();
    render(
      <LabShell>
        <Athlete />
      </LabShell>,
    );
    await user.click(screen.getByRole("radio", { name: "Flag" }));
    await user.selectOptions(screen.getByLabelText("Age group"), "College");
    await user.selectOptions(screen.getByLabelText("Experience"), "Advanced");
    expect(screen.getByText("Flag · College · Advanced")).toBeInTheDocument();
    expect(screen.getByText("0 of 3 demo tasks checked")).toBeInTheDocument();
    await user.click(
      screen.getByRole("checkbox", { name: /Observe a starting alignment/ }),
    );
    expect(screen.getByText("1 of 3 demo tasks checked")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reset checklist" }));
    expect(screen.getByText("0 of 3 demo tasks checked")).toBeInTheDocument();
  });
  it("requires a choice and explains an incorrect observation without claiming a skill score", async () => {
    const user = userEvent.setup();
    render(
      <LabShell>
        <FootballIQ />
      </LabShell>,
    );
    expect(
      screen.getByRole("button", { name: /Explain my answer/ }),
    ).toBeDisabled();
    await user.click(screen.getByRole("radio", { name: "One deep defender" }));
    await user.click(screen.getByRole("button", { name: /Explain my answer/ }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Let’s look more closely.",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Two defenders are drawn",
    );
    await user.click(screen.getByRole("button", { name: /Next observation/ }));
    expect(
      screen.getByText(/Does a two-high pre-snap picture/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Explain my answer/ }),
    ).toBeDisabled();
  });
  it("steps and resets the illustration through controls without requiring animation", async () => {
    const user = userEvent.setup();
    render(
      <LabShell>
        <FootballIQ />
      </LabShell>,
    );
    await user.click(screen.getByRole("button", { name: "Step illustration" }));
    expect(
      screen.getByRole("slider", { name: "Illustration timeline" }),
    ).toHaveValue("25");
    fireEvent.change(screen.getByRole("slider"), { target: { value: "100" } });
    expect(screen.getByText("ILLUSTRATED ROTATION")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Start over" }));
    expect(screen.getByRole("slider")).toHaveValue("0");
  });
  it("jumps to feedback timestamps and compares moments without accepting files", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <LabShell>
        <FilmReview />
      </LabShell>,
    );
    await user.click(screen.getByRole("button", { name: /Jump to 5 seconds/ }));
    expect(screen.getByRole("slider", { name: "Review timeline" })).toHaveValue(
      "5",
    );
    await user.click(screen.getByRole("button", { name: "+0.1s" }));
    expect(screen.getByRole("slider")).toHaveValue("5.1");
    await user.click(screen.getByRole("button", { name: "Compare moments" }));
    expect(screen.getByText("LATER MOMENT / +2 SECONDS")).toBeInTheDocument();
    expect(container.querySelector('input[type="file"]')).toBeNull();
  });
  it("isolates each synthetic profile’s preferences and restores defaults", async () => {
    const user = userEvent.setup();
    render(
      <LabShell>
        <Family />
      </LabShell>,
    );
    expect(
      screen.getByRole("checkbox", { name: /Session reminders/ }),
    ).toBeChecked();
    await user.click(
      screen.getByRole("checkbox", { name: /Session reminders/ }),
    );
    await user.click(screen.getByRole("button", { name: /Demo athlete B/ }));
    expect(
      screen.getByRole("checkbox", { name: /Session reminders/ }),
    ).not.toBeChecked();
    await user.click(
      screen.getByRole("checkbox", { name: /Session reminders/ }),
    );
    await user.click(screen.getByRole("button", { name: /Demo athlete A/ }));
    expect(
      screen.getByRole("checkbox", { name: /Session reminders/ }),
    ).not.toBeChecked();
    await user.click(screen.getByRole("button", { name: "Reset preferences" }));
    expect(
      screen.getByRole("checkbox", { name: /Session reminders/ }),
    ).toBeChecked();
    expect(screen.getByRole("status")).toHaveTextContent(
      "reset for both sample profiles",
    );
  });
});
