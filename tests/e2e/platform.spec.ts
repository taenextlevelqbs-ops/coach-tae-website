import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test.beforeEach(async ({ page }) => {
  await page.route("**/*", (route) =>
    new URL(route.request().url()).origin === "http://127.0.0.1:3150"
      ? route.continue()
      : route.abort("blockedbyclient"),
  );
});
for (const name of [
  "simulator",
  "playbook",
  "workouts",
  "mechanics",
  "progress",
  "coach",
  "access",
]) {
  test(`${name} reflows and passes accessibility checks`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/qb-lab/" + name);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(result.violations).toEqual([]);
    expect(errors).toEqual([]);
  });
}
test("simulator moves by keyboard and touch, pauses, makes one bounded decision and persists it", async ({
  page,
}) => {
  await page.goto("/qb-lab/simulator");
  const field = page.getByLabel(
    "Quarterback movement area. Use arrow keys or W A S D.",
    { exact: true },
  );
  await field.focus();
  await field.press("ArrowLeft");
  await expect(page.getByLabel("Quarterback coordinates")).toHaveText(
    "QB 48, 85",
  );
  await page.getByRole("button", { name: "Move quarterback right" }).click();
  await expect(page.getByLabel("Quarterback coordinates")).toHaveText(
    "QB 50, 85",
  );
  await page.getByRole("button", { name: "Move quarterback forward" }).click();
  await expect(page.getByLabel("Quarterback coordinates")).toHaveText(
    "QB 50, 83",
  );
  await page.getByRole("button", { name: "Snap & play" }).click();
  await page.getByRole("button", { name: "Pause play", exact: true }).click();
  const slider = page.getByRole("slider", { name: "Simulation timeline" });
  await slider.press("Home");
  for (let i = 0; i < 20; i++) await slider.press("ArrowRight");
  await expect(slider).toHaveValue("2");
  await page
    .getByRole("button", { name: /^Target / })
    .first()
    .click();
  await expect(
    page.getByRole("status", { name: "Simulation decision" }),
  ).toContainText("geometry checks");
  await expect(
    page.getByRole("button", { name: /^Target / }).first(),
  ).toBeDisabled();
  await page.goto("/qb-lab/progress");
  await expect(page.getByText(/geometry checks · not a QB rating/)).toHaveCount(
    1,
  );
  await page.reload();
  await expect(page.getByText(/geometry checks · not a QB rating/)).toHaveCount(
    1,
  );
});
test("edited play survives save/reload and becomes runnable in the matching flag simulator", async ({
  page,
}) => {
  await page.goto("/qb-lab/playbook");
  await page.getByLabel("Play format", { exact: true }).selectOption("flag5");
  await page.getByLabel("Play name", { exact: true }).fill("Test spacing");
  await page.getByLabel("Selected player", { exact: true }).selectOption("R1");
  await page.getByLabel("Player X", { exact: true }).fill("25");
  await page.getByRole("button", { name: "Straight path" }).click();
  await page.getByRole("button", { name: "Save play locally" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Play saved to this browser",
  );
  await page.reload();
  await page
    .getByRole("button", { name: "Test spacing · flag5", exact: true })
    .click();
  await expect(page.getByLabel("Play format", { exact: true })).toHaveValue(
    "flag5",
  );
  await page.getByLabel("Selected player", { exact: true }).selectOption("R1");
  await expect(page.getByLabel("Player X", { exact: true })).toHaveValue("25");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await page.goto("/qb-lab/simulator");
  await page.getByRole("radio", { name: "Flag", exact: true }).check();
  await page
    .getByLabel("Simulation scenario", { exact: true })
    .selectOption({ label: "My play: Test spacing" });
  await expect(page.getByText(/User-drawn prototype play/)).toBeVisible();
});
test("coach assignment, guided activity and progress form a persisted loop without touching demo B", async ({
  page,
}) => {
  await page.goto("/qb-lab/coach");
  await page
    .getByLabel("Assignment activity", { exact: true })
    .selectOption("footwork");
  await page.getByRole("button", { name: "Assign activity locally" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Local demo assignment created",
  );
  await page.goto("/qb-lab/athlete");
  await expect(
    page.getByText("Slow setup walkthrough · assigned", { exact: true }),
  ).toBeVisible();
  await page.goto("/qb-lab/workouts");
  await page
    .getByRole("button", { name: /Slow setup walkthrough Footwork/ })
    .click();
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Next step", exact: true }).click();
  await page
    .getByRole("button", { name: "Complete activity", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Completion recorded");
  await page.goto("/qb-lab/coach");
  await expect(
    page.getByText("Slow setup walkthrough · complete", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Demo athlete B", exact: true })
    .click();
  await expect(
    page.getByText("No assignments yet.", { exact: true }),
  ).toBeVisible();
  await page.goto("/qb-lab/progress");
  await expect(
    page.getByText("Slow setup walkthrough", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Slow setup walkthrough", { exact: true }),
  ).toBeVisible();
});
test("playbook import rejects invalid payloads and offers non-drag route editing", async ({
  page,
}) => {
  await page.goto("/qb-lab/playbook");
  await page.getByLabel("Import play JSON", { exact: true }).setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"__proto__":{},"players":[]}'),
  });
  await expect(page.getByRole("status")).toContainText("Import rejected");
  await page.getByLabel("Selected player", { exact: true }).selectOption("R5");
  await page.getByRole("button", { name: "Angle path" }).click();
  await page.getByLabel("Route point 1 X", { exact: true }).fill("20");
  await expect(page.getByLabel("Route point 1 X", { exact: true })).toHaveValue(
    "20",
  );
  await page
    .getByRole("button", { name: "Remove route point 1", exact: true })
    .click();
  await expect(page.getByLabel("Route point 2 X", { exact: true })).toHaveCount(
    0,
  );
});
test("mechanics is animated, manually inspectable and records a reviewed sequence once", async ({
  page,
}) => {
  await page.goto("/qb-lab/mechanics");
  await expect(
    page.getByRole("button", { name: "Record phase review" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Play movement" }).click();
  await expect(
    page.getByRole("slider", { name: "Movement phase" }),
  ).not.toHaveValue("0");
  await page.getByRole("button", { name: "Pause movement" }).click();
  for (const name of [
    "Setup",
    "Gather",
    "Step",
    "Release illustration",
    "Finish & reset",
  ])
    await page.getByRole("button", { name, exact: true }).click();
  await page
    .getByRole("button", { name: "Compare with setup", exact: true })
    .click();
  const comparisonAudit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(comparisonAudit.violations).toEqual([]);
  await page.getByRole("button", { name: "Record phase review" }).click();
  await expect(page.getByRole("status")).toContainText("review recorded");
  await expect(
    page.getByRole("button", { name: "Record phase review" }),
  ).toBeDisabled();
  await page.goto("/qb-lab/progress");
  await expect(page.getByText("Setup sequence", { exact: true })).toBeVisible();
});
test("private account and upload operations fail closed even with forged client roles", async ({
  request,
}) => {
  for (const operation of ["accounts", "consent", "upload", "billing"]) {
    const response = await request.post("/api/qb-lab/private/" + operation, {
      headers: { "x-role": "administrator" },
      data: { athleteId: "another-account" },
    });
    expect(response.status()).toBe(503);
    expect(response.headers()["cache-control"]).toBe("no-store");
    expect((await response.json()).code).toBe("PRIVATE_SERVICES_UNAVAILABLE");
  }
});

test("family launches a profile-specific correction and completing B leaves A assigned", async ({
  page,
}) => {
  await page.goto("/qb-lab/coach");
  await page.getByRole("button", { name: "Assign activity locally" }).click();
  await page
    .getByRole("button", { name: "Demo athlete B", exact: true })
    .click();
  await page.getByRole("button", { name: "Assign activity locally" }).click();
  await page.goto("/qb-lab/family");
  await page.getByRole("button", { name: /Demo athlete B/ }).click();
  await page
    .getByRole("link", { name: "Open activity library →", exact: true })
    .click();
  await expect(page).toHaveURL(/profile=B/);
  await expect(
    page.getByText("GUIDED SESSION / LOCAL DEMO ATHLETE B", { exact: true }),
  ).toBeVisible();
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Next step", exact: true }).click();
  await page
    .getByRole("button", { name: "Complete activity", exact: true })
    .click();
  await page.goto("/qb-lab/coach");
  await expect(
    page.getByText("Walk the starting picture · assigned", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Demo athlete B", exact: true })
    .click();
  await expect(
    page.getByText("Walk the starting picture · complete", { exact: true }),
  ).toBeVisible();
});
test("storage denial is reported and never claimed as a durable play save", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(Storage.prototype, "setItem", {
      value: () => {
        throw new DOMException("Blocked", "QuotaExceededError");
      },
    });
  });
  await page.goto("/qb-lab/playbook");
  await page.getByRole("button", { name: "Save play locally" }).click();
  await expect(page.getByRole("status")).toContainText("Durable save failed");
  await expect(page.getByRole("status")).not.toContainText(
    "Play saved to this browser",
  );
});

test("playbook markers move with keyboard and drag; field taps add editable route points", async ({
  page,
}) => {
  await page.goto("/qb-lab/playbook");
  const marker = page.getByRole("button", { name: "Select R5", exact: true });
  await marker.focus();
  await marker.press("ArrowRight");
  await expect(page.getByLabel("Player X", { exact: true })).toHaveValue("12");
  const box = await marker.boundingBox();
  if (!box) throw Error("Marker missing");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 25, box.y + box.height / 2, {
    steps: 5,
  });
  await page.mouse.up();
  expect(
    Number(await page.getByLabel("Player X", { exact: true }).inputValue()),
  ).toBeGreaterThan(12);
  await page
    .getByRole("button", { name: "Draw route points", exact: true })
    .click();
  const field = page.getByRole("group", { name: /Editable play field/ });
  const fieldBox = await field.boundingBox();
  if (!fieldBox) throw Error("Field missing");
  await page.mouse.click(
    fieldBox.x + fieldBox.width * 0.7,
    fieldBox.y + fieldBox.height * 0.2,
  );
  await expect(
    page.getByLabel("Route point 3 X", { exact: true }),
  ).toBeVisible();
});
