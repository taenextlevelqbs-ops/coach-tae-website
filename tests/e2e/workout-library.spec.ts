import { test, expect } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";

test("workouts reveal a compact category and a readable drill without a video", async ({ page }) => {
  await page.goto("/qb-lab/workouts");
  await expect(page.getByRole("heading", { name: "Workouts", exact: true })).toBeVisible();
  const categories = page.getByLabel("Workout categories");
  await expect(categories.getByRole("button")).toHaveCount(4);
  const list = page.getByRole("region", { name: "Workout drills" });
  await expect(list.getByRole("link")).toHaveCount(0);
  await categories.getByRole("button", { name: /^Footwork/ }).click();
  await expect(list.getByRole("link")).toHaveCount(8);
  await list.getByRole("link", { name: /3-Step Drop \+ Shuffle/ }).click();
  await expect(page).toHaveURL(/\/qb-lab\/workouts\/three-step-drop-shuffle$/);
  await expect(page.getByRole("heading", { name: "3-Step Drop + Shuffle", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Follow These Steps", exact: true })).toBeVisible();
  await expect(page.getByText("Draft · coaching review pending", { exact: true })).toBeVisible();
  await expect(page.getByRole("img", { name: "3-Step Drop + Shuffle movement diagram", exact: true })).toBeVisible();
  await expect(page.locator("video")).toHaveCount(0);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations).toEqual([]);
  await expect(page.getByRole("button", { name: "Mark Drill Complete", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Mark Drill Complete", exact: true }).click();
  await expect(page.getByRole("status", { name: "Training completion" })).toContainText("Drill complete");
  await expect(page.getByRole("status", { name: "Training completion" })).toContainText("Saved on this device only");
  await page.reload();
  await expect(page.getByRole("status", { name: "Training completion" })).toContainText("Drill complete");
  await expect(page.getByRole("button", { name: "Mark Drill Complete", exact: true })).toBeDisabled();
  const count = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("coach-tae-qblab-local-v1")!);
    return state.activities.filter((activity: { kind: string; reference: string }) => activity.kind === "workout" && activity.reference === "workout:three-step-drop-shuffle").length;
  });
  expect(count).toBe(1);
  const dimensions = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, screen: innerWidth }));
  expect(dimensions.page).toBeLessThanOrEqual(dimensions.screen);
});

test("legacy assigned-workout links still open the guided activity while unknown drill slugs fail closed", async ({ page }) => {
  await page.goto("/qb-lab/workouts?activity=footwork");
  await expect(page.getByRole("heading", { name: "Give the rep a purpose.", exact: true })).toBeVisible();
  await expect(page.getByLabel("Workout categories")).toHaveCount(0);
  const response = await page.goto("/qb-lab/workouts/not-a-real-drill");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("button", { name: "Mark Drill Complete", exact: true })).toHaveCount(0);
});
