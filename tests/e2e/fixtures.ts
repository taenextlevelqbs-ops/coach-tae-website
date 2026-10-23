import { test as base, expect } from "@playwright/test";
/** Simulate physically rotating a phone/tablet when entering the landscape-only simulator. */
export const test = base.extend<{ simulatorOrientation: void }>({
  simulatorOrientation: [async ({ page }, use) => {
    const original = page.viewportSize();
    const rotate = async () => {
      if (!original || page.isClosed()) return;
      const sim = new URL(page.url()).pathname.startsWith("/qb-lab/simulator");
      const desired = sim && original.width <= 1100 && original.height > original.width ? { width: original.height, height: original.width } : original;
      const current = page.viewportSize();
      if (current?.width !== desired.width || current.height !== desired.height) await page.setViewportSize(desired);
    };
    const navigation = () => { void rotate().catch(() => {}); };
    page.on("framenavigated", navigation);
    await use();
    page.off("framenavigated", navigation);
  }, { auto: true }],
});
export { expect };
