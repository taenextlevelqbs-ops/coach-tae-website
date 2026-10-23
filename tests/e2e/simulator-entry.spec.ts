import { test, expect } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";

test("simulator entrance offers three modes without technical controls or an orientation gate", async ({ page }) => {
  await page.goto("/qb-lab/simulator");
  await expect(page.getByRole("heading", { level: 1, name: "QB Simulator" })).toBeVisible();
  const modes = page.getByRole("region", { name: "Simulator modes" });
  await expect(modes.getByRole("link")).toHaveCount(3);
  await expect(page.getByRole("link", { name: "Try challenge preview" })).toHaveAttribute("href", "/qb-lab/simulator/engine?mode=challenge");
  await expect(page.getByLabel("Game environment")).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Simulator orientation" })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(result.violations).toEqual([]);
  await page.getByRole("link", { name: "Start learning" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Learn", exact: true })).toBeVisible();
  const advanced = page.getByText("Advanced Settings", { exact: true });
  await expect(advanced.locator("..")).not.toHaveAttribute("open");
  await expect(page.getByLabel("Your possible coverage")).toBeVisible();
  await expect(page.getByLabel("Game environment")).not.toBeVisible();
  await page.getByLabel("Your possible coverage").selectOption("Cannot confirm from alignment");
  await page.getByRole("button", { name: "Snap live rep" }).click();
  await page.getByRole("button", { name: "Step 0.2 seconds" }).click();
  await expect(page.getByText("0.20s", { exact: true })).toBeVisible();
});

test("mode links carry the choice and advanced settings are accessible by keyboard", async ({ page }) => {
  await page.goto("/qb-lab/simulator");
  await page.getByRole("link", { name: "Start practice" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Practice", exact: true })).toBeVisible();
  const advanced = page.getByText("Advanced Settings", { exact: true });
  await advanced.focus(); await advanced.press("Enter");
  await expect(page.getByLabel("Game environment")).toBeVisible();
  await expect(page.getByLabel("Learning mode")).toHaveValue("practice");
  await page.getByLabel("Game environment").selectOption("passing7");
  await expect(page.getByRole("status", { name: "Engine configuration issues" })).toContainText("Confirm the rules");
  await page.getByLabel(/I checked these values/).check();
  await expect(page.getByLabel("Assigned rush count")).toHaveValue("0");
  await expect(page.getByLabel("Assigned rush count")).toBeDisabled();
  await page.goto("/qb-lab/simulator/engine?mode=challenge");
  await expect(page.getByRole("heading", { level: 1, name: "Challenge preview", exact: true })).toBeVisible();
  await expect(page.getByText("Continuous practice preview. Scoring and a challenge curriculum are not implemented.")).toBeVisible();
});
