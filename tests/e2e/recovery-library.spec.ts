import { expect, test } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.route("**/*", (route) => new URL(route.request().url()).origin === "http://127.0.0.1:3150" ? route.continue() : route.abort());
});

test("recovery opens compact categories and an honest, usable shoulder exercise", async ({ page }) => {
  await page.goto("/qb-lab/recovery");
  await expect(page.getByRole("heading", { level: 1, name: "Recovery" })).toBeVisible();
  const exercises = page.getByRole("region", { name: "Recovery exercises", exact: true });
  await expect(exercises.getByRole("link")).toHaveCount(0);
  await page.getByRole("button", { name: "Shoulder & Upper Body", exact: true }).click();
  await expect(exercises.getByRole("link")).toHaveCount(4);
  await exercises.getByRole("link", { name: /Gentle Shoulder Mobility/ }).click();
  await expect(page).toHaveURL(/\/qb-lab\/recovery\/gentle-shoulder-mobility$/);
  await expect(page.getByRole("heading", { level: 1, name: "Gentle Shoulder Mobility" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Follow These Steps", exact: true })).toBeVisible();
  await expect(page.getByText("At your pace", { exact: true })).toBeVisible();
  await expect(page.getByText("Comfortable movement · dose pending review", { exact: true })).toBeVisible();
  await page.getByText("Before you begin", { exact: true }).click();
  const safety = page.locator("details.train-details");
  await expect(safety.getByText(/Stop for pain, pinching, tingling or dizziness/)).toBeVisible();
  await expect(safety.getByText(/DRAFT — Coach Tae and a qualified exercise professional/)).toBeVisible();
  await page.getByRole("button", { name: "Mark Exercise Complete", exact: true }).click();
  await expect(page.getByRole("status", { name: "Training completion", exact: true })).toContainText("Exercise complete");
  await expect(page.getByRole("status", { name: "Training completion", exact: true })).toContainText("Saved on this device only");
  await page.reload();
  await expect(page.getByRole("button", { name: "Mark Exercise Complete", exact: true })).toBeDisabled();
  await expect(page.locator("video")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
});

test("mobility and cooldown categories expose different exercises and unknown slugs fail safely", async ({ page }) => {
  await page.goto("/qb-lab/recovery");
  const exercises = page.getByRole("region", { name: "Recovery exercises", exact: true });
  await page.getByRole("button", { name: "Mobility & Flexibility", exact: true }).click();
  await expect(exercises.getByRole("link")).toHaveCount(4);
  await expect(exercises.getByRole("link", { name: /Controlled Trunk Mobility/ })).toBeVisible();
  await expect(exercises.getByRole("link", { name: /Gentle Shoulder Mobility/ })).toHaveCount(0);
  await page.getByRole("button", { name: "After-Training Cooldown", exact: true }).click();
  await expect(exercises.getByRole("link")).toHaveCount(2);
  await exercises.getByRole("link", { name: /Rest & Recovery Education/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Rest & Recovery Education" })).toBeVisible();
  await expect(page.getByText(/There is no physical exercise to perform/)).toBeVisible();
  const response = await page.goto("/qb-lab/recovery/not-a-real-exercise");
  expect(response?.status()).toBe(404);
});
