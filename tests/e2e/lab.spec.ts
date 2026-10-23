import { expect, test } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";

test.beforeEach(async ({ page }) => {
  await page.route("**/*", (route) =>
    new URL(route.request().url()).origin === "http://127.0.0.1:3150"
      ? route.continue()
      : route.abort("blockedbyclient"),
  );
});
test("existing homepage, navigation, prices and booking links remain functional", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Coach Tae | QB Development");
  await expect(page.locator('a[href*="calendly.com"]')).toHaveCount(9);
  for (const link of await page.locator('a[href*="calendly.com"]').all()) {
    expect([
      "https://calendly.com/taenextlevelqbs/individual-training-clone",
      "https://calendly.com/taenextlevelqbs/group-training",
    ]).toContain(await link.getAttribute("href"));
    await expect(link).toHaveAttribute("rel", /noopener noreferrer/);
  }
  for (const price of ["$60", "$85", "$240"])
    await expect(
      page.locator("#training").getByText(price, { exact: true }),
    ).toBeVisible();
  const toggle = page.getByRole("button", {
    name: /^(Open|Close) site navigation$/,
  });
  for (const id of ["training", "about", "attack", "foundation", "apparel"]) {
    if (await toggle.isVisible()) {
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await page.locator(`#mobile-site-navigation a[href="#${id}"]`).click();
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
    } else await page.locator(`.desktop-nav-links a[href="#${id}"]`).click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(page.locator(`#${id}`)).toBeInViewport();
  }
  if (await toggle.isVisible()) await toggle.click();
  await page
    .getByRole("link", { name: "QB LAB", exact: true })
    .filter({ visible: true })
    .click();
  await expect(page).toHaveURL(/\/qb-lab$/);
});
for (const route of ["", "/athlete", "/iq", "/film", "/family"]) {
  test(`${route || "/landing"} is reachable and reflows without runtime errors`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`/qb-lab${route}`);
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByText("INTERACTIVE DEMO", { exact: true }),
    ).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
    expect(errors).toEqual([]);
  });
}
test("athlete context and actual demo task state update and reset", async ({
  page,
}) => {
  await page.goto("/qb-lab/athlete");
  await page.getByRole("radio", { name: "Flag", exact: true }).check();
  for (const age of ["8–10", "11–13", "14–15", "16–18", "College"]) {
    await page.getByLabel("Age group", { exact: true }).selectOption(age);
    await expect(
      page.getByText(`Flag · ${age} · Getting started`, { exact: true }),
    ).toBeVisible();
  }
  await page.getByLabel("Experience", { exact: true }).selectOption("Advanced");
  await page
    .getByRole("checkbox", { name: /Observe a starting alignment/ })
    .check();
  await expect(page.getByRole("status").first()).toHaveText(
    "1 of 3 demo tasks checked",
  );
  await page.getByRole("button", { name: "Reset checklist" }).click();
  await expect(
    page.getByText("0 of 3 demo tasks checked", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("0 of 3 demo tasks checked", { exact: true }),
  ).toBeVisible();
});
test("field study provides explanations and keyboard timeline controls, not skill predictions", async ({
  page,
}) => {
  await page.goto("/qb-lab/iq");
  await expect(
    page.getByRole("button", { name: /Explain my answer/ }),
  ).toBeDisabled();
  const slider = page.getByRole("slider", { name: "Illustration timeline" });
  await slider.focus();
  await page.keyboard.press("End");
  await expect(slider).toHaveValue("100");
  await page.getByRole("button", { name: "Start over" }).click();
  for (const answer of [
    "Two deep defenders",
    "No, confirm the assignments after the snap",
    "The defenders’ movement and developing throwing windows",
  ]) {
    await page.getByRole("radio", { name: answer, exact: true }).check();
    await page.getByRole("button", { name: /Explain my answer/ }).click();
    await expect(
      page.getByText("That matches this observation.", { exact: true }),
    ).toBeVisible();
    const next = page.getByRole("button", { name: /Next observation/ });
    if (await next.count()) await next.click();
  }
  await expect(
    page.getByText(/This is not a football IQ rating/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Repeat field study" }).click();
  await expect(
    page.getByRole("button", { name: /Explain my answer/ }),
  ).toBeDisabled();
});
test("film submission is synthetic, dialog is keyboard accessible and timestamp controls work", async ({
  page,
}) => {
  const posts: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") posts.push(r.url());
  });
  await page.goto("/qb-lab/film");
  const open = page.getByRole("button", { name: /Prepare a demo submission/ });
  await open.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(open).toBeFocused();
  await open.click();
  await page
    .getByLabel("Demo clip", { exact: true })
    .selectOption("Rotation study");
  await page.getByRole("checkbox", { name: /I understand/ }).check();
  await page.getByRole("button", { name: /Queue synthetic review/ }).click();
  await expect(
    page.getByRole("status", { name: "Review submission status" }),
  ).toContainText("Demo review queued: Rotation study");
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await page.getByRole("button", { name: /Jump to 5 seconds/ }).click();
  await expect(
    page.getByRole("slider", { name: "Review timeline" }),
  ).toHaveValue("5");
  await page.getByRole("button", { name: "+0.1s", exact: true }).click();
  await expect(
    page.getByRole("slider", { name: "Review timeline" }),
  ).toHaveValue("5.1");
  await page
    .getByRole("button", { name: "Compare moments", exact: true })
    .click();
  await expect(
    page.getByText("LATER MOMENT / +2 SECONDS", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Hide annotation", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Show annotation", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  expect(posts).toEqual([]);
});
test("family preferences stay separate and exported data contains only fixed demo profiles", async ({
  page,
}) => {
  await page.goto("/qb-lab/family");
  await page.getByRole("button", { name: /Demo athlete B/ }).click();
  await expect(
    page.getByRole("checkbox", { name: /Session reminders/ }),
  ).not.toBeChecked();
  await page.getByRole("checkbox", { name: /Session reminders/ }).check();
  await page.getByRole("button", { name: /Demo athlete A/ }).click();
  await expect(
    page.getByRole("checkbox", { name: /Session reminders/ }),
  ).toBeChecked();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export demo settings →", exact: true })
    .click();
  const download = await downloadPromise;
  const data = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(data.demonstration).toBe(true);
  expect(data.profiles.map((p: { id: string }) => p.id)).toEqual(["A", "B"]);
  await page.getByRole("button", { name: "Reset preferences" }).click();
  await page.getByRole("button", { name: /Demo athlete B/ }).click();
  await expect(
    page.getByRole("checkbox", { name: /Session reminders/ }),
  ).not.toBeChecked();
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});
for (const route of ["", "/athlete", "/iq", "/film", "/family"]) {
  test(`${route || "/landing"} passes automated WCAG checks and has a keyboard skip link`, async ({
    page,
  }) => {
    await page.goto(`/qb-lab${route}`);
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("link", { name: "Skip to QB LAB content" }),
    ).toBeFocused();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}

test("review desk keyboard tagging, chapter seeking and study changes are local", async ({
  page,
}) => {
  await page.goto("/qb-lab/film");
  await page
    .getByRole("button", { name: "Seek chapter 2 at 5 seconds" })
    .click();
  await page
    .getByLabel("Observation tag", { exact: true })
    .selectOption("Rotation");
  const add = page.getByRole("button", { name: "Tag current moment" });
  await add.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("status", { name: "Moment tag status" }),
  ).toContainText("Tagged 5.0 seconds: Rotation");
  await add.click();
  await expect(
    page.getByRole("status", { name: "Moment tag status" }),
  ).toContainText("already has that tag");
  await page.getByRole("button", { name: "+0.1s", exact: true }).click();
  await page
    .getByRole("button", { name: "Revisit tagged 5.0 seconds: Rotation" })
    .click();
  await expect(page.getByRole("slider")).toHaveValue("5");
  await page.getByRole("button", { name: /Track D2/ }).click();
  await expect(page.getByRole("button", { name: /Track D2/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: /Inspect space/ }).click();
  await expect(
    page.getByText(/not a prescribed receiver progression/),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Remove Rotation at 5.0 seconds" })
    .click();
  await expect(
    page.getByRole("button", { name: /Revisit tagged/ }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Open Rotation study" }).click();
  await expect(page.getByRole("slider")).toHaveValue("5");
  await page.getByRole("button", { name: "Open Alignment study" }).click();
  await expect(page.getByRole("slider")).toHaveValue("0");
  await expect(page.locator("input[type=file],textarea")).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});

test("approved dashboard has the exact composition, six destinations and persistent navigation", async ({
  page,
}) => {
  await page.goto("/qb-lab");
  await expect(
    page.getByRole("heading", { name: "Good afternoon, Jordan." }),
  ).toBeVisible();
  await expect(page.getByText("Your QB Lab", { exact: false })).toContainText(
    "Flag football · Age 12",
  );
  await expect(
    page.getByRole("heading", { name: "Let's work on reading Cover 2." }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Your training" }).getByRole("link"),
  ).toHaveCount(6);
  await expect(
    page.getByRole("heading", { name: "A note from Coach Tae" }),
  ).toBeVisible();
  const nav = page.getByRole("navigation", { name: "QB LAB navigation" });
  for (const name of ["Home", "Train", "Plays", "Profile"])
    await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Start training" }).click();
  await expect(page).toHaveURL(/\/session$/);
  await expect(page.getByText(/does not confirm Cover 2/)).toBeVisible();
  await page.getByRole("link", { name: "Open Football IQ →" }).click();
  await expect(page).toHaveURL(/\/iq$/);
  await nav.getByRole("link", { name: "Home", exact: true }).click();
  await page.getByLabel("Demo athlete profile").selectOption("A");
  await expect(
    page.getByRole("heading", { name: "Good afternoon, Alex." }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Good afternoon, Alex." }),
  ).toBeVisible();
  await nav.getByRole("link", { name: "Profile", exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole("link", { name: "Family Hub →" })).toBeVisible();
});

test("IQ feedback connects to the athlete home and a matching guided workout", async ({
  page,
}) => {
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
  await page.getByRole("link", { name: "See my next step →" }).click();
  await expect(
    page.getByRole("heading", { name: "Walk the starting picture" }),
  ).toBeVisible();
  await expect(
    page.getByText(/An observation needs another look/),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("link", { name: "Start training" }).click();
  await expect(page).toHaveURL(/activity=observe&profile=A/);
  await expect(
    page.getByRole("heading", {
      name: "Walk the starting picture",
      exact: true,
    }),
  ).toBeVisible();
});
