import { test } from "node:test";
import assert from "node:assert/strict";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import {
  catalog,
  entitled,
  validPrice,
  type ProductKey,
} from "../lib/platform/catalog";
import { checkoutParams } from "../lib/platform/checkout";
import { processEvent } from "../lib/platform/webhook";

test("catalog verifies all six prices, currency, billing interval and active status", () => {
  const expected = [6000, 8500, 15000, 24000, 999, 7999];
  assert.deepEqual(
    Object.values(catalog).map((v) => v.amount),
    expected,
  );
  for (const key of Object.keys(catalog) as ProductKey[]) {
    const item = catalog[key];
    const price = {
      active: true,
      currency: "usd",
      unit_amount: item.amount,
      type: "interval" in item ? "recurring" : "one_time",
      recurring:
        "interval" in item
          ? { interval: item.interval, interval_count: 1 }
          : null,
    };
    assert.ok(validPrice(key, price));
    assert.equal(
      validPrice(key, { ...price, unit_amount: item.amount + 1 }),
      false,
    );
    assert.equal(validPrice(key, { ...price, currency: "eur" }), false);
    assert.equal(validPrice(key, { ...price, active: false }), false);
    if ("interval" in item)
      assert.equal(
        validPrice(key, {
          ...price,
          recurring: {
            interval: item.interval === "month" ? "year" : "month",
            interval_count: 1,
          },
        }),
        false,
      );
  }
});
test("checkout always uses configured Price ID, server-selected mode, same-origin returns and stable retry parameters", () => {
  const input = {
    id: "order-fixture",
    customer: "cus_fixture",
    price: "price_fixture",
    product: "private_pack" as const,
    origin: "https://staging.example.invalid",
    createdAt: "2026-10-28T10:00:00Z",
  };
  const payload = checkoutParams(input);
  assert.deepEqual(payload.line_items, [
    { price: "price_fixture", quantity: 1 },
  ]);
  assert.equal(payload.mode, "payment");
  assert.equal(payload.invoice_creation?.enabled, true);
  assert.deepEqual(payload.allowed_payment_method_types, ["card"]);
  assert.equal(
    payload.success_url,
    "https://staging.example.invalid/portal?checkout=complete",
  );
  assert.deepEqual(checkoutParams(input), payload);
  assert.equal(payload.expires_at, Date.parse(input.createdAt) / 1000 + 1860);
  assert.equal(
    checkoutParams({ ...input, product: "lab_annual" }).mode,
    "subscription",
  );
});
test("Stripe signature verification rejects tampering and old signatures", () => {
  const stripe = new Stripe("sk_test_fixture_not_a_real_key");
  const secret = "whsec_fixture_not_a_real_secret";
  const payload = JSON.stringify({
    id: "evt_fixture",
    object: "event",
    type: "checkout.session.completed",
    data: { object: {} },
  });
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret });
  assert.equal(
    stripe.webhooks.constructEvent(payload, header, secret).id,
    "evt_fixture",
  );
  assert.throws(() =>
    stripe.webhooks.constructEvent(payload + " ", header, secret),
  );
  const stale = stripe.webhooks.generateTestHeaderString({
    payload,
    secret,
    timestamp: Math.floor(Date.now() / 1000) - 1000,
  });
  assert.throws(() => stripe.webhooks.constructEvent(payload, stale, secret));
});
test("membership access requires active/trialing state and an unexpired paid-through date", () => {
  const until = "2030-01-01T00:00:00Z",
    now = Date.parse("2026-01-01");
  assert.equal(entitled("active", until, now), true);
  assert.equal(entitled("trialing", until, now), true);
  for (const status of [
    "past_due",
    "unpaid",
    "canceled",
    "incomplete",
    "paused",
  ])
    assert.equal(entitled(status, until, now), false);
  assert.equal(entitled("active", "2025-01-01", now), false);
});
function fixture(overrides: Record<string, unknown> = {}) {
  const calls: { path: string; body: unknown }[] = [];
  const order = {
    id: "order_fixture",
    family_id: "family_fixture",
    product_key: "group_pack",
    price_id: "price_fixture",
    session_id: "cs_fixture",
  };
  const session = {
    id: "cs_fixture",
    object: "checkout.session",
    livemode: false,
    payment_status: "paid",
    metadata: { platform: "coach-tae" },
    customer: "cus_fixture",
    client_reference_id: order.id,
    currency: "usd",
    amount_total: 15000,
    payment_intent: "pi_fixture",
    line_items: { data: [{ quantity: 1, price: { id: "price_fixture" } }] },
    ...overrides,
  };
  const client = createClient(
    "https://supabase.example.invalid",
    "fixture-anon-key",
    {
      auth: { persistSession: false },
      global: {
        fetch: async (url, init) => {
          const path = String(url);
          calls.push({
            path,
            body: init?.body ? JSON.parse(String(init.body)) : null,
          });
          return new Response(
            JSON.stringify(
              path.includes("/ct_orders")
                ? order
                : path.includes("/ct_families")
                  ? { stripe_customer_id: "cus_fixture" }
                  : null,
            ),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        },
      },
    },
  );
  const stripe = new Stripe("sk_test_fixture_not_a_real_key", {
    httpClient: Stripe.createFetchHttpClient(
      async () =>
        new Response(JSON.stringify(session), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    ),
  });
  const event = {
    id: "evt_fixture",
    type: "checkout.session.completed",
    livemode: false,
    created: 123,
    data: { object: { id: "cs_fixture" } },
  } as Stripe.Event;
  return { calls, client, stripe, event };
}
test("paid Checkout webhook validates the saved order then requests transactional fulfillment", async () => {
  const f = fixture();
  await processEvent(f.event, f);
  const call = f.calls.find((c) => c.path.includes("/rpc/ct_fulfill"));
  assert.ok(call);
  assert.deepEqual(call.body, {
    p_event: "evt_fixture",
    p_order: "order_fixture",
    p_session: "cs_fixture",
    p_intent: "pi_fixture",
    p_amount: 15000,
    p_currency: "usd",
  });
});
test("wrong customer, amount, currency, quantity or Price ID cannot fulfill an order", async () => {
  for (const override of [
    { customer: "cus_wrong" },
    { amount_total: 1 },
    { currency: "eur" },
    { line_items: { data: [{ quantity: 2, price: { id: "price_fixture" } }] } },
    { line_items: { data: [{ quantity: 1, price: { id: "price_wrong" } }] } },
    { client_reference_id: "wrong" },
  ]) {
    const f = fixture(override);
    await assert.rejects(processEvent(f.event, f), /does not match/);
    assert.equal(
      f.calls.some((c) => c.path.includes("/rpc/ct_fulfill")),
      false,
    );
  }
});
test("unpaid checkout does not grant credits; live events are refused", async () => {
  const f = fixture({ payment_status: "unpaid" });
  await processEvent(f.event, f);
  assert.equal(f.calls.length, 0);
  await assert.rejects(
    processEvent({ ...f.event, livemode: true }, f),
    /Live payment/,
  );
});
test("webhook DB errors propagate for Stripe retry instead of acknowledging lost fulfillment", async () => {
  const f = fixture();
  const failing = createClient(
    "https://supabase.example.invalid",
    "fixture-key",
    {
      global: {
        fetch: async (url) =>
          String(url).includes("/rpc/")
            ? new Response(
                JSON.stringify({
                  code: "TEST",
                  message: "Database not available",
                }),
                { status: 503 },
              )
            : new Response(
                JSON.stringify(
                  String(url).includes("ct_orders")
                    ? {
                        id: "order_fixture",
                        family_id: "family_fixture",
                        product_key: "group_pack",
                        price_id: "price_fixture",
                        session_id: "cs_fixture",
                      }
                    : { stripe_customer_id: "cus_fixture" },
                ),
                {
                  status: 200,
                  headers: { "Content-Type": "application/json" },
                },
              ),
      },
    },
  );
  await assert.rejects(
    processEvent(f.event, { client: failing, stripe: f.stripe }),
    /could not be saved/,
  );
});

test("unrelated Stripe checkouts are acknowledged without looking up a family order", async () => {
  const f = fixture({ metadata: {} });
  await processEvent(f.event, f);
  assert.equal(f.calls.length, 0);
});

test("refund webhooks reconcile only settled amounts and reject mismatched payment totals", async () => {
  const calls: unknown[] = [];
  const client = createClient(
    "https://supabase.example.invalid",
    "fixture-key",
    {
      global: {
        fetch: async (url, init) => {
          if (String(url).includes("/rpc/"))
            calls.push(JSON.parse(String(init?.body)));
          return new Response(
            JSON.stringify(
              String(url).includes("/ct_orders")
                ? { id: "order_fixture", amount: 24000, currency: "usd" }
                : null,
            ),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        },
      },
    },
  );
  let amount = 24000;
  const stripe = new Stripe("sk_test_fixture_not_a_real_key", {
    httpClient: Stripe.createFetchHttpClient(
      async (url) =>
        new Response(
          JSON.stringify(
            String(url).includes("/charges/")
              ? {
                  id: "ch_fixture",
                  payment_intent: "pi_fixture",
                  amount,
                  currency: "usd",
                }
              : {
                  object: "list",
                  has_more: false,
                  data: [
                    { id: "re_settled", status: "succeeded", amount: 8000 },
                    { id: "re_pending", status: "pending", amount: 8000 },
                  ],
                },
          ),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
    ),
  });
  const event = {
    id: "evt_refund_fixture",
    type: "refund.updated",
    livemode: false,
    data: { object: { id: "re_fixture", charge: "ch_fixture" } },
  } as Stripe.Event;
  await processEvent(event, { client, stripe });
  assert.deepEqual(calls, [
    { p_event: "evt_refund_fixture", p_intent: "pi_fixture", p_refunded: 8000 },
  ]);
  amount = 500;
  await assert.rejects(
    processEvent(event, { client, stripe }),
    /Refund payment mismatch/,
  );
  assert.equal(calls.length, 1);
});
