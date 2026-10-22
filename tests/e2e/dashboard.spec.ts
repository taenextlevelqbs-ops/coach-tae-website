import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test.beforeEach(async ({ page }) => {
  await page.route("**/*", (route) =>
    new URL(route.request().url()).origin === "http://127.0.0.1:3150"
      ? route.continue()
      : route.abort("blockedbyclient"),
  );
});
test("the complete approved home composition fits the first viewport", async ({
  page,
}) => {
  await page.goto("/qb-lab");
  await expect(
    page.getByRole("heading", { name: "Good afternoon, Jordan." }),
  ).toBeVisible();
  await expect(
    page.getByText("Sample assignment", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Sample coaching note", { exact: true }),
  ).toBeVisible();
  const note = await page.locator(".coach-note-card").boundingBox();
  const nav = await page
    .getByRole("navigation", { name: "QB LAB navigation" })
    .boundingBox();
  const viewport = page.viewportSize()!;
  expect(note).not.toBeNull();
  const visibleBottom = viewport.width <= 600 ? nav!.y : viewport.height;
  expect(note!.y + note!.height).toBeLessThanOrEqual(visibleBottom);
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
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
test("all six training cards lead to the working tools", async ({ page }) => {
  await page.goto("/qb-lab");
  for (const [title, route] of [
    ["Football IQ", "iq"],
    ["Workouts", "workouts"],
    ["Film Room", "film"],
    ["Playbook", "playbook"],
    ["QB Simulator", "simulator"],
    ["Progress", "progress"],
  ]) {
    await page
      .getByRole("region", { name: "Your training" })
      .getByRole("link", { name: new RegExp(`^${title} `) })
      .click();
    await expect(page).toHaveURL(new RegExp(`/qb-lab/${route}(\\?.*)?$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page
      .getByRole("navigation", { name: "QB LAB navigation" })
      .getByRole("link", { name: "Home", exact: true })
      .click();
  }
});

test("Jordan's completed observation changes only Jordan's next session", async ({
  page,
}) => {
  await page.goto("/qb-lab");
  await page
    .getByRole("region", { name: "Your training" })
    .getByRole("link", { name: /^Football IQ / })
    .click();
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
  await page.getByRole("link", { name: "See my next step →" }).click();
  await expect(
    page.getByRole("heading", { name: "Walk the starting picture" }),
  ).toBeVisible();
  await page.getByLabel("Demo athlete profile").selectOption("A");
  await expect(
    page.getByRole("heading", { name: "Let's work on reading Cover 2." }),
  ).toBeVisible();
  await page.getByLabel("Demo athlete profile").selectOption("B");
  await page.getByRole("link", { name: "Start training" }).click();
  await expect(page).toHaveURL(/activity=observe&profile=B/);
  await expect(
    page.getByText("GUIDED SESSION / LOCAL DEMO ATHLETE B", { exact: true }),
  ).toBeVisible();
});
