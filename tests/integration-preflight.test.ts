import { test } from "node:test";
import assert from "node:assert/strict";
import Stripe from "stripe";
import { auditTestCatalog } from "../lib/platform/test-catalog-audit";
import { catalog, type ProductKey } from "../lib/platform/catalog";
import { liveAccount } from "../lib/platform/live-catalog";

function fixture(account = liveAccount) {
  const calls: string[] = [];
  const stripe = new Stripe("sk_test_fixture_only", {
    httpClient: Stripe.createFetchHttpClient(async (url, init) => {
      assert.equal(init?.method, "GET");
      calls.push(String(url));
      if (String(url).endsWith("/account"))
        return Response.json({ id: account });
      const data = Object.entries(catalog).map(([key, item]) => ({
        id: `price_${key}`,
        object: "price",
        active: true,
        livemode: false,
        currency: "usd",
        unit_amount: item.amount,
        type: "interval" in item ? "recurring" : "one_time",
        recurring:
          "interval" in item
            ? { interval: item.interval, interval_count: 1 }
            : null,
        product: { id: `prod_${key}`, active: true, name: item.name },
      }));
      return Response.json({ object: "list", has_more: false, data });
    }),
  });
  return { stripe, calls };
}

test("integration preflight rejects another Stripe business before reading its prices", async () => {
  const f = fixture("acct_another_business");
  await assert.rejects(
    auditTestCatalog(f.stripe, {}),
    /CoachTaeAccountMismatch/,
  );
  assert.equal(f.calls.length, 1);
});

test("all six test prices require actual runtime bindings, not merely discoverable candidates", async () => {
  const f = fixture();
  const discovered = await auditTestCatalog(f.stripe, {});
  assert.equal(discovered.blockers.length, 6);
  const env = Object.fromEntries(
    (Object.keys(catalog) as ProductKey[]).map((key) => [
      catalog[key].env,
      `price_${key}`,
    ]),
  );
  assert.deepEqual((await auditTestCatalog(f.stripe, env)).blockers, []);
  env.STRIPE_PRICE_GROUP = "price_live_or_wrong_product";
  assert.equal((await auditTestCatalog(f.stripe, env)).blockers.length, 1);
});
