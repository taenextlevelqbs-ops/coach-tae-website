import type Stripe from "stripe";
import type { ProductKey } from "./catalog";
/** Stable parameters are essential: retries must reuse the same Stripe idempotency key AND body. */
export function checkoutParams(input: {
  id: string;
  customer: string;
  price: string;
  product: ProductKey;
  origin: string;
  createdAt: string;
}): Stripe.Checkout.SessionCreateParams {
  const subscription = input.product.startsWith("lab_");
  return {
    customer: input.customer,
    client_reference_id: input.id,
    metadata: { platform: "coach-tae", order_id: input.id },
    mode: subscription ? "subscription" : "payment",
    allowed_payment_method_types: ["card"],
    line_items: [{ price: input.price, quantity: 1 }],
    success_url: `${input.origin}/portal?checkout=complete`,
    cancel_url: `${input.origin}/portal?checkout=cancelled`,
    expires_at: Math.floor(Date.parse(input.createdAt) / 1000) + 1860,
    allow_promotion_codes: false,
    adaptive_pricing: { enabled: false },
    automatic_tax: { enabled: false },
    ...(subscription
      ? { subscription_data: { metadata: { order_id: input.id } } }
      : {
          payment_intent_data: { metadata: { order_id: input.id } },
          invoice_creation: { enabled: true },
        }),
  };
}
