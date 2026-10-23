import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.route("**/*", (r) => new URL(r.request().url()).origin === "http://127.0.0.1:3150" ? r.continue() : r.abort());
});

test("recognition walkthrough cannot complete an assigned defensive rep", async ({ page }) => {
  await page.goto("/qb-lab/coach");
  await page.getByLabel("Assignment activity", { exact: true }).selectOption("recognition");
  await page.getByLabel("Assigned recognition scenario", { exact: true }).selectOption("t425-c6");
  await page.getByRole("button", { name: "Assign activity locally", exact: true }).click();
  await page.goto("/qb-lab/workouts?activity=recognition&profile=A");
  await expect(page.getByRole("button", { name: "Complete activity", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Next step", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Start interactive recognition", exact: true })).toHaveAttribute("href", "/qb-lab/iq?lesson=t425-c6#recognition");
  await page.getByRole("link", { name: "Start interactive recognition", exact: true }).click();
  const lab = page.getByRole("region", { name: "Defensive recognition workspace" });
  await expect(lab.getByLabel("Defensive personnel", { exact: true })).toHaveValue("4-2-5");
  await expect(lab.getByLabel("Front / surface", { exact: true })).toHaveValue("Overload");
  await page.goto("/qb-lab/coach");
  await expect(page.getByText("Read personnel, front and coverage · assigned", { exact: true })).toBeVisible();
});

test("the selected pathway persists into the athlete home", async ({ page }) => {
  await page.goto("/qb-lab/iq");
  await page.getByLabel("Demo athlete profile").selectOption("A");
  await page.getByRole("radio", { name: "Flag", exact: true }).check();
  await expect(page.getByRole("region", { name: "Pre-snap adjustment lesson" }).getByText(/Three short decisions/)).toContainText("Flag pathway");
  await page.getByRole("navigation", { name: "QB LAB navigation" }).getByRole("link", { name: "Home", exact: true }).click();
  await expect(page.getByRole("heading", { name: "What's up, Alex!" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Your athlete home" })).toContainText("Flag football");
  await page.reload();
  await expect(page.getByRole("region", { name: "Your athlete home" })).toContainText("Flag football");
});
