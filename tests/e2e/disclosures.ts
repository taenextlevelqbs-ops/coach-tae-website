import { expect, type Page } from "@playwright/test";

/** Existing advanced workflows remain testable behind their deliberate beginner disclosures. */
export async function openDisclosure(page: Page, title: string) {
  const summary = page.getByText(title, { exact: true });
  await expect(summary).toBeVisible();
  const details = summary.locator("xpath=ancestor::details[1]");
  if ((await details.getAttribute("open")) === null) await summary.click();
  await expect(details).toHaveAttribute("open", "");
}
