import { test, expect } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
test.beforeEach(async ({ page }) => {
  await page.route("**/*", (r) =>
    new URL(r.request().url()).origin === "http://127.0.0.1:3150"
      ? r.continue()
      : r.abort(),
  );
});
test("coach calendar, keyboard tabs, planning sliders and format-safe depth charts are connected", async ({
  page,
}) => {
  await page.goto("/qb-lab/coach");
  const workspace = page.getByRole("region", {
    name: "Coach command workspace",
  });
  await workspace
    .getByRole("button", {
      name: "Schedule demonstration session",
      exact: true,
    })
    .click();
  await expect(
    workspace.getByText(/Session added to this demo workspace/),
  ).toBeVisible();
  const roster = workspace.getByRole("tab", { name: "Roster", exact: true });
  await roster.focus();
  await roster.press("Enter");
  await workspace.getByLabel("QB depth 1", { exact: true }).selectOption("A");
  await workspace.getByLabel("X depth 2", { exact: true }).selectOption("A");
  await expect(workspace.getByLabel("QB depth 1", { exact: true })).toHaveValue(
    "",
  );
  const focus = workspace.getByRole("slider", {
    name: "Footwork emphasis for Alex",
    exact: true,
  });
  await focus.focus();
  await focus.press("End");
  await expect(focus).toHaveValue("5");
  await workspace
    .getByRole("button", { name: "Select Jordan", exact: true })
    .click();
  await expect(
    workspace.getByRole("slider", {
      name: "Footwork emphasis for Jordan",
      exact: true,
    }),
  ).toHaveValue("3");
  await workspace
    .getByLabel("Depth chart format", { exact: true })
    .selectOption("flag8");
  await expect(
    workspace.getByLabel("E depth 1", { exact: true }),
  ).toBeVisible();
  await expect(
    workspace
      .getByLabel("QB depth 1", { exact: true })
      .getByRole("option", { name: "Alex", exact: true }),
  ).toHaveCount(0);
  await roster.focus();
  await roster.press("ArrowRight");
  await expect(
    workspace.getByRole("tab", { name: "Playbook", exact: true }),
  ).toBeFocused();
  await workspace.getByRole("tab", { name: "Dashboard", exact: true }).click();
  await expect(
    workspace.getByText("Footwork · Alex", { exact: true }),
  ).toBeVisible();
});
test("play script parsing links actual saved formation data to the live simulator", async ({
  page,
}) => {
  await page.goto("/qb-lab/playbook");
  await page.getByLabel("Play name", { exact: true }).fill("Coach route study");
  await page
    .getByRole("button", { name: "Save play locally", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Play saved");
  await page.goto("/qb-lab/coach");
  const workspace = page.getByRole("region", {
    name: "Coach command workspace",
  });
  await workspace.getByRole("tab", { name: "Playbook", exact: true }).click();
  await workspace
    .getByRole("button", { name: "Parse script", exact: true })
    .click();
  const play = workspace.getByLabel("Saved play for Spacing study", {
    exact: true,
  });
  await play.selectOption({ label: "Coach route study" });
  const id = await play.inputValue();
  await workspace
    .getByRole("link", { name: "Run Spacing study in simulator", exact: false })
    .click();
  await expect(page).toHaveURL(new RegExp(`play=${id}`));
  await expect(
    page.getByLabel("Formation / saved play", { exact: false }),
  ).toHaveValue(id);
});
test("synthetic film is private per demo athlete, supports annotation and feedback, and sends no uploads", async ({
  page,
  request,
}) => {
  const posts: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") posts.push(r.url());
  });
  await page.goto("/qb-lab/coach");
  const w = page.getByRole("region", { name: "Coach command workspace" });
  await w.getByRole("tab", { name: "Film Vault", exact: true }).click();
  await w.getByRole("button", { name: "Athlete view", exact: true }).click();
  await w
    .getByRole("group", { name: "Synthetic video submission", exact: true })
    .evaluate((el) => {
      const data = new DataTransfer();
      data.items.add(
        new File(["synthetic test fixture"], "synthetic-only.mp4", {
          type: "video/mp4",
        }),
      );
      el.dispatchEvent(
        new DragEvent("drop", {
          bubbles: true,
          cancelable: true,
          dataTransfer: data,
        }),
      );
    });
  await expect(
    w.getByRole("status", { name: "Submission result" }),
  ).toContainText("No file was read or uploaded");

  await w
    .getByRole("button", { name: "Try a demo submission", exact: true })
    .click();
  await expect(
    w.getByRole("status", { name: "Submission result" }),
  ).toContainText("No video file was collected");
  await w.getByRole("button", { name: "Coach view", exact: true }).click();
  await w.getByLabel("Coach playback speed", { exact: true }).selectOption("2");
  await w
    .getByRole("slider", { name: "Coach film timeline", exact: true })
    .fill("3");
  const marker = w.getByRole("button", { name: /Keyboard annotation marker/ });
  await marker.focus();
  await marker.press("ArrowRight");
  await marker.press("Enter");
  await expect(
    w.getByRole("img", {
      name: "Feedback canvas with 1 annotations",
      exact: true,
    }),
  ).toBeVisible();
  await w
    .getByRole("button", {
      name: "Save timestamped demo feedback",
      exact: true,
    })
    .click();
  await expect(
    w.getByRole("status", { name: "Coach feedback result" }),
  ).toContainText("Demo feedback saved");
  await w.getByRole("button", { name: "Athlete view", exact: true }).click();
  await expect(
    w.getByText(/3.0s · Check safety depth · synthetic coaching note/),
  ).toBeVisible();
  await w
    .getByLabel("Submission demo athlete", { exact: true })
    .selectOption("A");
  await expect(
    w.getByText("No submissions for this demo athlete.", { exact: true }),
  ).toBeVisible();
  expect(posts).toEqual([]);
  const response = await request.post("/api/qb-lab/video/intents", {
    headers: { "x-role": "coach" },
    data: { Player_ID: "other", Coach_ID: "forged", visibility: "Public" },
  });
  expect(response.status()).toBe(503);
  expect(await response.json()).toMatchObject({
    code: "PRIVATE_SERVICES_UNAVAILABLE",
  });
});
test("all four coach tabs reflow and pass automated accessibility checks", async ({
  page,
}) => {
  await page.goto("/qb-lab/coach");
  const w = page.getByRole("region", { name: "Coach command workspace" });
  for (const name of ["Dashboard", "Roster", "Playbook", "Film Vault"]) {
    await w.getByRole("tab", { name, exact: true }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(result.violations).toEqual([]);
  }
  await w.getByRole("button", { name: "Athlete view", exact: true }).click();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page
    .getByRole("navigation", { name: "QB LAB navigation" })
    .getByRole("link", { name: "Home", exact: true })
    .click();
  await expect(page).toHaveURL(/\/qb-lab\/?$/);
  await expect(page.locator(".coach-console")).toHaveCount(0);
  await expect(page.locator(".qb-application")).toHaveCSS(
    "background-color",
    "rgb(11, 18, 32)",
  );
});
