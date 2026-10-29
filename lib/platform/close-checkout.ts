import "server-only";
import type Stripe from "stripe";
import { checked, db, HttpError, payments } from "./server";
export type CloseServices = {
  client: ReturnType<typeof db>;
  stripe: ReturnType<typeof payments>;
};
async function ownedOrder(
  session: Stripe.Checkout.Session,
  client: CloseServices["client"],
) {
  const id = session.client_reference_id;
  if (!id || !/^[0-9a-f-]{36}$/i.test(id))
    throw new HttpError(400, "Invalid Checkout reference.");
  const order = checked(
    await client.from("ct_orders").select("*").eq("id", id).maybeSingle(),
  );
  if (!order)
    throw new HttpError(
      503,
      "Checkout order is not available yet. Retry required.",
    );
  const family = checked(
    await client
      .from("ct_families")
      .select("stripe_customer_id")
      .eq("id", order.family_id)
      .single(),
  );
  const customer =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;
  if (
    customer !== family?.stripe_customer_id ||
    (order.session_id && order.session_id !== session.id)
  )
    throw new HttpError(400, "Checkout ownership mismatch.");

  return order;
}
export async function closeUnpaidCheckout(
  session: Stripe.Checkout.Session,
  event: string,
  status: "cancelled" | "expired" | "failed",
  { client }: CloseServices,
) {
  if (
    session.metadata?.platform !== "coach-tae" ||
    session.payment_status === "paid"
  )
    return false;
  if (
    session.status !== "expired" &&
    !(
      status === "failed" &&
      session.status === "complete" &&
      session.payment_status === "unpaid"
    )
  )
    throw new HttpError(
      409,
      "Checkout is not safely closed. Refresh payment status.",
    );
  const order = await ownedOrder(session, client);
  if (!order.session_id) {
    checked(
      await client
        .from("ct_orders")
        .update({ session_id: session.id })
        .eq("id", order.id)
        .is("session_id", null),
    );
  }
  return checked(
    await client.rpc("ct_close_checkout", {
      p_event: event,
      p_order: order.id,
      p_session: session.id,
      p_status: status,
    }),
  ) as boolean;
}
export async function expireAndCloseCheckout(
  id: string,
  event: string,
  status: "cancelled" | "failed",
  services: CloseServices,
) {
  let session = await services.stripe.checkout.sessions.retrieve(id);
  if (
    session.metadata?.platform !== "coach-tae" ||
    session.payment_status === "paid"
  )
    return false;
  const order = await ownedOrder(session, services.client);
  if (order.status !== "pending") return false;
  if (session.status === "open") {
    try {
      session = await services.stripe.checkout.sessions.expire(id);
    } catch (error) {
      session = await services.stripe.checkout.sessions.retrieve(id);
      if (session.status === "open") throw error;
    }
  }
  if (
    session.payment_status === "paid" ||
    (session.status === "complete" && status !== "failed")
  )
    return false;
  return closeUnpaidCheckout(session, event, status, services);
}
