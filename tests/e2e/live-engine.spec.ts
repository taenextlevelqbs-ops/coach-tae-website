import { test, expect } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
test.beforeEach(async ({ page }) => {
  await page.route("**/*", (r) =>
    new URL(r.request().url()).origin === "http://127.0.0.1:3150"
      ? r.continue()
      : r.abort(),
  );
});
test("live pocket is playable by step, keyboard and touch, preserves declarations and records a completed event once", async ({
  page,
}) => {
  await page.goto("/qb-lab/simulator");
  await page.getByRole("link", { name: "Enter live pocket" }).click();
  const lab = page.getByRole("region", { name: "Live pocket engine" });
  await expect(
    lab.getByRole("button", { name: "Snap live rep" }),
  ).toBeDisabled();
  await lab
    .getByLabel("Your possible coverage")
    .selectOption("Cannot confirm from alignment");
  await lab.getByLabel("Assigned rush count").fill("6");
  await lab.getByRole("combobox", { name: "Protection help", exact: true }).selectOption("RB");
  await lab.getByRole("button", { name: "Snap live rep" }).click();
  await expect(
    lab.getByText(/Snap: 11 offense, 11 defense, 6 assigned rushers/),
  ).toBeVisible();
  await expect(
    lab.getByLabel("Pass protection", { exact: true }),
  ).toBeDisabled();
  const field = lab.getByRole("group", { name: /Live engine field controls/ });
  const before = await lab.getByLabel("Live QB position").textContent();
  await field.focus();
  await field.press("ArrowLeft");
  await expect(lab.getByLabel("Live QB position")).not.toHaveText(before!);
  await lab.getByRole("button", { name: "Climb pocket", exact: true }).click();
  for (let i = 0; i < 8; i++)
    await lab.getByRole("button", { name: "Step 0.2 seconds" }).click();
  await expect(
    lab.getByRole("img", { name: /Live engine field/ }),
  ).toBeVisible();
  await lab.getByRole("button", { name: "Enlarge field", exact: true }).click();
  const dimensions = await field.evaluate((el) => ({
    height: el.clientHeight,
    total: el.scrollHeight,
    top: el.scrollTop,
    window: innerHeight,
  }));
  expect(dimensions.height).toBeLessThanOrEqual(
    Math.ceil(dimensions.window * 0.65),
  );
  expect(dimensions.total).toBeGreaterThan(dimensions.height);
  expect(dimensions.top).toBeGreaterThan(0);
  await lab
    .getByRole("button", { name: "Field overview", exact: true })
    .click();
  await lab.getByRole("button", { name: "End rep: throw away" }).click();
  await expect(
    lab.getByRole("status", { name: "Live engine coaching" }),
  ).toContainText("throw-away");
  await lab.getByRole("button", { name: "Record this completed rep" }).click();
  await expect(
    lab.getByRole("button", { name: "Rep saved locally" }),
  ).toBeDisabled();
  await page.goto("/qb-lab/progress");
  await expect(
    page.getByText("live-tackle11-throw-away", { exact: true }),
  ).toHaveCount(1);
});
test("passing 7v7 has an explicit event clock, no physical rush and a real in-flight decision", async ({
  page,
}) => {
  await page.goto("/qb-lab/simulator/engine");
  const lab = page.getByRole("region", { name: "Live pocket engine" });
  await lab.getByLabel("Game environment").selectOption("passing7");
  await expect(lab.getByLabel("Assigned rush count")).toHaveValue("0");
  await expect(lab.getByLabel("Assigned rush count")).toBeDisabled();
  await lab.getByLabel("Event pass clock (seconds)").fill("6");
  await lab.getByLabel(/I checked these values/).check();
  await lab
    .getByLabel("Your possible coverage")
    .selectOption("Cannot confirm from alignment");
  await lab.getByRole("button", { name: "Snap live rep" }).click();
  for (let i = 0; i < 5; i++)
    await lab.getByRole("button", { name: "Step 0.2 seconds" }).click();
  await lab.getByRole("button", { name: "Pass to X", exact: true }).click();
  await expect(lab.getByText(/Ball in flight/)).toBeVisible();
  for (let i = 0; i < 10; i++) {
    if (
      await lab.getByRole("button", { name: "Step 0.2 seconds" }).isDisabled()
    )
      break;
    await lab.getByRole("button", { name: "Step 0.2 seconds" }).click();
  }
  await expect(
    lab.getByRole("status", { name: "Live engine coaching" }),
  ).toContainText("Time to throw");
  await expect(
    lab.getByRole("status", { name: "Live engine coaching" }),
  ).not.toContainText("sack");
});
test("flag rules stay separate and the live workspace reflows accessibly", async ({
  page,
}) => {
  await page.goto("/qb-lab/simulator/engine");
  const lab = page.getByRole("region", { name: "Live pocket engine" });
  await lab.getByLabel("Game environment").selectOption("flag8");
  await expect(
    lab.getByRole("status", { name: "Engine configuration issues" }),
  ).toContainText("Confirm the rules");
  await lab.getByLabel("Designated rush distance (yards)").fill("9");
  await lab.getByLabel("Rush delay (seconds)").fill("2");
  await lab.getByLabel(/I checked these values/).check();
  await expect(
    lab.getByText("9-yard rush line", { exact: true }),
  ).toBeVisible();
  await expect(
    lab.getByText("8 offense / 8 defense", { exact: true }),
  ).toBeVisible();
  await lab.getByLabel("Game environment").selectOption("passing7");
  await expect(
    lab.getByRole("status", { name: "Engine configuration issues" }),
  ).toBeVisible();
  await lab.getByLabel(/I checked these values/).check();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(result.violations).toEqual([]);
});

test("server-rendered controls stay disabled until the interactive engine is ready", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.route("**/*", (r) =>
    new URL(r.request().url()).origin === "http://127.0.0.1:3150"
      ? r.continue()
      : r.abort(),
  );
  await page.goto("http://127.0.0.1:3150/qb-lab/simulator/engine");
  const lab = page.getByRole("region", { name: "Live pocket engine" });
  await expect(lab.getByLabel("Game environment")).toBeDisabled();
  await expect(
    lab.getByRole("button", { name: "Snap live rep" }),
  ).toBeDisabled();
  await expect(
    lab.getByRole("status", { name: "Engine readiness" }),
  ).toContainText("JavaScript is required");
  await context.close();
});
