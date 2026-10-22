import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const individual = "https://calendly.com/taenextlevelqbs/individual-training-clone";
const group = "https://calendly.com/taenextlevelqbs/group-training";
const shop = "https://dmvattack.myshopify.com/";
const sections = [
  ["Training", "training"],
  ["About Coach Tae", "about"],
  ["DMV Attack", "attack"],
  ["Foundation", "foundation"],
  ["Apparel", "apparel"],
] as const;

test.beforeEach(async ({ page }) => {
  // Regression tests never visit booking/commerce providers or submit forms.
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin === "http://127.0.0.1:3100") await route.continue();
    else await route.abort("blockedbyclient");
  });
});

test("homepage hydrates without failed application scripts or runtime errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (new URL(response.url()).pathname.startsWith("/_next/") && response.status() >= 400) {
      errors.push(`${response.status()} ${response.url()}`);
    }
  });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page).toHaveTitle("Coach Tae | QB Development");
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/TRAIN\.\s*DEVELOP\.\s*COMPETE\./);
  const button = page.getByRole("button", { name: /^(Open|Close) site navigation$/ });
  if (await button.isVisible()) {
    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
  }
  expect(errors).toEqual([]);
});

test("preserves all booking destinations, external link protection and training prices", async ({ page }) => {
  await page.goto("/");
  const booking = page.locator('a[href*="calendly.com"]');
  await expect(booking).toHaveCount(9);
  for (const link of await booking.all()) {
    expect([individual, group]).toContain(await link.getAttribute("href"));
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /\bnoopener\b/);
    await expect(link).toHaveAttribute("rel", /\bnoreferrer\b/);
  }
  await expect(page.locator("#training").getByText("$60", { exact: true })).toBeVisible();
  await expect(page.locator("#training").getByText("$85", { exact: true })).toBeVisible();
  await expect(page.locator("#training").getByText("$240", { exact: true })).toBeVisible();
  await expect(page.locator("#training").getByText("$80 per session", { exact: true })).toBeVisible();
  await expect(page.locator(`a[href="${individual}"]`).first()).toHaveAttribute("href", individual);
  await expect(page.locator(`a[href="${group}"]`).first()).toHaveAttribute("href", group);
  await expect(page.locator(`a[href="${shop}"]`)).toHaveCount(3);
  await expect(page.getByRole("link", { name: /DMV Attack 7v7/ })).toHaveAttribute("href", "https://dmvattack.com");
  const quickBooking = page.getByRole("navigation", { name: "Quick training booking" });
  if ((page.viewportSize()?.width ?? 1280) <= 980) {
    await expect(quickBooking).toBeVisible();
    await expect(quickBooking.getByRole("link", { name: /Book 1-on-1/ })).toHaveAttribute("href", individual);
    await expect(quickBooking.getByRole("link", { name: /Book a group/ })).toHaveAttribute("href", group);
  } else {
    await expect(quickBooking).toBeHidden();
  }
});

test("navigation reaches each existing section without hiding its start under the sticky header", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Primary navigation", exact: true });
  for (const [name, id] of sections) {
    const toggle = page.getByRole("button", { name: /^(Open|Close) site navigation$/ });
    if (await toggle.isVisible()) {
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await page.locator(`#mobile-site-navigation a[href="#${id}"]`).click();
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
    } else {
      await nav.getByRole("link", { name, exact: true }).click();
    }
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(page.locator(`#${id}`)).toBeInViewport();
    await expect.poll(async () => page.locator(`#${id}`).evaluate((element) => {
      const headerBottom = document.querySelector(".site-header")!.getBoundingClientRect().bottom;
      return element.getBoundingClientRect().top >= headerBottom - 1;
    })).toBe(true);
  }
});

test("keyboard skip link works and mobile disclosure closes with Escape and returns focus", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);
  const toggle = page.getByRole("button", { name: /^(Open|Close) site navigation$/ });
  if (await toggle.isVisible()) {
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Tab");
    await expect(page.locator("#mobile-site-navigation").getByRole("link").first()).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(toggle).toBeFocused();
    await expect(page.locator("#mobile-site-navigation")).toBeHidden();
  }
});

test("layout reflows and the hero image is delivered", async ({ page }) => {
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const hero = page.getByRole("img", { name: "Coach Tae quarterback group training" });
  await expect.poll(() => hero.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  const response = await page.request.get("/CTLOGO.jpeg");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/^image\/jpeg/);
});

test("navigation passes automated WCAG accessibility checks", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByRole("button", { name: /^(Open|Close) site navigation$/ });
  if (await toggle.isVisible()) {
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
  }
  const result = await new AxeBuilder({ page })
    .include(".site-header")
    .include(".mobile-booking-bar")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(result.violations).toEqual([]);
});

test("responses include baseline security headers without exposing framework branding", async ({ request }) => {
  const response = await request.get("/");
  expect(response.status()).toBe(200);
  const headers = response.headers();
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["content-security-policy"]).toBe("base-uri 'self'; object-src 'none'; frame-ancestors 'none'");
  expect(headers["permissions-policy"]).toBe("camera=(), microphone=(), geolocation=()");
  expect(headers["x-powered-by"]).toBeUndefined();
});

if (process.env.E2E_SERVER_MODE === "development") {
  test("development assets reject an untrusted origin while allowing the local browser", async ({ page, request }) => {
    await page.goto("/");
    const src = await page.locator('script[src*="/_next/static/"]').first().getAttribute("src");
    expect(src).toBeTruthy();
    const allowed = await request.get(src!, { headers: { Origin: "http://127.0.0.1:3100" } });
    expect(allowed.status()).toBe(200);
    const blocked = await request.get(src!, { headers: { Origin: "https://untrusted.invalid" } });
    expect(blocked.status()).toBe(403);
  });
}
