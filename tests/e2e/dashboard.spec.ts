import { expect, test } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.route("**/*", (route) =>
    new URL(route.request().url()).origin === "http://127.0.0.1:3150"
      ? route.continue()
      : route.abort("blockedbyclient"),
  );
});

test("the exact simple home composition identifies a demo athlete and a clear next drill", async ({ page }) => {
  await page.goto("/qb-lab");
  await expect(page.getByRole("heading", { name: "What's up, Alex!", exact: true })).toBeVisible();
  await expect(page.getByText("Let's get some work in today.", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Today's Training", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "3-Step Drop + Shuffle", exact: true })).toBeVisible();
  await expect(page.getByText("Sample coaching note", { exact: true })).toBeVisible();
  const order = await page.locator(".athlete-dashboard").evaluate(el =>
    [...el.querySelectorAll("h1,h2")].map(node => node.textContent?.trim()));
  expect(order.indexOf("Today's Training")).toBeGreaterThan(order.indexOf("What's up, Alex!"));
  expect(order.indexOf("A Note From Coach Tae")).toBeGreaterThan(order.indexOf("Today's Training"));
  const nav = page.getByRole("navigation", { name: "QB LAB navigation" });
  await expect(nav.getByRole("link")).toHaveCount(4);
  await expect(nav.getByRole("link", { name: "Home", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.locator(".app-footer")).toContainText(/demo|synthetic/i);
  await expect(page.locator(".app-footer")).toContainText(/no real accounts|not a real account/i);
  await page.getByRole("link", { name: "Skip to QB LAB content" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
});

for (const route of ["profile", "session"]) {
  test(`${route} has an accessible useful destination`, async ({ page }) => {
    await page.goto(`/qb-lab/${route}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(result.violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("exactly four primary training cards lead to their working destinations", async ({ page }) => {
  await page.goto("/qb-lab");
  await expect(page.locator(".training-destination")).toHaveCount(4);
  for (const [title, route] of [
    ["Workouts", "workouts"],
    ["Recovery", "recovery"],
    ["QB Simulator", "simulator"],
    ["Film Room", "film"],
  ]) {
    await page.locator(".training-destination").filter({ hasText: title }).click();
    await expect(page).toHaveURL(new RegExp(`/qb-lab/${route}(\\?.*)?$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.getByRole("navigation", { name: "QB LAB navigation" }).getByRole("link", { name: "Home", exact: true }).click();
  }
});

test("Jordan's actual observation history stays isolated while Today offers a simple sample drill", async ({ page }) => {
  await page.goto("/qb-lab");
  await page.getByLabel("Demo athlete profile").selectOption("B");
  await page.goto("/qb-lab/iq");
  for (const answer of [
    "One deep defender",
    "No, confirm the assignments after the snap",
    "The defenders’ movement and developing throwing windows",
  ]) {
    await page.getByRole("radio", { name: answer, exact: true }).check();
    await page.getByRole("button", { name: /Explain my answer/ }).click();
    const next = page.getByRole("button", { name: /Next observation/ });
    if (await next.count()) await next.click();
  }
  await page.goto("/qb-lab/progress");
  await expect(page.getByText("observation-flag-revisit", { exact: true })).toBeVisible();
  await page.getByLabel("Demo athlete profile").selectOption("A");
  await expect(page.getByText("observation-flag-revisit", { exact: true })).toHaveCount(0);
  await page.goto("/qb-lab");
  await expect(page.getByRole("heading", { name: "What's up, Alex!", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start Training", exact: true })).toHaveAttribute("href", "/qb-lab/workouts/three-step-drop-shuffle");
  await page.getByLabel("Demo athlete profile").selectOption("B");
  await page.goto("/qb-lab/workouts?activity=observe&profile=B");
  await expect(page.getByText("GUIDED SESSION / LOCAL DEMO ATHLETE B", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Walk the starting picture", exact: true })).toBeVisible();
});

test("a compatible pending coach assignment takes priority over the sample Today drill", async ({ page }) => {
  await page.goto("/qb-lab/coach");
  await page.getByLabel("Assignment activity", { exact: true }).selectOption("footwork");
  await page.getByRole("button", { name: "Assign activity locally", exact: true }).click();
  await page.goto("/qb-lab");
  await expect(page.getByRole("heading", { name: "Slow setup walkthrough", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Start Training", exact: true }).click();
  await expect(page).toHaveURL(/activity=footwork&profile=A/);
  await expect(page.getByText("GUIDED SESSION / LOCAL DEMO ATHLETE A", { exact: true })).toBeVisible();
});

test("the actual athlete home stays monochrome and accessible on direct load and reload", async ({ page }) => {
  await page.goto("/qb-lab");
  for (const reload of [false, true]) {
    if (reload) await page.reload();
    for (const selector of [".qb-application", ".session-card", ".training-destination", ".app-navigation"]) {
      const channels = await page.locator(selector).first().evaluate(el =>
        getComputedStyle(el).backgroundColor.match(/\d+/g)!.slice(0, 3).map(Number));
      expect(Math.max(...channels)).toBeLessThan(55);
      expect(Math.max(...channels) - Math.min(...channels)).toBeLessThanOrEqual(3);
    }
    await expect(page.locator(".training-destination")).toHaveCount(4);
    const primary = page.getByRole("link", { name: "Start Training", exact: true });
    const channels = await primary.evaluate(el => getComputedStyle(el).backgroundColor.match(/\d+/g)!.slice(0, 3).map(Number));
    expect(Math.min(...channels)).toBeGreaterThan(220);
    expect(Math.max(...channels) - Math.min(...channels)).toBeLessThanOrEqual(3);
  }
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(result.violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
