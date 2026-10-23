import { expect, test } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
test.beforeEach(async ({ page }) => {
  await page.route("**/*", (r) =>
    new URL(r.request().url()).origin === "http://127.0.0.1:3150"
      ? r.continue()
      : r.abort(),
  );
});
test("tackle personnel and coverage remain independent and a completed rep records actual activity", async ({
  page,
}) => {
  await page.goto("/qb-lab/simulator");
  const lab = page.getByRole("region", {
    name: "Defensive recognition workspace",
  });
  await lab.getByRole("button", { name: "Magnify field", exact: true }).click();
  const viewport = lab.getByRole("group", {
    name: "Football field viewport. Scroll horizontally when magnified.",
    exact: true,
  });
  expect(await viewport.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
    true,
  );
  const pan = await viewport.evaluate((el) => el.scrollLeft);
  await viewport.focus();
  await viewport.press("ArrowRight");
  await expect
    .poll(() => viewport.evaluate((el) => el.scrollLeft))
    .toBeGreaterThan(pan);
  await lab
    .getByRole("button", { name: "Show full field", exact: true })
    .click();
  await lab
    .getByLabel("Learning depth", { exact: true })
    .selectOption("College · scheme discussion");
  await lab
    .getByLabel("Defensive personnel", { exact: true })
    .selectOption("3-4");
  await lab.getByLabel("Front / surface", { exact: true }).selectOption("Bear");
  await lab
    .getByText("Coach setup: post-snap coverage and pressure call", {
      exact: true,
    })
    .click();
  await lab
    .getByLabel("Called coverage", { exact: true })
    .selectOption("Cover 6");
  await lab.getByLabel("Assigned rushers", { exact: true }).fill("3");
  await expect(
    lab.getByRole("button", { name: "Snap recognition rep", exact: true }),
  ).toBeDisabled();
  await lab
    .getByLabel("Identify personnel or structure", { exact: true })
    .selectOption("3-4");
  await lab
    .getByLabel("Identify the front", { exact: true })
    .selectOption("Bear");
  await lab
    .getByLabel("Possible coverage prediction", { exact: true })
    .selectOption("Cannot confirm from alignment");
  await expect(
    lab.getByRole("button", { name: "Snap recognition rep", exact: true }),
  ).toBeDisabled();
  await lab
    .getByLabel("Post-snap conflict key", { exact: true })
    .selectOption("D5");
  await lab
    .getByRole("button", { name: "Snap recognition rep", exact: true })
    .click();
  await lab
    .getByRole("button", { name: "Pause recognition rep", exact: true })
    .click();
  await lab.getByRole("slider", { name: "Recognition timeline" }).fill("3");
  await lab.getByRole("button", { name: "Throw to X", exact: true }).click();
  await expect(
    lab.getByRole("status", { name: "Recognition feedback" }),
  ).toContainText("3-4 personnel, bear look, Cover 6. 3 assigned rushers");
  await expect(
    lab.getByRole("button", { name: "Throw to X", exact: true }),
  ).toBeDisabled();
  await page.goto("/qb-lab/progress");
  await expect(
    page.getByText("recognition-tackle-3-4-Bear-Cover-6", { exact: true }),
  ).toBeVisible();
});
test("flag rules gate the snap, show the seven-yard line, and keep larger formats separate", async ({
  page,
}) => {
  await page.goto("/qb-lab/iq");
  const lab = page.getByRole("region", {
    name: "Defensive recognition workspace",
  });
  await lab.getByLabel("Recognition format").selectOption("flag5");
  await expect(
    lab.getByRole("button", { name: "Snap recognition rep", exact: true }),
  ).toBeDisabled();
  await lab.getByLabel("Flag ruleset", { exact: true }).selectOption("nfl");
  await expect(
    lab.getByText("7-yard rush line · configured scale 2 units/yard", {
      exact: true,
    }),
  ).toBeVisible();
  await lab
    .getByLabel("Identify personnel or structure")
    .selectOption("One rush / three underneath / one deep");
  await lab
    .getByLabel("Possible coverage prediction")
    .selectOption("Underneath zones with deep help");
  await lab
    .getByRole("button", { name: "Snap recognition rep", exact: true })
    .click();
  await lab
    .getByRole("button", { name: "Pause recognition rep", exact: true })
    .click();
  await lab
    .getByRole("button", { name: "Recognition QB forward", exact: true })
    .click();
  await expect(lab.getByText(/Direct QB running is disabled/)).toBeVisible();
  await lab
    .getByRole("button", { name: "Reset recognition rep", exact: true })
    .click();
  await lab.getByLabel("Recognition format").selectOption("flag8");
  await expect(
    lab
      .getByLabel("Flag ruleset", { exact: true })
      .getByRole("option", { name: /NFL FLAG/ }),
  ).toHaveCount(0);
  await lab.getByLabel("Flag ruleset", { exact: true }).selectOption("custom");
  await lab
    .getByText("I checked these teaching values", { exact: false })
    .click();
  await lab
    .getByLabel("Identify personnel or structure")
    .selectOption("Three rush / two middle / three deep");
  await lab
    .getByLabel("Possible coverage prediction")
    .selectOption("Pressure with deep help");
  await expect(
    lab.getByRole("button", { name: "Snap recognition rep", exact: true }),
  ).toBeEnabled();
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(result.violations).toEqual([]);
});
test("custom labels and 8v8 saved formations are shared with the recognition workspace", async ({
  page,
}) => {
  await page.goto("/qb-lab/playbook");
  await page.getByLabel("Play format", { exact: true }).selectOption("flag8");
  await page
    .getByLabel("Play name", { exact: true })
    .fill("Eight-player study");
  await page.getByLabel("Selected player", { exact: true }).selectOption("R1");
  await page.getByLabel("Custom system label", { exact: true }).fill("Alpha");
  await page
    .getByRole("button", { name: "Save play locally", exact: true })
    .click();
  await page.goto("/qb-lab/iq");
  const lab = page.getByRole("region", {
    name: "Defensive recognition workspace",
  });
  await lab.getByLabel("Recognition format").selectOption("flag8");
  await lab
    .getByLabel("Recognition playbook formation")
    .selectOption({ label: "Eight-player study" });
  await expect(
    lab.getByRole("button", { name: "Throw to Alpha", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("a coach-assigned shared scenario opens the exact call and completes only its matching assignment", async ({
  page,
}) => {
  await page.goto("/qb-lab/coach");
  await page
    .getByLabel("Assignment activity", { exact: true })
    .selectOption("recognition");
  await page
    .getByLabel("Assigned recognition scenario", { exact: true })
    .selectOption("t425-c6");
  await page
    .getByRole("button", { name: "Assign activity locally", exact: true })
    .click();
  await page.goto("/qb-lab/athlete");
  await page
    .getByRole("link", { name: "Open activity library →", exact: true })
    .click();
  await expect(page).toHaveURL(/lesson=t425-c6/);
  const lab = page.getByRole("region", {
    name: "Defensive recognition workspace",
  });
  await expect(
    lab.getByLabel("Defensive personnel", { exact: true }),
  ).toHaveValue("4-2-5");
  await expect(lab.getByLabel("Front / surface", { exact: true })).toHaveValue(
    "Overload",
  );
  await lab.getByLabel("Identify personnel or structure").selectOption("4-2-5");
  await lab.getByLabel("Identify the front").selectOption("Overload");
  await lab
    .getByLabel("Possible coverage prediction")
    .selectOption("Cannot confirm from alignment");
  await lab
    .getByRole("button", { name: "Snap recognition rep", exact: true })
    .click();
  await lab
    .getByRole("button", { name: "Pause recognition rep", exact: true })
    .click();
  await lab.getByRole("slider", { name: "Recognition timeline" }).fill("3");
  await lab.getByRole("button", { name: "Throw to X", exact: true }).click();
  await expect(
    lab.getByRole("status", { name: "Recognition feedback" }),
  ).toBeVisible();
  await page.goto("/qb-lab/coach");
  await expect(
    page.getByText("Read personnel, front and coverage · complete", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Demo athlete B", exact: true })
    .click();
  await expect(
    page.getByText("No assignments yet.", { exact: true }),
  ).toBeVisible();
});
