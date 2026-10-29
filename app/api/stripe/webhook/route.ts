import { liveAccount } from "@/lib/platform/live-catalog";
import { dispatchNotifications } from "@/lib/platform/dispatch";
import { failure, HttpError, payments, required } from "@/lib/platform/server";
import { processEvent } from "@/lib/platform/webhook";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(req: Request) {
  try {
    if (Number(req.headers.get("content-length") || 0) > 1000000)
      throw new HttpError(413, "Payload too large.");
    const raw = await req.text();
    if (raw.length > 1000000) throw new HttpError(413, "Payload too large.");
    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new HttpError(400, "Missing Stripe signature.");
    const stripe = payments();
    const secret = required("STRIPE_WEBHOOK_SECRET");
    let event;
    try {
      event = stripe.webhooks.constructEvent(raw, signature, secret);
    } catch {
      throw new HttpError(400, "Invalid webhook signature.");
    }
    const live = /^(sk|rk)_live_/.test(required("STRIPE_SECRET_KEY"));
    if (event.livemode !== live)
      throw new HttpError(400, "Webhook payment mode mismatch.");
    if (live && (await stripe.accounts.retrieveCurrent()).id !== liveAccount)
      throw new HttpError(400, "Webhook payment account mismatch.");
    await processEvent(event);
    dispatchNotifications();
    return Response.json({ received: true });
  } catch (e) {
    return failure(e);
  }
}
