import { test, expect } from "./fixtures";

test("the sample session follows actual drill, recovery and recognition work without fake checkoffs", async ({ page }) => {
  await page.goto("/qb-lab");
  await expect(page.getByRole("link", { name: "Start Training", exact: true })).toHaveAttribute("href", "/qb-lab/workouts/three-step-drop-shuffle");
  await page.getByRole("link", { name: "Start Training", exact: true }).click();
  await page.getByRole("button", { name: "Mark Drill Complete", exact: true }).click();
  await page.getByRole("link", { name: "Next: Gentle Shoulder Mobility", exact: true }).click();
  await page.getByRole("button", { name: "Mark Exercise Complete", exact: true }).click();
  await page.goto("/qb-lab");
  await expect(page.getByRole("heading", { name: "Cover 3 Recognition", exact: true })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Sample session progress" })).toHaveAttribute("value", "2");
  await page.reload();
  await expect(page.getByRole("progressbar", { name: "Sample session progress" })).toHaveAttribute("value", "2");
  await page.getByRole("link", { name: "Start Training", exact: true }).click();
  await expect(page).toHaveURL(/lesson=t34-c3#recognition/);
  const lab = page.getByRole("region", { name: "Defensive recognition workspace" });
  await lab.getByLabel("Identify personnel or structure", { exact: true }).selectOption("3-4");
  await lab.getByLabel("Identify the front", { exact: true }).selectOption("Odd");
  await lab.getByLabel("Possible coverage prediction", { exact: true }).selectOption("Cannot confirm from alignment");
  await lab.getByRole("button", { name: "Snap recognition rep", exact: true }).click();
  await lab.getByRole("button", { name: "Pause recognition rep", exact: true }).click();
  await lab.getByRole("slider", { name: "Recognition timeline" }).fill("3");
  await lab.getByRole("button", { name: "Throw to X", exact: true }).click();
  await expect(lab.getByRole("status", { name: "Recognition feedback" })).toBeVisible();
  await page.goto("/qb-lab");
  await expect(page.getByRole("heading", { name: "Your sample session is complete.", exact: true })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Sample session progress" })).toHaveAttribute("value", "3");
  await page.getByRole("link", { name: "Review Training", exact: true }).click();
  await expect(page.getByText("Completed", { exact: true })).toHaveCount(3);
  await page.getByLabel("Demo athlete profile", { exact: true }).selectOption("B");
  await expect(page.getByText("Not Started", { exact: true })).toHaveCount(3);
  await expect(page.getByRole("link", { name: "Start Flag Defensive Recognition", exact: true })).toHaveAttribute("href", "/qb-lab/iq?lesson=f5-one#recognition");
});

test("notifications open by keyboard and explain the demo boundary", async ({ page }) => {
  await page.goto("/qb-lab");
  const notifications = page.getByLabel("Training notifications", { exact: true });
  await notifications.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("There are no live coaching messages", { exact: false })).toBeVisible();
  await page.getByRole("link", { name: "See your sample session →", exact: true }).click();
  await expect(page).toHaveURL(/\/qb-lab\/session$/);
});
