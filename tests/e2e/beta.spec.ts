import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test.beforeEach(async ({ page }) => {
  await page.route("**/*", route => new URL(route.request().url()).origin === "http://127.0.0.1:3150" ? route.continue() : route.abort());
});
test("simulator requires landscape, pauses when rotated, and leaves the home portrait-friendly", async ({ page }) => {
  await page.setViewportSize({ width:390,height:844 });
  await page.goto("/qb-lab/simulator/engine");
  await expect(page.getByRole("heading",{name:"Turn your device sideways."})).toBeVisible();
  await expect(page.getByRole("region",{name:"Live pocket engine"})).toBeHidden();
  const portraitAxe = await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
  expect(portraitAxe.violations).toEqual([]);
  await page.setViewportSize({width:844,height:390});
  const lab = page.getByRole("region",{name:"Live pocket engine"});
  await expect(lab).toBeVisible();
  await expect(lab.getByRole("img",{name:/Live engine field/})).toHaveAttribute("viewBox","0 0 1120 360");
  await lab.getByLabel("Learning mode").selectOption("practice");
  await lab.getByLabel("Your possible coverage").selectOption("Cannot confirm from alignment");
  await lab.getByRole("button",{name:"Snap live rep"}).click();
  await expect(lab.locator(".engine-scoreboard strong")).not.toHaveText("0.00s");
  await expect(lab.locator(".engine-targets")).toHaveCSS("position","fixed");
  await expect(lab.getByRole("button",{name:"Pass to X",exact:true})).toBeVisible();
  await page.setViewportSize({width:390,height:844});
  await expect(page.getByRole("heading",{name:"Turn your device sideways."})).toBeVisible();
  await page.setViewportSize({width:844,height:390});
  await expect(lab.getByRole("button",{name:"Play live rep",exact:true})).toBeVisible();
  await page.setViewportSize({width:390,height:844});
  await page.getByRole("link",{name:"Back to your Lab"}).click();
  await expect(page.getByRole("heading",{name:/Good afternoon, /})).toBeVisible();
  await expect(page.getByRole("region",{name:"Simulator orientation"})).toHaveCount(0);
});
test("line settings drive a server estimate and throws expose bounded synthetic estimates", async ({page}) => {
  await page.setViewportSize({width:1024,height:768});
  await page.goto("/qb-lab/simulator/engine");
  const lab=page.getByRole("region",{name:"Live pocket engine"});
  await lab.getByLabel("Synthetic line matchup").selectOption("offense-edge");
  await lab.getByLabel("Blitz tempo modifier").selectOption("0.12");
  await lab.getByRole("button",{name:"Estimate pocket window"}).click();
  await expect(lab.getByText(/Standard tackle example: .* estimated pocket window/)).toBeVisible();
  await lab.getByLabel("Your possible coverage").selectOption("Cannot confirm from alignment");
  await lab.getByRole("button",{name:"Snap live rep"}).click();
  await lab.getByText("Synthetic throw estimates",{exact:true}).click();
  await expect(lab.getByText(/X: \d+% model completion estimate/)).toBeVisible();
  await lab.getByRole("button",{name:"Step 0.2 seconds"}).click();
  await expect(lab.getByLabel("Live QB position")).toContainText("advisory, not a sack clock");
  const axe=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21aa"]).analyze();
  expect(axe.violations).toEqual([]);
});
test("a saved studio play launches exactly and unknown IDs never silently launch another formation", async ({page}) => {
  await page.goto("/qb-lab/playbook");
  await page.getByLabel("Play name",{exact:true}).fill("Beta pocket concept");
  await page.getByRole("button",{name:"Save play locally"}).click();
  await page.setViewportSize({width:1024,height:768});
  await page.getByRole("link",{name:"Run Beta pocket concept in live engine"}).click();
  await expect(page).toHaveURL(/engine\?play=/);
  await expect(page.getByLabel("Formation / saved play")).toHaveValue(/.+/);
  await expect(page.getByLabel("Formation / saved play").locator("option:checked")).toHaveText("Beta pocket concept");
  await page.reload();
  await expect(page.getByLabel("Formation / saved play").locator("option:checked")).toHaveText("Beta pocket concept");
  await page.goto("/qb-lab/simulator/engine?play=missing-fixture");
  await expect(page.getByRole("heading",{name:"Saved play unavailable"})).toBeVisible();
  await expect(page.getByRole("button",{name:"Snap live rep"})).toHaveCount(0);
});
test("PWA controls the exact home route, serves offline guidance and excludes private responses from caching", async ({page,context}) => {
  const manifest = await page.request.get("/qb-lab/manifest.webmanifest");
  const data = await manifest.json(); expect(data.start_url).toBe("/qb-lab"); expect(data.orientation).toBeUndefined();
  await page.goto("/qb-lab");
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  const privacy = await page.request.post("/api/qb-lab/private/athletes",{data:{}}); expect(privacy.status()).toBe(503);
  await context.setOffline(true);
  await page.goto("/qb-lab/film");
  await expect(page.getByRole("heading",{name:"Keep your eyes up."})).toBeVisible();
  await expect(page.locator("html")).toHaveCSS("background-color","rgb(11, 18, 32)");
  const cached=await page.evaluate(async () => (await Promise.all((await caches.keys()).map(async key => (await (await caches.open(key)).keys()).map(r => new URL(r.url).pathname)))).flat());
  expect(cached).toContain("/qb-lab/offline.html");
  expect(cached.some(p => p.startsWith("/api/") || ["/qb-lab","/qb-lab/film"].includes(p))).toBe(false);
  await context.setOffline(false);
  await page.goto("/");
  expect(await page.evaluate(() => navigator.serviceWorker.controller)).toBeNull();
});

test("reviewed pre-snap decisions appear only in the selected demo athlete's progress", async ({page}) => {
  await page.goto("/qb-lab/iq");
  await page.getByLabel("Demo athlete profile").selectOption("A");
  const lesson=page.getByRole("region",{name:"Pre-snap adjustment lesson"});
  for (let i=0;i<3;i++) {
    await lesson.getByRole("radio").nth(1).check();
    await lesson.getByRole("button",{name:"Check adjustment"}).click();
    if (i<2) await lesson.getByRole("button",{name:"Next adjustment"}).click();
  }
  await expect(lesson.getByText(/Completed locally: 3 of 3/)).toBeVisible();
  await lesson.getByRole("link",{name:"View actual activity →"}).click();
  await expect(page.getByText("3/3 correct in pre-snap review · actual local lesson answers")).toBeVisible();
  await page.getByLabel("Demo athlete profile").selectOption("B");
  await expect(page.getByText("3/3 correct in pre-snap review · actual local lesson answers")).toHaveCount(0);
});
