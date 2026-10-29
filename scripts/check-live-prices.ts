/** GET-only audit. Does not change products/prices, create Checkout, charge cards, or enable payments. */
import { liveAccount, livePrices } from "../lib/platform/live-catalog";
import {
  validPrice,
  type ProductKey,
  type PriceShape,
} from "../lib/platform/catalog";
async function main() {
  const key = process.env.STRIPE_LIVE_READ_KEY;
  if (!key || !/^(sk|rk)_live_/.test(key))
    throw new Error(
      "Bind STRIPE_LIVE_READ_KEY with read access to the existing CoachTae account and prices. Live audit not performed.",
    );
  async function get(path: string) {
    const r = await fetch(`https://api.stripe.com/v1/${path}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok)
      throw new Error(
        `Stripe read-only audit returned HTTP ${r.status}. No changes made.`,
      );
    return r.json();
  }
  const account = await get("account");
  if (account.id !== liveAccount)
    throw new Error("Stripe account does not match CoachTae. Audit stopped.");
  let failed = false;
  for (const [name, id] of Object.entries(livePrices)) {
    const price = (await get(
      `prices/${id}?expand%5B%5D=product`,
    )) as PriceShape & {
      livemode: boolean;
      product: { active?: boolean; deleted?: boolean };
    };
    const matches =
      price.livemode &&
      validPrice(name as ProductKey, price) &&
      price.product.active &&
      !price.product.deleted;
    console.log(
      JSON.stringify({
        product: name,
        id,
        amount: price.unit_amount,
        currency: price.currency,
        interval: price.recurring?.interval || null,
        interval_count: price.recurring?.interval_count || null,
        status: matches
          ? "verified live catalog price (payments not enabled)"
          : "MISMATCH — do not activate",
      }),
    );
    if (!matches) failed = true;
  }
  if (failed)
    throw new Error(
      "Existing catalog does not match expected amounts/intervals. No prices were changed; review the membership mapping.",
    );
}
main().catch((e) => {
  console.error(
    e instanceof Error && !/fetch|network/i.test(e.message)
      ? e.message
      : "Stripe read-only audit failed; check authorized access.",
  );
  process.exitCode = 1;
});
