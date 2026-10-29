import "server-only";
import { closeUnpaidCheckout, expireAndCloseCheckout } from "./close-checkout";
import type Stripe from "stripe";
import { catalog, isProductKey, validPrice } from "./catalog";
import { checked, db, HttpError, payments } from "./server";

export type WebhookServices = {
  client: ReturnType<typeof db>;
  stripe: ReturnType<typeof payments>;
};
export async function processEvent(
  event: Stripe.Event,
  services: WebhookServices = { client: db(), stripe: payments() },
) {
  if (event.livemode)
    throw new HttpError(400, "Live payment processing is disabled.");
  const { client, stripe } = services;
  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = await stripe.checkout.sessions.retrieve(
      event.data.object.id,
      { expand: ["line_items", "payment_intent.latest_charge"] },
    );
    if (
      session.metadata?.platform !== "coach-tae" ||
      session.payment_status !== "paid"
    )
      return;
    let order = checked(
      await client
        .from("ct_orders")
        .select("*")
        .eq("session_id", session.id)
        .maybeSingle(),
    );
    // Recover the binding if Stripe succeeded but the checkout response's DB update failed.
    if (
      !order &&
      session.client_reference_id &&
      /^[0-9a-f-]{36}$/i.test(session.client_reference_id)
    ) {
      order = checked(
        await client
          .from("ct_orders")
          .select("*")
          .eq("id", session.client_reference_id)
          .maybeSingle(),
      );
      if (order?.session_id && order.session_id !== session.id)
        throw new HttpError(400, "Checkout is already bound.");
    }
    // A checkout may race the DB write after Stripe creation. Retry rather than acknowledge it.
    if (!order)
      throw new HttpError(503, "Checkout order is not yet available.");
    const key = order.product_key;
    if (!isProductKey(key))
      throw new HttpError(400, "Unknown checkout product.");
    const item = session.line_items?.data;
    const family = checked(
      await client
        .from("ct_families")
        .select("stripe_customer_id")
        .eq("id", order.family_id)
        .single(),
    );
    if (
      session.customer !== family!.stripe_customer_id ||
      session.client_reference_id !== order.id ||
      item?.length !== 1 ||
      item[0].price?.id !== order.price_id ||
      item[0].quantity !== 1 ||
      session.currency !== "usd" ||
      session.amount_total !== catalog[key].amount
    )
      throw new HttpError(400, "Checkout does not match the saved order.");
    if (!order.session_id) {
      checked(
        await client
          .from("ct_orders")
          .update({ session_id: session.id })
          .eq("id", order.id)
          .is("session_id", null),
      );
      const bound = checked(
        await client
          .from("ct_orders")
          .select("session_id")
          .eq("id", order.id)
          .single(),
      );
      if (bound?.session_id !== session.id)
        throw new HttpError(409, "Checkout binding changed.");
    }
    const intent =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id || null;
    checked(
      await client.rpc("ct_fulfill", {
        p_event: event.id,
        p_order: order.id,
        p_session: session.id,
        p_intent: intent,
        p_amount: session.amount_total,
        p_currency: session.currency,
      }),
    );
    const charge =
      typeof session.payment_intent === "object" && session.payment_intent
        ? session.payment_intent.latest_charge
        : null;
    if (
      intent &&
      charge &&
      typeof charge !== "string" &&
      charge.amount_refunded > 0
    )
      await reconcileCharge(`checkout-refund:${event.id}`, charge, services);
    if (typeof session.subscription === "string")
      await syncSubscription(event, session.subscription, services);
  } else if (
    event.type === "checkout.session.expired" ||
    event.type === "checkout.session.async_payment_failed"
  ) {
    const session = await stripe.checkout.sessions.retrieve(
      event.data.object.id,
    );
    if (
      session.metadata?.platform !== "coach-tae" ||
      session.payment_status === "paid"
    )
      return;
    await closeUnpaidCheckout(
      session,
      event.id,
      event.type === "checkout.session.expired" ? "expired" : "failed",
      services,
    );
  } else if (event.type === "payment_intent.payment_failed") {
    const intent = await stripe.paymentIntents.retrieve(event.data.object.id);
    const id = intent.metadata.order_id;
    if (
      !id ||
      !/^[0-9a-f-]{36}$/i.test(id) ||
      !["requires_payment_method", "canceled"].includes(intent.status)
    )
      return;
    const order = checked(
      await client
        .from("ct_orders")
        .select("id,session_id,status")
        .eq("id", id)
        .maybeSingle(),
    );
    if (!order) return;
    if (order.status !== "pending") return;
    if (!order.session_id)
      throw new HttpError(503, "Checkout is not yet bound; retry required.");
    await expireAndCloseCheckout(
      order.session_id,
      event.id,
      "failed",
      services,
    );
  } else if (
    [
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
    ].includes(event.type)
  ) {
    await syncSubscription(
      event,
      (event.data.object as Stripe.Subscription).id,
      services,
    );
  } else if (
    [
      "invoice.paid",
      "invoice.payment_failed",
      "invoice.payment_action_required",
    ].includes(event.type)
  ) {
    const invoice = event.data.object as Stripe.Invoice;
    const sub = invoice.parent?.subscription_details?.subscription;
    if (sub) {
      await syncSubscription(
        event,
        typeof sub === "string" ? sub : sub.id,
        services,
      );
      const current = await stripe.invoices.retrieve(invoice.id!);
      const customerId =
        typeof current.customer === "string"
          ? current.customer
          : current.customer?.id;
      const family = checked(
        await client
          .from("ct_families")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle(),
      );
      const subscription = await stripe.subscriptions.retrieve(
        typeof sub === "string" ? sub : sub.id,
      );
      if (
        family &&
        subscription.items.data.some((i) =>
          [
            process.env.STRIPE_PRICE_LAB_MONTHLY,
            process.env.STRIPE_PRICE_LAB_ANNUAL,
          ].includes(i.price.id),
        )
      )
        checked(
          await client.from("ct_invoices").upsert({
            invoice_id: current.id,
            family_id: family.id,
            amount_paid: current.amount_paid,
            currency: current.currency,
            status: current.status,
            hosted_invoice_url: current.hosted_invoice_url,
            created_at: new Date(current.created * 1000).toISOString(),
          }),
        );
    }
  } else if (
    [
      "charge.refunded",
      "refund.created",
      "refund.updated",
      "refund.failed",
    ].includes(event.type)
  ) {
    const object = event.data.object;
    const chargeId =
      event.type === "charge.refunded"
        ? (object as Stripe.Charge).id
        : (object as Stripe.Refund).charge;
    const id = typeof chargeId === "string" ? chargeId : chargeId?.id;
    if (!id) return;
    const charge = await stripe.charges.retrieve(id);
    await reconcileCharge(event.id, charge, services);
  }
}
async function reconcileCharge(
  eventId: string,
  charge: Stripe.Charge,
  services: WebhookServices,
) {
  const { client, stripe } = services;
  if (typeof charge.payment_intent !== "string") return;
  const order = checked(
    await client
      .from("ct_orders")
      .select("id,amount,currency")
      .eq("payment_intent_id", charge.payment_intent)
      .maybeSingle(),
  );
  if (!order) {
    const intent = await stripe.paymentIntents.retrieve(charge.payment_intent);
    const localId = intent.metadata.order_id;
    if (localId && /^[0-9a-f-]{36}$/i.test(localId)) {
      const pending = checked(
        await client
          .from("ct_orders")
          .select("id")
          .eq("id", localId)
          .maybeSingle(),
      );
      if (pending)
        throw new HttpError(
          503,
          "Refund arrived before fulfillment; retry required.",
        );
    }
    return;
  }
  if (charge.amount !== order.amount || charge.currency !== order.currency)
    throw new HttpError(400, "Refund payment mismatch.");
  const refunds = await stripe.refunds
    .list({ charge: charge.id, limit: 100 })
    .autoPagingToArray({ limit: 1000 });
  const settled = refunds
    .filter((r) => r.status === "succeeded")
    .reduce((sum, r) => sum + r.amount, 0);
  if (settled > 0)
    checked(
      await client.rpc("ct_reconcile_refund", {
        p_event: eventId,
        p_intent: charge.payment_intent,
        p_refunded: settled,
      }),
    );
}

