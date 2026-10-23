import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
/** These projects target port 3192: the REAL application with the production request guard. */
test.beforeEach(async ({ page }) => {
  await page.route("**/*", route => new URL(route.request().url()).origin === "http://127.0.0.1:3192" ? route.continue() : route.abort());
});
test("the coaching website opens the public introduction before any sign-in requirement", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByRole("button", { name: /^(Open|Close) site navigation$/ });
  if (await toggle.isVisible()) await toggle.click();
  await page.getByRole("link", { name: "QB LAB", exact: true }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/qb-lab\/welcome$/);
  await expect(page.getByRole("heading", { name: "Train Smarter. Play Faster.", exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Inside QB LAB" }).locator("article")).toHaveCount(4);
  await expect(page.getByRole("navigation", { name: "QB LAB navigation" })).toHaveCount(0);
  await expect(page.getByLabel("Demo athlete profile")).toHaveCount(0);
  await page.getByRole("main").getByRole("link", { name: "Get Started", exact: true }).click();
  await expect(page).toHaveURL(/\/qb-lab\/create-account$/);
  await expect(page.getByRole("heading", { name: "Registration is not open yet", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Parent or guardian", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Adult athlete", exact: true })).toBeVisible();
  await expect(page.locator("input,textarea")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Guardian registration unavailable", exact: true })).toBeDisabled();
  await page.getByRole("navigation", { name: "QB LAB public navigation" }).getByRole("link", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL(/\/qb-lab\/sign-in$/);
  await expect(page.getByRole("heading", { name: "Sign-in is not available yet", exact: true })).toBeVisible();
  await expect(page.locator("input,textarea")).toHaveCount(0);
});
test("the read-only sample neither reads an existing demo history nor records visitor progress", async ({ page }) => {
  const posts: string[] = [];
  page.on("request", request => { if (request.method() === "POST") posts.push(request.url()); });
  await page.addInitScript(() => {
    const protectedKeys = ["coach-tae-qblab-local-v1", "qb-lab-demo-selection-v1"];
    localStorage.setItem(protectedKeys[0], JSON.stringify({ sentinel: "existing synthetic history must remain untouched" }));
    sessionStorage.setItem(protectedKeys[1], JSON.stringify({ profile: "B", pathway: "flag" }));
    const calls: string[] = [];
    Object.defineProperty(window, "entryStorageCalls", { value: calls });
    for (const method of ["getItem", "setItem", "removeItem", "clear"] as const) {
      const original = Storage.prototype[method];
      Object.defineProperty(Storage.prototype, method, { configurable: true, value: function (...args: string[]) {
        if (method === "clear" || protectedKeys.includes(args[0])) calls.push(method);
        return Reflect.apply(original, this, args);
      } });
    }
  });
  await page.goto("/qb-lab/welcome");
  await page.getByRole("link", { name: "Explore a Sample Drill", exact: true }).click();
  await expect(page).toHaveURL(/\/qb-lab\/sample$/);
  await expect(page.getByRole("heading", { name: "Reset Your Feet", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Follow These Steps", exact: true })).toBeVisible();
  await expect(page.getByText(/No activity is recorded/)).toBeVisible();
  await expect(page.getByText(/Coach Tae’s approval is pending/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Complete|Start Training/ })).toHaveCount(0);
  await expect(page.locator("input,textarea,video")).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { entryStorageCalls: string[] }).entryStorageCalls)).toEqual([]);
  expect(posts).toEqual([]);
});
test("private HTML and RSC routes reject forged browser identities and preserve a safe sign-in destination", async ({ page, context, request }) => {
  await context.addCookies([{ name: "qb-stage-auth-v3", value: "forged", domain: "127.0.0.1", path: "/" }]);
  for (const path of ["/qb-lab", "/qb-lab/workouts", "/qb-lab/recovery/gentle-shoulder-mobility", "/qb-lab/playbook", "/qb-lab/progress", "/qb-lab/film", "/qb-lab/coach", "/qb-lab/access", "/qb-lab/simulator/engine?mode=learn"]) {
    for (const rsc of [false, true]) {
      const response = await request.get(path, { maxRedirects: 0, headers: { ...(rsc ? { RSC: "1", "Next-Router-Prefetch": "1" } : {}), "x-user-role": "coach" } });
      expect(response.status()).toBe(307);
      expect(new URL(response.headers().location, response.url()).pathname).toBe("/qb-lab/sign-in");
      expect(response.headers()["cache-control"]).toContain("no-store");
      expect(await response.text()).not.toContain("What's up, Alex!");
    }
  }
  await page.goto("/qb-lab?role=coach&authenticated=true");
  await expect(page).toHaveURL(/\/qb-lab\/sign-in\?next=/);
  await expect(page.getByRole("heading", { name: "Sign-in is not available yet", exact: true })).toBeVisible();
  const unavailable = await request.post("/api/qb-lab/account/login", { data: { email: "synthetic@example.test", password: "synthetic-only" } });
  expect(unavailable.status()).toBe(503);
});
for (const path of ["welcome", "sample", "sign-in", "create-account", "forbidden"]) {
  test(`public ${path} is accessible, monochrome and responsive without an account`, async ({ page }) => {
    await page.goto(`/qb-lab/${path}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(result.violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const color = await page.locator(".public-lab").evaluate(el => getComputedStyle(el).backgroundColor.match(/\d+/g)!.slice(0, 3).map(Number));
    expect(Math.max(...color)).toBeLessThan(55);
    expect(Math.max(...color) - Math.min(...color)).toBeLessThanOrEqual(3);
    await page.getByRole("link", { name: "Skip to QB LAB content", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
  });
}
test('synthetic coach messaging, guardian oversight and scheduled delivery work without private services', async ({ page }) => {
  const posts: string[] = [];
  page.on('request', req => { if (req.method() === 'POST') posts.push(req.url()); });
  await page.goto('/qb-lab/welcome/workflows');
  await page.getByRole('checkbox', { name: 'Schedule for tomorrow in the demo clock' }).check();
  await page.getByRole('button', { name: 'Send synthetic message' }).click();
  await page.getByLabel('Preview perspective').selectOption('guardian');
  await expect(page.getByText('No synthetic messages yet.', { exact: false })).toBeVisible();
  await page.getByText('Demonstration clock & audit trail', { exact: true }).click();
  await page.getByRole('button', { name: 'Advance demo clock one day' }).click();
  await expect(page.getByRole('button', { name: 'Mark read' })).toBeVisible();
  await page.getByRole('button', { name: 'Mark read' }).click();
  await expect(page.getByText('Read in demonstration', { exact: true })).toBeVisible();
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(result.violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(posts).toEqual([]);
  await page.reload();
  await expect(page.getByText('No synthetic messages yet.', { exact: false })).toBeVisible();
});
