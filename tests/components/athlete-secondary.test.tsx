import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LabShell } from "@/modules/qb-lab/LabShell";
import { FilmReview } from "@/modules/qb-lab/FilmReview";
import { FootballIQ } from "@/modules/qb-lab/FootballIQ";

describe("simple secondary pages retain advanced functionality", () => {
  it("makes the film sample optional while preserving timestamp controls and the no-file boundary", async () => {
    const user = userEvent.setup();
    const { container } = render(<LabShell><FilmReview /></LabShell>);
    expect(screen.getByRole("heading", { name: "Film Room" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "A balanced reset" })).toBeVisible();
    expect(screen.getByRole("slider", { name: "Review timeline" })).not.toBeVisible();
    expect(container.querySelector('input[type="file"]')).toBeNull();
    await user.click(screen.getByText("Explore sample feedback", { exact: true }));
    await user.click(screen.getByRole("button", { name: /^Jump to 5 seconds:/ }));
    expect(screen.getByRole("slider", { name: "Review timeline" })).toHaveValue("5");
    await user.click(screen.getByRole("button", { name: "Compare moments" }));
    expect(screen.getByText("LATER MOMENT / +2 SECONDS", { exact: true })).toBeVisible();
    expect(container.querySelector('input[type="file"]')).toBeNull();
  });

  it("keeps advanced recognition out of the beginner entrance", async () => {
    const user = userEvent.setup();
    render(<LabShell><FootballIQ /></LabShell>);
    expect(screen.getByRole("heading", { name: "Football IQ" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Step illustration" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Defensive recognition workspace" })).not.toBeVisible();
    await user.click(screen.getByText("Advanced recognition lab", { exact: true }));
    expect(screen.getByRole("region", { name: "Defensive recognition workspace" })).toBeVisible();
  });

  it("opens an assigned recognition lesson directly without replacing its actual call", () => {
    render(<LabShell><FootballIQ initialRecognition="t425-c6" /></LabShell>);
    expect(screen.getByRole("region", { name: "Defensive recognition workspace" })).toBeVisible();
    expect(screen.getByLabelText("Defensive personnel", { exact: true })).toHaveValue("4-2-5");
    expect(screen.getByLabelText("Front / surface", { exact: true })).toHaveValue("Overload");
  });
});
