import { expect, test } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.route("**/*", route =>
    new URL(route.request().url()).origin === "http://127.0.0.1:3150"
      ? route.continue()
      : route.abort(),
  );
});

test("Film Room starts simply and retains file-free sample review behind a clear action", async ({ page }) => {
  const posts: string[] = [];
  page.on("request", request => { if (request.method() === "POST") posts.push(request.url()); });
  await page.goto("/qb-lab/film");
  await expect(page.getByRole("heading", { name: "Film Room", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "A balanced reset", exact: true })).toBeVisible();
  await expect(page.getByText("No private film or coach feedback yet.", { exact: false })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Private upload gate" })).toContainText("Real uploads are locked");
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: /upload/i })).toHaveCount(0);
  const sample = page.locator("details").filter({ has: page.locator("summary", { hasText: "Explore sample feedback" }) }).first();
  await expect(sample).not.toHaveAttribute("open");
  const open = page.getByText("Explore sample feedback", { exact: true });
  await open.focus();
  await page.keyboard.press("Enter");
  await expect(sample).toHaveAttribute("open", "");
  await page.getByRole("button", { name: /^Jump to 5 seconds:/ }).click();
  await expect(page.getByRole("slider", { name: "Review timeline" })).toHaveValue("5");
  await page.getByLabel("Playback speed", { exact: true }).selectOption("0.5");
  await page.getByRole("button", { name: "Compare moments", exact: true }).click();
  await expect(page.getByText("LATER MOMENT / +2 SECONDS", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Prepare a demo submission/ }).click();
  await page.getByRole("checkbox", { name: /I understand/ }).check();
  await page.getByRole("button", { name: /Queue synthetic review/ }).click();
  await expect(page.getByRole("status", { name: "Review submission status" })).toContainText("No file was uploaded");
  expect(posts).toEqual([]);
});

test("Profile selects fixed demonstration athletes and preserves deeper training tools", async ({ page }) => {
  await page.goto("/qb-lab/profile");
  await page.getByLabel("Choose a demo athlete", { exact: true }).selectOption("B");
  await expect(page.getByRole("heading", { name: "Jordan", exact: true })).toBeVisible();
  await expect(page.getByLabel("Demo athlete profile", { exact: true })).toHaveValue("B");
  for (const name of ["Progress Center →", "Workouts →", "Recovery →", "Film Room →", "QB Simulator →", "Family Hub →"])
    await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
  await page.getByText("More training tools", { exact: true }).click();
  for (const name of ["Football IQ →", "Playbook Studio →", "2D mechanics trainer →", "Coach demonstration →", "Account and privacy status →"])
    await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Install QB LAB" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("Football IQ keeps beginner study visible and opens assigned or anchored advanced lessons", async ({ page }) => {
  await page.goto("/qb-lab/iq");
  await expect(page.getByRole("heading", { name: "Football IQ", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Read the picture", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Step illustration", exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Defensive recognition workspace" })).toBeHidden();
  await page.goto("/qb-lab/iq?lesson=t425-c6");
  await expect(page.getByRole("region", { name: "Defensive recognition workspace" })).toBeVisible();
  await expect(page.getByLabel("Defensive personnel", { exact: true })).toHaveValue("4-2-5");
  await page.goto("/qb-lab/iq#recognition");
  await expect(page.getByRole("region", { name: "Defensive recognition workspace" })).toBeVisible();
});

for (const route of ["profile", "film", "progress", "iq"]) {
  test(`${route} remains accessible and fits the athlete application`, async ({ page }) => {
    await page.goto(`/qb-lab/${route}`);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