async function syncSubscription(
  event: Stripe.Event,
  id: string,
  services: WebhookServices,
) {
  const { client, stripe } = services;
  // Fetch Stripe's current object, rather than replaying stale embedded event state.
  const sub = await stripe.subscriptions.retrieve(id);
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const family = checked(
    await client
      .from("ct_families")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle(),
  );
  if (!family) return; // Unrelated subscriptions in the same Stripe account.
  const accepted = [
    process.env.STRIPE_PRICE_LAB_MONTHLY,
    process.env.STRIPE_PRICE_LAB_ANNUAL,
  ].filter(Boolean);
  const item = sub.items.data[0];
  const key =
    item?.price.id === process.env.STRIPE_PRICE_LAB_MONTHLY
      ? "lab_monthly"
      : "lab_annual";
  const eligible =
    sub.items.data.length === 1 &&
    accepted.includes(item.price.id) &&
    item.quantity === 1 &&
    validPrice(key, item.price);
  if (!eligible) {
    const existing = checked(
      await client
        .from("ct_memberships")
        .select("subscription_id")
        .eq("subscription_id", sub.id)
        .maybeSingle(),
    );
    if (existing)
      checked(
        await client.rpc("ct_sync_membership", {
          p_event: `subscription:${event.id}`,
          p_family: family.id,
          p_subscription: sub.id,
          p_status: "unpaid",
          p_until: new Date().toISOString(),
          p_cancel: sub.cancel_at_period_end,
          p_created: event.created,
        }),
      );
    return;
  }
  const periodEnd = sub.items.data[0].current_period_end;
  checked(
    await client.rpc("ct_sync_membership", {
      p_event: `subscription:${event.id}`,
      p_family: family.id,
      p_subscription: sub.id,
      p_status: sub.status,
      p_until: new Date(periodEnd * 1000).toISOString(),
      p_cancel: sub.cancel_at_period_end,
      p_created: event.created,
    }),
  );
}
