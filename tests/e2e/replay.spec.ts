import { test, expect } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";

test("completed gameplay replays exact input movement at slow speed without editing or duplicating progress", async ({ page }) => {
  await page.goto("/qb-lab/simulator/engine");
  await page.getByLabel("Your possible coverage").selectOption("Cannot confirm from alignment");
  await page.getByRole("button", { name: "Snap live rep", exact: true }).click();
  await page.getByRole("button", { name: "Slide left", exact: true }).click();
  await page.getByRole("button", { name: "Step 0.2 seconds", exact: true }).click();
  const moved = await page.getByLabel("Live QB position").textContent();
  await page.getByRole("button", { name: "End rep: throw away", exact: true }).click();
  await page.getByRole("button", { name: "Record this completed rep", exact: true }).click();
  const result = await page.getByLabel("Live engine coaching").textContent();
  await page.getByLabel("Simulation playback speed").selectOption("0.25");
  await page.getByRole("button", { name: "Replay from snap", exact: true }).click();
  await expect(page.getByLabel("Live QB position")).not.toHaveText(moved!);
  await expect(page.getByLabel("Replay position")).toContainText("0.00s");
  await expect(page.getByRole("button", { name: "Pass to X", exact: true })).toBeDisabled();
  await page.getByRole("slider", { name: "Replay timeline", exact: true }).fill("12");
  await expect(page.getByLabel("Live QB position")).toHaveText(moved!);
  await page.getByRole("button", { name: "Replay from snap", exact: true }).click();
  await page.getByRole("button", { name: "Play replay", exact: true }).click();
  await expect(page.getByLabel("Replay position")).not.toContainText("0.00s");
  await page.getByRole("button", { name: "Pause replay", exact: true }).click();
  const paused = await page.getByLabel("Replay position").textContent();
  await page.waitForTimeout(200);
  await expect(page.getByLabel("Replay position")).toHaveText(paused!);
  await page.getByRole("button", { name: "Return to result", exact: true }).click();
  await expect(page.getByLabel("Live engine coaching")).toHaveText(result!);
  await expect(page.getByRole("button", { name: "Rep saved locally", exact: true })).toBeDisabled();
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto("/qb-lab/progress");
  await expect(page.getByText("live-tackle11-throw-away", { exact: true })).toHaveCount(1);
});

test("authored reference plays real recorded inputs without creating athlete history", async ({ page }) => {
  await page.goto("/qb-lab/simulator/engine");
  await page.getByLabel("Authored practice setup").selectOption("four-v-five");
  await page.getByRole("button", { name: "Inspect reference rep", exact: true }).click();
  await expect(page.getByLabel("Replay position")).toContainText("0.00s");
  const last = await page.getByRole("slider", { name: "Replay timeline", exact: true }).getAttribute("max");
  await page.getByRole("slider", { name: "Replay timeline", exact: true }).fill(last!);
  await expect(page.getByLabel("Live engine coaching")).toContainText("completion");
  await expect(page.getByLabel("Live engine coaching")).toContainText("not recorded as your training activity");
  await expect(page.getByRole("button", { name: "Record this completed rep", exact: true })).toHaveCount(0);
  await page.goto("/qb-lab/progress");
  await expect(page.getByText("No activity recorded.", { exact: false })).toBeVisible();
});
