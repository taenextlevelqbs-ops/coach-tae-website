import { test, expect } from "./fixtures";
import type { Play } from "../../modules/qb-lab/simulation/model";

test("duplicate preserves exact routes and alignment without overwriting the source play", async ({ page }) => {
  await page.goto("/qb-lab/playbook");
  await page.getByLabel("Play format", { exact: true }).selectOption("flag5");
  await page.getByLabel("Play name", { exact: true }).fill("Integrity copy source");
  await page.getByLabel("Selected player", { exact: true }).selectOption("R1");
  await page.getByLabel("Player X", { exact: true }).fill("25");
  await page.getByRole("button", { name: "Straight path", exact: true }).click();
  await page.getByLabel("Route point 1 Y", { exact: true }).fill("36");
  await page.getByRole("button", { name: "Save play locally", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Play saved to this browser");
  await page.getByRole("button", { name: "Duplicate play", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("The source play is unchanged");

  const plays = await page.evaluate(() => JSON.parse(localStorage.getItem("coach-tae-qblab-local-v1")!).plays as Play[]);
  const source = plays.find((p) => p.name === "Integrity copy source")!;
  const copy = plays.find((p) => p.name === "Integrity copy source (copy)")!;
  expect(copy.id).not.toBe(source.id);
  expect(copy.players).toEqual(source.players);

  await page.getByLabel("Player X", { exact: true }).fill("31");
  await page.getByLabel("Route point 1 X", { exact: true }).fill("40");
  await page.getByRole("button", { name: "Save play locally", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "Integrity copy source · flag5", exact: true }).click();
  await page.getByLabel("Selected player", { exact: true }).selectOption("R1");
  await expect(page.getByLabel("Player X", { exact: true })).toHaveValue("25");
  await expect(page.getByLabel("Route point 1 X", { exact: true })).toHaveValue("25");
  await expect(page.getByLabel("Route point 1 Y", { exact: true })).toHaveValue("36");
  await page.getByRole("button", { name: "Integrity copy source (copy) · flag5", exact: true }).click();
  await page.getByLabel("Selected player", { exact: true }).selectOption("R1");
  await expect(page.getByLabel("Player X", { exact: true })).toHaveValue("31");
  await expect(page.getByLabel("Route point 1 X", { exact: true })).toHaveValue("40");

  await page.getByRole("link", { name: "Run Integrity copy source in live engine", exact: true }).click();
  await expect(page.getByLabel("Formation / saved play")).toHaveValue(source.id);
});

test("invalid line alignment remains an editable draft and cannot be snapped", async ({ page }) => {
  await page.goto("/qb-lab/playbook");
  await page.getByLabel("Play name", { exact: true }).fill("Offside draft");
  await page.getByLabel("Selected player", { exact: true }).selectOption("R5");
  await page.getByLabel("Player Y", { exact: true }).fill("66");
  await expect(page.getByText(/Offensive players cannot start beyond the line/)).toBeVisible();
  await page.getByRole("button", { name: "Save play locally", exact: true }).click();
  await page.getByRole("link", { name: "Run Offside draft in live engine", exact: true }).click();
  await expect(page.getByText(/Offensive players cannot start beyond the line/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Snap live rep", exact: true })).toHaveCount(0);
});
