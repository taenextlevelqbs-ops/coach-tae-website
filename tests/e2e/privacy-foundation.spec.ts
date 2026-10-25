import { openDisclosure } from "./disclosures";
import { test, expect } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
test("unconfigured account and video services stay disabled without accepting private data", async ({
  page,
  request,
}) => {
  await page.goto("/qb-lab/access");
  await expect(
    page.getByRole("heading", { name: "Private services are not connected" }),
  ).toBeVisible();
  await expect(
    page.locator("input[type=password],input[type=email],input[type=file]"),
  ).toHaveCount(0);
  for (const path of [
    "account/login",
    "account/progress",
    "account/signup",
    "account/checkout",
    "billing/webhook",
    "video/intents",
  ]) {
    const response = await request.post(`/api/qb-lab/${path}`, {
      data: { role: "coach", consent: true, visibility: "Public" },
    });
    expect(response.status()).toBe(503);
    expect(response.headers()["cache-control"]).toContain("no-store");
  }
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
test("illustrated Film Room supports keyboard canvas markers and timestamped notes", async ({
  page,
}) => {
  await page.goto("/qb-lab/film");
  await openDisclosure(page, "Explore sample feedback");
  await expect(
    page.getByRole("heading", { name: "Real uploads are locked" }),
  ).toBeVisible();
  await expect(page.locator("input[type=file]")).toHaveCount(0);
  await page
    .getByLabel("Timestamped coaching note")
    .fill("Synthetic coaching note: balanced base");
  await page.getByRole("button", { name: "Add note at 0.0s" }).click();
  await expect(
    page.getByRole("button", {
      name: "0.0s · Synthetic coaching note: balanced base",
    }),
  ).toBeVisible();
  const marker = page.getByRole("button", { name: /Place review marker/ });
  await marker.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(
    page.getByText("1 drawings · 1 notes", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pause and draw" }).click();
  const canvas = page.getByLabel(
    "Drawing overlay. Keyboard alternative below.",
  );
  await canvas.click({ position: { x: 30, y: 30 } });
  await expect(
    page.getByText("2 drawings · 1 notes", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Undo drawing" }).click();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
  await page.getByRole("button", { name: "Open Rotation study" }).click();
  await expect(
    page.getByText("0 drawings · 0 notes", { exact: true }),
  ).toBeVisible();
});
