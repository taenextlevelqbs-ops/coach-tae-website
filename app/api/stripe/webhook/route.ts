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
    await processEvent(event);
    dispatchNotifications();
    return Response.json({ received: true });
  } catch (e) {
    return failure(e);
  }
}
