import { after } from "next/server";
import { sendNotifications } from "@/lib/booking/notifications";
import { db, required, verifiedStripe } from "@/lib/booking/server";
import { paidCheckout } from "@/lib/booking/core";
export async function POST(req: Request) {
  try {
    const client = await verifiedStripe();
    const event = client.webhooks.constructEvent(
      await req.text(),
      req.headers.get("stripe-signature") ?? "",
      required("STRIPE_WEBHOOK_SECRET"),
    );
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object;
      const id = session.metadata?.coach_booking_id;
      if (!id) return Response.json({ received: true });
      const d = db();
      const { data: b, error } = await d
        .from("ct_bookings")
        .select("amount")
        .eq("id", id)
        .single();
      if (error || !b) throw new Error("Booking missing");
      if (paidCheckout(session, b.amount)) {
        const { error: confirm } = await d.rpc("ct_confirm", {
          p_event: event.id,
          p_booking: id,
          p_checkout: session.id,
          p_payment:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id,
          p_amount: session.amount_total,
        });
        if (confirm) throw confirm;
        after(async () => {
          try {
            await sendNotifications();
          } catch {
            console.error("Booking notification queued for retry");
          }
        });
      }
    }
    return Response.json({ received: true });
  } catch {
    return Response.json(
      { error: "Webhook processing failed" },
      { status: 400 },
    );
  }
}
