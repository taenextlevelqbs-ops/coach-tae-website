import { test, expect } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
test("saved hash geometry reaches the engine and exposes configurable split responsibilities and a real countdown", async ({
  page,
}) => {
  await page.goto("/qb-lab/playbook");
  await page.getByLabel("Playbook ball hash").selectOption("left");
  await page.getByLabel("Playbook strong side").selectOption("left");
  await page.getByLabel("Boundary break depth").selectOption("0.85");
  await page.getByRole("button", { name: "Select C", exact: true }).click();
  await expect(page.getByText(/Selected C: x 17.78 yd/)).toBeVisible();
  await page.getByLabel("Player X",{exact:true}).fill("48");
  await expect(page.getByText(/hash-tagged play requires the center/)).toBeVisible();
  await page.getByLabel("Player X",{exact:true}).fill("50");
  await page
    .getByLabel("Play name", { exact: true })
    .fill("Synthetic left-hash study");
  await page.getByRole("button", { name: "Save play locally", exact: true }).click();
  await page.goto("/qb-lab/simulator/engine");
  await page
    .getByLabel("Formation / saved play")
    .selectOption({ label: "Synthetic left-hash study" });
  await expect(page.getByLabel("Engine ball hash")).toHaveValue("left");
  await page
    .getByRole("combobox", { name: "Front alignment", exact: true })
    .selectOption("Over");
  await page
    .getByText("Teaching setup: actual post-snap responsibilities", {
      exact: true,
    })
    .click();
  await page.getByLabel("Defensive coverage call").selectOption("Cover 8");
  await page.getByLabel("Vertical match trigger").selectOption("12");
  await page.getByLabel("High-school pocket teaching preset").check();
  await page.getByLabel("Starting safety shell").selectOption("2");
  await page.getByLabel("Your possible coverage").selectOption("Cannot confirm from alignment");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
  await page
    .getByRole("button", { name: /Snap/, exact: false })
    .first()
    .click();
  await expect(
    page.getByRole("status", { name: "Teaching pocket countdown" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Step/, exact: false })
    .first()
    .click();
  await expect(
    page.getByRole("status", { name: "Teaching pocket countdown" }),
  ).toContainText("Teaching pocket:");
});
