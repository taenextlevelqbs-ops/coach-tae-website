# Calendly-preserving payment release audit — October 29, 2026

## Scheduling and payment ownership

Calendly remains the public private/group scheduler. Homepage, mobile links and `/book` retain the exact existing URLs. This website does not create a Calendly appointment, query Calendly payments, synchronize Calendly availability or import Calendly customers. It has no verified payment/credit redemption bridge into Calendly.

**Unknown hosted fact:** whether each Calendly event currently requires Stripe payment, its connected account, amount, currency, refund/package behavior, or successful payment-before-booking. No claim about these settings can be inferred from a link or from the website's Stripe code. Both destination requests were rejected by this runtime's proxy (CONNECT 403); the actual pages were not reached.

The website has its own Stripe Checkout for native sessions/packages and QB Lab. In Calendly mode (`PLATFORM_BOOKING_ENABLED` not `true`), all four website training products are now refused by the server before any Stripe price/customer/order operation, removed from offered products, and disabled with an explicit explanation. Existing credits/orders are not removed. This prevents selling website credits that cannot be redeemed in Calendly. QB Lab subscriptions remain independent of appointments and retain entitlement/billing checks. No live website payment is enabled by this change.

## Existing account and prices

The user reports the existing CoachTae account `acct_1UVeHrQGpLTTSzQv` and six live prices verified. Their exact IDs remain in `lib/platform/live-catalog.ts`; amounts remain $85/$60/$240/$150/$9.99/$79.99. No product, price, account or appointment was created, changed or deleted. No DMV Attack payment routing was added.

Configuration maps `STRIPE_PRICE_PRIVATE`, `STRIPE_PRICE_GROUP`, `STRIPE_PRICE_PRIVATE_PACK`, `STRIPE_PRICE_GROUP_PACK`, `STRIPE_PRICE_LAB_MONTHLY`, `STRIPE_PRICE_LAB_ANNUAL`. The user-provided **live** IDs are not silently substituted for test IDs. Runtime server-side verification checks the configured Price ID, active product/price, USD amount, one-time vs recurring, exact monthly/yearly interval and quantity. `scripts/check-live-prices.ts` is a separate GET-only audit, not a payment-enablement mechanism.

Remote environment values have not been inspected. Missing workspace bindings do not mean those settings are missing in Vercel production.

## Checkout, customers and fulfillment

- `/api/platform/checkout`: validates authenticated parent, same-origin request, product and request UUID, family/order/booking ownership, eligible reservation and authoritative price. Lab needs published content; duplicate active/pending memberships are rejected. In Calendly mode training purchases are blocked before Stripe is contacted.
- Customer records: `ct_families.stripe_customer_id` is a unique native family association; creation uses an idempotency key tied to the family. No customer is automatically matched or merged by email with a Calendly customer. Customer IDs are not independently separated by test/live mode in the current schema; switching modes must not blindly reuse IDs across modes or accounts. Existing hosted associations remain uninspected and unchanged.
- Checkout mode and amount come from the server; the browser never supplies a charge amount. Stable order-scoped idempotency protects retries. Payment success/cancel return to the trusted `APP_URL` portal. A success URL never fulfills a purchase: portal confirmation/access waits for verified webhook state.
- `/api/stripe/webhook`: requires a valid signature over the raw body using `STRIPE_WEBHOOK_SECRET`; invalid/unsigned requests fail. Current website fulfillment is test-only. Live events are explicitly rejected, not silently acknowledged as fulfilled. The existing live webhook URL therefore must not be certified healthy for live website fulfillment based on these tests. Inspect the existing endpoint's signing secret, event filters, mode and actual delivery logs before production promotion; do not repoint Calendly events or drop signed events to hide failures.
- Checkout fulfillment retrieves authoritative Stripe objects and validates customer, order, Price ID, amount, quantity and currency. Transactional RPCs protect event retries, credits, booking capacity and refunds. Subscription updates use current Stripe state and guarded database updates. Family payment receipts/customer portal use the saved family customer ID.

The audit found Checkout's former opt-in live-key flag inconsistent with test-only webhook fulfillment. The website payment factory now refuses live keys and live activation, aligning both sides until real hosted acceptance and explicit later payment authorization. Calendly's external Stripe integration is untouched.

## Record provenance

Family and coach screens explicitly identify native records. Empty native lists/counts do **not** establish an empty Calendly calendar. The schedule editor warns that its edits affect only native availability/bookings, not Calendly. Native ledgers/payment reports omit Calendly transactions. Family API responses declare `recordSource: native` and `calendlySync: not_connected`. No fabricated Calendly appointment count, revenue or completed session is displayed.

## Hosted acceptance boundary

The actual exposed tool catalog has no callable Vercel/Supabase/Stripe/Resend/Calendly service connector. GitHub repository transport works. Current managed runtime observations show enforced revision 1, no custom destination access, no credential bindings, and no runtime variables. The saved draft's credential entries have no saved values. Supabase/Stripe/Vercel connections available elsewhere in ChatGPT are not accessible through this task's current tools.

The public GitHub checks page for `d8060b5` was inspected through permitted GitHub transport, but exposed no usable preview deployment URL. Live site/service API requests and both Calendly destinations fail at the proxy before reaching their services. No latest-preview page, hosted login, coach edit, QB Lab membership, real test Checkout, webhook delivery, calendar payment or live runtime log has been verified by this task.

The existing draft now includes Calendly destination rules as well as the existing service domains. Saving is confirmed; the configuration tool reports `requires_publish: true`, so it has not activated network access. No new token/account/product is needed or requested by this audit. A credential/network bridge to the already connected services is the specific blocker to completing hosted acceptance and authorized production promotion. Do not claim a successful payment or deploy merely because local tests pass.

## Verification completed for this candidate

- Lint, production webpack build, final TypeScript and whitespace checks passed.
- **68 backend/database/tooling tests passed**, no failures/skips. New tests exercise the actual Checkout handler with a simulated authenticated upstream and show all training products fail in Calendly mode without Stripe/order/customer creation. Payment factory tests refuse live keys and live override flags. Existing transactional capacity, credit, subscription, refund, signature, retry and RLS tests remain passing.
- **51 browser tests passed** in a complete mobile/tablet/desktop run. Includes unchanged Calendly URLs, OTP/session/logout flows, native record provenance, coach authorization, schedule editing, mobile layout and QB Lab. Supabase/Stripe responses are simulated; this is not hosted acceptance.
- Built production artifact smoke: homepage and `/book` preserve both exact Calendly links; all six page routes return 200. Family/admin APIs reject missing auth with 401; unsigned webhook returns 400. Cron without its binding returns 503 (setup incomplete); configured fixture browser tests separately establish unauthorized cron returns 401. No authentication protection was relaxed to hide missing configuration.
- Real requests to the live website, Vercel API and both Calendly destinations were rejected by the runtime proxy with CONNECT 403. No hosted payment, signature delivery, login, customer record, preview READY status or live page behavior was certified. No production promotion or variable change was performed.
