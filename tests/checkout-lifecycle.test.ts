import { test } from "node:test";
import assert from "node:assert/strict";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { processEvent } from "../lib/platform/webhook";
import { expireAndCloseCheckout } from "../lib/platform/close-checkout";
const id = "11111111-1111-4111-8111-111111111111";
function fixture(
  options: { customer?: string; paidRace?: boolean; unrelated?: boolean } = {},
) {
  const calls: {
    url: string;
    method: string;
    body: Record<string, unknown> | null;
  }[] = [];
  const session = {
    id: "cs_fixture",
    status: "open",
    payment_status: "unpaid",
    client_reference_id: id,
    customer: options.customer || "cus_fixture",
    metadata: {
      platform: options.unrelated ? "another-business" : "coach-tae",
    },
  };
  const client = createClient("https://fixture.supabase.co", "fixture-only", {
    auth: { persistSession: false },
    global: {
      fetch: async (url, init) => {
        const path = String(url),
          body = init?.body ? JSON.parse(String(init.body)) : null;
        calls.push({ url: path, method: init?.method || "GET", body });
        return Response.json(
          path.includes("ct_orders")
            ? { id, family_id: id, session_id: "cs_fixture", status: "pending" }
            : path.includes("ct_families")
              ? { stripe_customer_id: "cus_fixture" }
              : true,
        );
      },
    },
  });
  const stripe = new Stripe("sk_test_fixture_only", {
    httpClient: Stripe.createFetchHttpClient(async (url, init) => {
      const path = String(url);
      calls.push({ url: path, method: init?.method || "GET", body: null });
      if (path.includes("payment_intents"))
        return Response.json({
          id: "pi_fixture",
          status: "requires_payment_method",
          metadata: { order_id: id },
        });
      if (path.endsWith("/expire"))
        return Response.json(
          options.paidRace
            ? { ...session, status: "complete", payment_status: "paid" }
            : { ...session, status: "expired" },
        );
      return Response.json(session);
    }),
  });
  return { client, stripe, calls, session };
}
test("verified failed payment expires Checkout before transactionally releasing its hold", async () => {
  const f = fixture();
  await processEvent(
    {
      id: "evt_failure",
      type: "payment_intent.payment_failed",
      livemode: false,
      data: { object: { id: "pi_fixture" } },
    } as Stripe.Event,
    f,
  );
  const expire = f.calls.findIndex((c) => c.url.endsWith("/expire"));
  const release = f.calls.findIndex((c) =>
    c.url.includes("rpc/ct_close_checkout"),
  );
  assert.ok(expire >= 0 && release > expire);
  assert.equal(f.calls[release].body?.p_status, "failed");
});
test("unrelated and wrong-customer sessions cannot be expired; a concurrent paid session never releases capacity", async () => {
  const unrelated = fixture({ unrelated: true });
  assert.equal(
    await expireAndCloseCheckout(
      "cs_fixture",
      "cancel:test",
      "cancelled",
      unrelated,
    ),
    false,
  );
  assert.ok(!unrelated.calls.some((c) => c.url.endsWith("/expire")));
  const wrong = fixture({ customer: "cus_another_family" });
  await assert.rejects(
    expireAndCloseCheckout("cs_fixture", "cancel:test", "cancelled", wrong),
    /ownership/,
  );
  assert.ok(!wrong.calls.some((c) => c.url.endsWith("/expire")));
  const paid = fixture({ paidRace: true });
  assert.equal(
    await expireAndCloseCheckout(
      "cs_fixture",
      "cancel:test",
      "cancelled",
      paid,
    ),
    false,
  );
  assert.ok(!paid.calls.some((c) => c.url.includes("ct_close_checkout")));
});
test("expired Checkout webhook validates ownership before releasing; repeated delivery uses the same event key", async () => {
  const f = fixture();
  f.stripe.checkout.sessions.retrieve = async () =>
    ({
      ...f.session,
      status: "expired",
    }) as unknown as Stripe.Response<Stripe.Checkout.Session>;
  const event = {
    id: "evt_expired",
    type: "checkout.session.expired",
    livemode: false,
    data: { object: { id: "cs_fixture" } },
  } as Stripe.Event;
  await processEvent(event, f);
  await processEvent(event, f);
  const calls = f.calls.filter((c) => c.url.includes("ct_close_checkout"));
  assert.equal(calls.length, 2);
  assert.ok(
    calls.every(
      (c) =>
        c.body?.p_event === "evt_expired" && c.body?.p_status === "expired",
    ),
  );
});
