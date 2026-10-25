import Stripe from "stripe";
import { AccountError } from "../accounts/http";
export function billingConfig(
  env: Record<string, string | undefined> = process.env,
) {
  if (
    env.QB_LAB_BILLING_STAGE !== "synthetic-test" ||
    env.VERCEL_ENV === "production"
  )
    return null;
  if (
    !env.QB_LAB_STRIPE_SECRET_KEY?.startsWith("sk_test_") ||
    !/^price_[A-Za-z0-9]+$/.test(env.QB_LAB_STRIPE_MONTHLY_PRICE_ID ?? "")
  )
    return null;
  return {
    secret: env.QB_LAB_STRIPE_SECRET_KEY,
    price: env.QB_LAB_STRIPE_MONTHLY_PRICE_ID!,
  };
}
/** Called only after verified adult/guardian membership and athlete RLS checks. Never accepts a client price/customer/role. */
export async function monthlyCheckout(
  input: { account: string; athlete: string; attempt: string; origin: string },
  config: NonNullable<ReturnType<typeof billingConfig>>,
) {
  const stripe = new Stripe(config.secret, {
    maxNetworkRetries: 1,
    timeout: 10000,
  });
  const price = await stripe.prices.retrieve(config.price);
  if (
    price.livemode ||
    !price.active ||
    price.type !== "recurring" ||
    price.recurring?.interval !== "month" ||
    price.recurring.interval_count !== 1 ||
    price.currency !== "usd" ||
    !price.unit_amount ||
    price.unit_amount <= 0 ||
    price.transform_quantity ||
    price.billing_scheme !== "per_unit" ||
    price.recurring.usage_type !== "licensed"
  )
    throw new AccountError(503, "MONTHLY_TEST_PRICE_REQUIRED");
  const session = await stripe.checkout.sessions.create(
    {
      mode: "subscription",
      line_items: [{ price: price.id, quantity: 1 }],
      client_reference_id: input.account,
      metadata: { account_id: input.account, athlete_id: input.athlete },
      subscription_data: {
        metadata: { account_id: input.account, athlete_id: input.athlete },
      },
      success_url: `${input.origin}/qb-lab/access?checkout=returned`,
      cancel_url: `${input.origin}/qb-lab/access`,
    },
    {
      idempotencyKey: `qb-monthly:${input.account}:${input.athlete}:${input.attempt}`,
    },
  );
  if (
    session.livemode ||
    !session.url ||
    new URL(session.url).origin !== "https://checkout.stripe.com"
  )
    throw new AccountError(503, "CHECKOUT_UNAVAILABLE");
  // A redirect/session creation grants no entitlement. Only a durable verified webhook may do so.
  return { url: session.url };
}
export interface SubscriptionInbox {
  /** Persist minimal verified event atomically, deduplicate event.id, then reconcile current provider state. Never trust event delivery order. */
  accept(event: Stripe.Event): Promise<void>;
}
export async function receiveStripeEvent(
  raw: string,
  signature: string,
  webhookSecret: string,
  sink: SubscriptionInbox,
  nowSeconds?: number,
) {
  if (
    !webhookSecret.startsWith("whsec_") ||
    new TextEncoder().encode(raw).byteLength > 65536 ||
    signature.length > 2048
  )
    throw new Error("Invalid webhook envelope");
  const event = Stripe.webhooks.constructEvent(
    raw,
    signature,
    webhookSecret,
    300,
    undefined,
    nowSeconds === undefined ? undefined : nowSeconds * 1000,
  );
  if (event.livemode) throw new Error("Live billing disabled");
  if (
    ![
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
      "invoice.paid",
      "invoice.payment_failed",
    ].includes(event.type)
  )
    return { accepted: false };
  await sink.accept(event); // Must durably commit before acknowledging; failure must cause provider retry.
  return { accepted: true };
}
