import { test } from "node:test";
import assert from "node:assert/strict";
import { payments, HttpError } from "../lib/platform/server";
import { POST } from "../app/api/platform/[...path]/route";

test("Calendly mode rejects website training Checkout before touching Stripe or creating orders/customers", async () => {
  const names = [
    "APP_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "PLATFORM_BOOKING_ENABLED",
  ];
  const previous = Object.fromEntries(names.map((k) => [k, process.env[k]]));
  const originalFetch = globalThis.fetch;
  Object.assign(process.env, {
    APP_URL: "https://coachtaeqb.com",
    NEXT_PUBLIC_SUPABASE_URL: "https://fixture.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "fixture-only",
    PLATFORM_BOOKING_ENABLED: "false",
  });
  const calls: string[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    calls.push(url);
    if (url.includes("/auth/v1/user"))
      return Response.json({
        id: "11111111-1111-4111-8111-111111111111",
        email: "parent@example.invalid",
      });
    if (url.includes("/ct_coaches")) return Response.json(null);
    if (url.includes("/ct_families"))
      return new Response(null, { status: 201 });
    if (url.includes("/rpc/ct_rate_limit")) return Response.json(null);
    throw new Error("Unexpected downstream call");
  };
  try {
    for (const product of ["private", "group", "private_pack", "group_pack"]) {
      const response = await POST(
        new Request("https://coachtaeqb.com/api/platform/checkout", {
          method: "POST",
          headers: {
            Origin: "https://coachtaeqb.com",
            Authorization: "Bearer fixture-token",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            product,
            request_id: "22222222-2222-4222-8222-222222222222",
          }),
        }),
        { params: Promise.resolve({ path: ["checkout"] }) },
      );
      assert.equal(response.status, 503);
      assert.match((await response.json()).error, /booking is not open/);
    }
    assert.ok(
      !calls.some((c) => /stripe\.com|ct_orders|ct_create_order/.test(c)),
    );
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of names)
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
  }
});

test("website Checkout cannot use live credentials or an override while webhook fulfillment is test-only", () => {
  const key = process.env.STRIPE_SECRET_KEY,
    flag = process.env.STRIPE_LIVE_ENABLED;
  try {
    for (const [secret, enabled] of [
      ["sk_live_fixture_not_real", "false"],
      ["sk_live_fixture_not_real", "true"],
      ["sk_test_fixture_not_real", "true"],
    ]) {
      process.env.STRIPE_SECRET_KEY = secret;
      process.env.STRIPE_LIVE_ENABLED = enabled;
      assert.throws(
        () => payments(),
        (e) => e instanceof HttpError && e.status === 503,
      );
    }
    process.env.STRIPE_SECRET_KEY = "sk_test_fixture_not_real";
    process.env.STRIPE_LIVE_ENABLED = "false";
    assert.ok(payments().checkout);
  } finally {
    if (key === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = key;
    if (flag === undefined) delete process.env.STRIPE_LIVE_ENABLED;
    else process.env.STRIPE_LIVE_ENABLED = flag;
  }
});
