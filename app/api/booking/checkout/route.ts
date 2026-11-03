import {
  publicBookingEnabled,
  db,
  failure,
  required,
  sameOrigin,
  verifiedStripe,
} from "@/lib/booking/server";
import { validateParent } from "@/lib/booking/core";
export async function POST(req: Request) {
  try {
    publicBookingEnabled();
    sameOrigin(req);
    const body = await req.json();
    const parent = validateParent(body);
    if (
      typeof body.session !== "string" ||
      !/^[\da-f-]{36}$/.test(body.session)
    )
      throw new Error("Invalid session");
    const d = db();
    const client = await verifiedStripe();
    const { data: slot, error: se } = await d
      .from("ct_sessions")
      .select("*,ct_session_types(*)")
      .eq("id", body.session)
      .single();
    if (se || !slot) throw new Error("Unavailable");
    let type = slot.ct_session_types;
    if (body.offer) {
      const { data: offer, error } = await d
        .from("ct_offers")
        .select("*")
        .eq("id", body.offer)
        .eq("session_type_id", slot.session_type_id)
        .eq("active", true)
        .single();
      if (error || !offer) throw new Error("Invalid package");
      type = offer;
    }
    const price = await client.prices.retrieve(type.stripe_price_id);
    if (
      !price.active ||
      price.currency !== "usd" ||
      price.unit_amount !== type.amount ||
      price.recurring
    )
      throw new Error("Price mismatch");
    const { data: hold, error } = await d.rpc("ct_hold", {
      p_session: body.session,
      p_parent: parent.parent,
      p_athlete: parent.athlete,
      p_email: parent.email,
      p_phone: parent.phone,
      p_offer: body.offer || null,
    });
    if (error || !hold || hold.amount !== price.unit_amount)
      throw new Error("Slot no longer available");
    // An uncertain Stripe response retains the hold until expiry; never release a possibly payable checkout.
    const checkout = await client.checkout.sessions.create(
      {
        mode: "payment",
        customer_creation: "always",
        customer_email: parent.email,
        payment_intent_data: { receipt_email: parent.email },
        line_items: [{ price: price.id, quantity: 1 }],
        expires_at: Math.floor(Date.now() / 1000) + 1800,
        metadata: { coach_booking_id: hold.id },
        success_url: `${required("BOOKING_SITE_URL")}/book?payment=submitted`,
        cancel_url: `${required("BOOKING_SITE_URL")}/book?payment=cancelled`,
      },
      { idempotencyKey: `booking-${hold.id}` },
    );
    const { error: save } = await d
      .from("ct_native_bookings")
      .update({ stripe_session_id: checkout.id })
      .eq("id", hold.id);
    if (save) {
      await client.checkout.sessions.expire(checkout.id);
      throw new Error("Unable to save checkout");
    }
    return Response.json({ url: checkout.url });
  } catch (e) {
    return failure(e);
  }
}
