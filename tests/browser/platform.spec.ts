import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
const family = "11111111-1111-4111-8111-111111111111",
  athlete = "22222222-2222-4222-8222-222222222222",
  slotId = "33333333-3333-4333-8333-333333333333";
const slot = {
  id: slotId,
  kind: "private",
  starts_at: new Date(Date.now() + 96 * 3600000).toISOString(),
  ends_at: new Date(Date.now() + 97 * 3600000).toISOString(),
  capacity: 1,
  remaining: 1,
};
const portal = {
  athletes: [
    {
      id: athlete,
      name: "Test Athlete",
      graduation_year: 2030,
      family_id: family,
    },
  ],
  bookings: [],
  credits: { private: 3, group: 0 },
  orders: [],
  memberships: [],
  settings: {
    cancellation_hours: 24,
    reschedule_hours: 24,
    notice_hours: 12,
    timezone: "America/New_York",
    location: "Staging test field",
  },
  progress: [],
  isCoach: false,
};
async function session(page: Page) {
  await page.addInitScript(
    ({ family }) => {
      const payload = btoa(
        JSON.stringify({
          sub: family,
          exp: Math.floor(Date.now() / 1000) + 3600,
          role: "authenticated",
          aud: "authenticated",
        }),
      );
      localStorage.setItem(
        "sb-fixture-auth-token",
        JSON.stringify({
          access_token: `e30.${payload}.fixture`,
          refresh_token: "fixture-refresh",
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          expires_in: 3600,
          token_type: "bearer",
          user: {
            id: family,
            email: "parent@example.invalid",
            aud: "authenticated",
            role: "authenticated",
            app_metadata: {},
            user_metadata: {},
            created_at: new Date().toISOString(),
          },
        }),
      );
    },
    { family },
  );
}
async function mocks(
  page: Page,
  options: { member?: boolean; coach?: boolean } = {},
) {
  await page.route("https://fixture.supabase.co/**", (route) =>
    route.fulfill({ json: {} }),
  );
  let savedWindows: Record<string, unknown>[] = [];
  await page.route("**/api/platform/**", async (route) => {
    const url = new URL(route.request().url()),
      path = url.pathname.split("/api/platform/")[1];
    if (path === "admin/calendar" && options.coach)
      return route.fulfill({
        json: {
          rules: savedWindows,
          slots: [],
          bookings: [],
          blocks: [],
          settings: portal.settings,
          limited: false,
        },
      });
    if (path === "admin/windows" && options.coach) {
      const body = route.request().postDataJSON();
      savedWindows = body.data.weekdays.map((day: number) => ({
        ...body.data,
        weekday: day,
        id: body.id || "44444444-4444-4444-8444-444444444444",
        active: true,
      }));
      return route.fulfill({ json: { created: 6 } });
    }
    if (path === "me")
      return route.fulfill({
        json: {
          ...portal,
          memberships: options.member
            ? [
                {
                  subscription_id: "sub_fixture",
                  status: "active",
                  access_until: "2030-01-01",
                  cancel_at_period_end: false,
                },
              ]
            : [],
        },
      });
    if (path === "availability")
      return route.fulfill({
        json: { slots: [slot], settings: portal.settings },
      });
    if (path === "book")
      return route.fulfill({
        json: { booking: { id: "booking-fixture", status: "confirmed" } },
      });
    if (path === "library")
      return route.fulfill({
        json: {
          lessons: options.member
            ? [
                {
                  title: "Coach-published test lesson",
                  category: "football_iq",
                },
              ]
            : [],
        },
      });
    if (path === "lessons")
      return route.fulfill({
        json: {
          lessons: [
            {
              id: "lesson-fixture",
              title: "Coach-published test lesson",
              category: "football_iq",
              body: "Browser test fixture only. This is not published educational content.",
              questions: [],
              published: true,
            },
          ],
        },
      });
    if (path === "progress") return route.fulfill({ json: { score: null } });
    if (path === "admin" && options.coach)
      return route.fulfill({
        json: {
          ct_athletes: portal.athletes,
          ct_bookings: [],
          ct_slots: [slot],
          ct_rules: [],
          ct_blocks: [],
          ct_orders: [],
          ct_invoices: [],
          ct_credits: [],
          ct_memberships: [],
          ct_lessons: [],
          ct_outbox: [],
          ct_settings: [portal.settings],
        },
      });
    if (path === "admin")
      return route.fulfill({
        status: 403,
        json: { error: "Coach access required." },
      });
    return route.fulfill({
      status: 404,
      json: { error: "Unexpected test request" },
    });
  });
}
async function noOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
}
test("branded homepage remains usable and navigation opens the family hub", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("TRAIN.");
  const menu = page.getByRole("button", { name: "Open site navigation" });
  if (await menu.isVisible()) await menu.click();
  await page
    .getByRole("link", { name: "Family portal", exact: true })
    .filter({ visible: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Every rep.",
  );
  await noOverflow(page);
});
test("sign-in uses an email code, with labeled mobile controls", async ({
  page,
}) => {
  await mocks(page);
  await page.goto("/portal");
  await page.getByLabel("Parent email").fill("parent@example.invalid");
  await page.getByRole("button", { name: "Email my sign-in code" }).click();
  await expect(page.getByLabel("Email verification code")).toBeVisible();
  await noOverflow(page);
});
test("family portal displays separate balances, athlete profile and unavailable purchase state", async ({
  page,
}) => {
  await session(page);
  await mocks(page);
  await page.goto("/portal");
  await expect(page.getByText("Test Athlete", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Private credits", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Buy 3 private credits" }),
  ).toBeDisabled();
  await expect(
    page.getByText(
      "No upcoming confirmed native bookings are recorded here. Calendly appointments are not included.",
    ),
  ).toBeVisible();
  await noOverflow(page);
});
test("parent can select a time and book with one credit in a short flow", async ({
  page,
}) => {
  await session(page);
  await mocks(page);
  await page.goto("/book");
  await expect(
    page.getByRole("combobox", { name: "Athlete", exact: true }),
  ).toHaveValue(athlete);
  await page.getByRole("button", { name: /spot left/ }).click();
  const request = page.waitForRequest((r) =>
    r.url().endsWith("/api/platform/book"),
  );
  await page.getByRole("button", { name: "Confirm with 1 credit" }).click();
  expect((await request).postDataJSON()).toMatchObject({
    athlete_id: athlete,
    slot_id: slotId,
    credit: true,
  });
  await expect(
    page.getByRole("heading", { name: "You’re on the calendar." }),
  ).toBeVisible();
  await noOverflow(page);
});
test("empty QB Lab never offers a paid membership or fabricated lessons", async ({
  page,
}) => {
  await session(page);
  await mocks(page);
  await page.goto("/lab");
  await expect(
    page.getByText("The content library is being prepared.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start monthly membership" }),
  ).toHaveCount(0);
  await noOverflow(page);
});
test("active member can read a published fixture and save athlete progress", async ({
  page,
}) => {
  await session(page);
  await mocks(page, { member: true });
  await page.goto("/lab");
  await expect(
    page.getByRole("heading", { name: "Coach-published test lesson" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mark lesson complete" }).click();
  await expect(page.getByText("Lesson marked complete.")).toBeVisible();
  await noOverflow(page);
});
test("parent cannot use the coach interface", async ({ page }) => {
  await session(page);
  await mocks(page);
  await page.goto("/coach");
  await expect(
    page.getByRole("alert").filter({ hasText: "Coach access required." }),
  ).toHaveText("Coach access required.");
  await expect(
    page.getByRole("button", { name: "Add weekly rule" }),
  ).toHaveCount(0);
});
test("actual HTTP routes reject missing auth, CSRF, unsigned webhooks and unauthorized cron", async ({
  request,
}) => {
  expect((await request.get("/api/platform/me")).status()).toBe(401);
  for (const path of ["admin", "admin/calendar?date=2030-01-01"])
    expect((await request.get(`/api/platform/${path}`)).status()).toBe(401);
  expect(
    (
      await request.post("/api/platform/admin/windows", {
        headers: { Origin: "http://127.0.0.1:3100" },
        data: {},
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.post("/api/platform/book", {
        headers: { Origin: "https://attacker.example.invalid" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  expect(
    (await request.post("/api/stripe/webhook", { data: {} })).status(),
  ).toBe(400);
  expect((await request.get("/api/jobs")).status()).toBe(401);
  expect((await request.post("/api/jobs", { data: {} })).status()).toBe(401);
});

test("coach workspace exposes schedule, policies, content and delivery controls without mobile overflow", async ({
  page,
}, testInfo) => {
  await session(page);
  await mocks(page, { coach: true });
  await page.goto("/coach");
  await page.getByRole("button", { name: "Schedule", exact: true }).click();
  await page
    .getByRole("link", { name: "Open Availability & Schedule" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Day schedule" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Booking policies & location" }),
  ).toBeVisible();
  await noOverflow(page);
  await page.getByRole("link", { name: "← Coach dashboard" }).click();
  await page.getByRole("button", { name: "QB Lab", exact: true }).click();
  await expect(page.getByRole("button", { name: "Save lesson" })).toBeVisible();
  await noOverflow(page);
  await page
    .getByRole("button", { name: "Notifications", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Delivery queue" }),
  ).toBeVisible();
  await noOverflow(page);
  await page.screenshot({
    path: testInfo.outputPath("coach-workspace.png"),
    fullPage: true,
  });
});

test("coach saves a weekly window from the mobile calendar and can reopen it for editing", async ({
  page,
}, testInfo) => {
  await session(page);
  await mocks(page, { coach: true });
  await page.goto("/coach/schedule");
  await page
    .getByRole("button", { name: "Add Availability", exact: true })
    .click();
  await page.getByLabel("Start (Eastern)", { exact: true }).fill("16:00");
  await page.getByLabel("End (Eastern)", { exact: true }).fill("20:00");
  const request = page.waitForRequest((r) =>
    r.url().endsWith("/api/platform/admin/windows"),
  );
  await page
    .getByRole("button", { name: "Save availability", exact: true })
    .click();
  expect((await request).postDataJSON().data).toMatchObject({
    timezone: "America/New_York",
    local_start: "16:00",
    local_end: "20:00",
    duration_minutes: 60,
    buffer_minutes: 15,
  });
  await expect(
    page.getByText("Active · 60 min sessions", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Edit window" }).click();
  await expect(
    page.getByRole("heading", { name: "Edit availability" }),
  ).toBeVisible();
  await expect(page.getByLabel("End (Eastern)", { exact: true })).toHaveValue(
    "20:00",
  );
  await noOverflow(page);
  await page.screenshot({
    path: testInfo.outputPath("schedule.png"),
    fullPage: true,
  });
});

test("original curriculum renders a coverage diagram and explains the submitted quiz answer", async ({
  page,
}, testInfo) => {
  const rows = JSON.parse(
    readFileSync(
      "supabase/migrations/202610280003_original_qb_lab.sql",
      "utf8",
    ).split("$curriculum$")[1],
  );
  const lesson = {
    ...rows.find((l: { slug: string }) => l.slug === "cover-2"),
    id: "55555555-5555-4555-8555-555555555555",
  };
  await session(page);
  await mocks(page, { member: true });
  await page.route("**/api/platform/lessons", (route) =>
    route.fulfill({ json: { lessons: [lesson] } }),
  );
  await page.route("**/api/platform/progress", (route) =>
    route.fulfill({
      json: {
        score: 100,
        feedback: lesson.questions.map(
          (q: {
            prompt: string;
            answer: number;
            options: string[];
            explanation: string;
          }) => ({
            prompt: q.prompt,
            correct: true,
            correct_option: q.options[q.answer],
            explanation: q.explanation,
          }),
        ),
      },
    }),
  );
  await page.goto("/lab");
  await expect(
    page.getByRole("heading", { name: lesson.title, exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("img", { name: /Cover 2/ })).toBeVisible();
  await page
    .getByRole("radio", {
      name: lesson.questions[0].options[lesson.questions[0].answer],
      exact: true,
    })
    .check();
  await page.getByRole("button", { name: "Submit quiz" }).click();
  await expect(
    page.getByText(lesson.questions[0].explanation, { exact: true }),
  ).toBeVisible();
  await noOverflow(page);
  await page.screenshot({
    path: testInfo.outputPath("qb-lab.png"),
    fullPage: true,
  });
});

test("OTP registration/sign-in request, session persistence and sign-out", async ({
  page,
}) => {
  await mocks(page);
  let sends = 0;
  await page.route("https://fixture.supabase.co/auth/v1/otp", async (route) => {
    sends++;
    expect(route.request().postDataJSON()).toMatchObject({
      email: "parent@example.invalid",
      create_user: true,
    });
    return route.fulfill({ json: {} });
  });
  await page.route("https://fixture.supabase.co/auth/v1/verify", (route) => {
    if (route.request().postDataJSON().token === "000000")
      return route.fulfill({
        status: 403,
        headers: {
          "x-supabase-api-version": "2024-01-01",
          "access-control-expose-headers": "x-supabase-api-version",
        },
        json: { code: "otp_expired", msg: "Token expired" },
      });
    expect(route.request().postDataJSON()).toMatchObject({
      email: "parent@example.invalid",
      token: "123456",
      type: "email",
    });
    const payload = btoa(
      JSON.stringify({
        sub: family,
        exp: Math.floor(Date.now() / 1000) + 3600,
        role: "authenticated",
        aud: "authenticated",
      }),
    );
    return route.fulfill({
      json: {
        access_token: `e30.${payload}.fixture`,
        refresh_token: "fixture-refresh",
        expires_in: 3600,
        token_type: "bearer",
        user: {
          id: family,
          email: "parent@example.invalid",
          aud: "authenticated",
          role: "authenticated",
          app_metadata: {},
          user_metadata: {},
          created_at: new Date().toISOString(),
        },
      },
    });
  });
  await page.route("https://fixture.supabase.co/auth/v1/logout**", (route) =>
    route.fulfill({ status: 204 }),
  );
  await page.goto("/portal");
  await page.getByLabel("Parent email").fill("parent@example.invalid");
  await page.getByRole("button", { name: "Email my sign-in code" }).click();
  await expect(
    page.getByRole("button", { name: /Resend code in/ }),
  ).toBeDisabled();
  await page.getByLabel("Email verification code").fill("000000");
  await page.getByRole("button", { name: "Verify & sign in" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "That code has expired" }),
  ).toBeVisible();
  await page.getByLabel("Email verification code").fill("123456");
  await page.getByRole("button", { name: "Verify & sign in" }).click();
  await expect(page.getByText("Test Athlete", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Test Athlete", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByLabel("Parent email")).toBeVisible();
  await expect(page.getByText("Test Athlete", { exact: true })).toHaveCount(0);
  expect(sends).toBe(1);
});

test("email rate limit gives clear feedback and survives reload", async ({
  page,
}) => {
  await mocks(page);
  await page.route("https://fixture.supabase.co/auth/v1/otp", (route) =>
    route.fulfill({
      status: 429,
      json: {
        code: "over_email_send_rate_limit",
        msg: "email rate limit exceeded",
      },
    }),
  );
  await page.goto("/portal");
  await page.getByLabel("Parent email").fill("parent@example.invalid");
  await page.getByRole("button", { name: "Email my sign-in code" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Too many sign-in attempts" }),
  ).toContainText("Wait a few minutes");
  await expect(
    page.getByRole("button", { name: /Try again in/ }),
  ).toBeDisabled();
  await page.reload();
  await expect(
    page.getByRole("button", { name: /Try again in/ }),
  ).toBeDisabled();
});

test("sign-out clears local access and explains when remote session revocation fails", async ({
  page,
}) => {
  await session(page);
  await mocks(page);
  await page.route("https://fixture.supabase.co/auth/v1/logout**", (route) =>
    route.fulfill({ status: 500, json: { message: "Upstream unavailable" } }),
  );
  await page.goto("/portal");
  await expect(page.getByText("Test Athlete", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page.getByLabel("Parent email")).toBeVisible();
  await expect(
    page.getByRole("alert").filter({ hasText: "signed out on this device" }),
  ).toBeVisible();
  await expect(page.getByText("Test Athlete", { exact: true })).toHaveCount(0);
  expect(
    await page.evaluate(() => localStorage.getItem("sb-fixture-auth-token")),
  ).toBeNull();
});

test("all public booking links use the native date/time flow", async ({
  page,
}) => {
  await session(page);
  await mocks(page);
  await page.goto("/");
  const hrefs = await page
    .locator("a")
    .evaluateAll((links) => links.map((a) => a.getAttribute("href") || ""));
  expect(hrefs).toContain(
    "/book?kind=private",
  );
  expect(hrefs).toContain(
    "/book?kind=group",
  );
  await page.goto("/book?kind=group");
  await expect(
    page.getByRole("combobox", { name: "Training", exact: true }),
  ).toHaveValue("group");
  await expect(page.locator('a[href*="calendly.com"]')).toHaveCount(0);
  await noOverflow(page);
});

test("coach can inspect parent contact, pending, cancelled and completed time windows", async ({
  page,
}) => {
  await session(page);
  await mocks(page, { coach: true });
  const past = {
    ...slot,
    starts_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    ends_at: new Date(Date.now() - 47 * 3600000).toISOString(),
  };
  await page.route("**/api/platform/admin", (route) =>
    route.fulfill({
      json: {
        ct_athletes: portal.athletes,
        ct_families: [{ id: family, email: "parent@example.invalid" }],
        ct_bookings: [
          {
            id: "past",
            family_id: family,
            athlete_id: athlete,
            status: "confirmed",
            paid: true,
            ct_slots: past,
            ct_athletes: { name: "Test Athlete" },
          },
          {
            id: "pending",
            family_id: family,
            athlete_id: athlete,
            status: "held",
            paid: false,
            hold_until: new Date(Date.now() + 600000).toISOString(),
            ct_slots: { ...slot, kind: "group" },
            ct_athletes: { name: "Test Athlete" },
          },
          {
            id: "cancelled",
            family_id: family,
            athlete_id: athlete,
            status: "cancelled",
            paid: true,
            ct_slots: slot,
            ct_athletes: { name: "Test Athlete" },
          },
        ],
        ct_slots: [slot],
        ct_rules: [],
        ct_blocks: [],
        ct_orders: [],
        ct_invoices: [],
        ct_credits: [],
        ct_memberships: [],
        ct_lessons: [],
        ct_outbox: [],
        ct_settings: [portal.settings],
      },
    }),
  );
  await page.goto("/coach");
  await page.getByRole("button", { name: "Appointments", exact: true }).click();
  await expect(
    page.getByText("Completed time window", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Pending payment", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("cancelled", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Parent: parent@example.invalid", { exact: true }),
  ).toHaveCount(3);
  await expect(
    page.getByText("Paid / training credit redeemed", { exact: false }),
  ).toHaveCount(2);
  await noOverflow(page);
});

test("native record and schedule notices do not claim Calendly appointments are empty or synchronized", async ({
  page,
}) => {
  await session(page);
  await mocks(page, { coach: true });
  await page.goto("/portal");
  await expect(page.getByRole("note")).toContainText(
    "Native training records",
  );
  await expect(
    page.getByText(
      "No upcoming confirmed native bookings are recorded here. Calendly appointments are not included.",
    ),
  ).toBeVisible();
  await page.goto("/coach");
  await expect(page.getByRole("note")).toContainText(
    "Preserved external appointments appear as occupied times",
  );
  await page.goto("/coach/schedule");
  await expect(page.getByRole("note")).toContainText(
    "Schedule edits respect preserved appointment blocks",
  );
  await noOverflow(page);
});

test("returning from simulated cancelled Checkout requests secure closure and displays its verified result", async ({
  page,
}) => {
  await session(page);
  await mocks(page);
  const orderId = "66666666-6666-4666-8666-666666666666";
  await page.route("**/api/platform/checkout/cancel", (route) => {
    expect(route.request().method()).toBe("POST");
    expect(route.request().postDataJSON()).toEqual({ order_id: orderId });
    return route.fulfill({ json: { released: true } });
  });
  await page.goto(`/portal?checkout=cancelled&order=${orderId}`);
  await expect(
    page.getByText("Unpaid Checkout closed and reservation released.", {
      exact: true,
    }),
  ).toBeVisible();
  await noOverflow(page);
});
