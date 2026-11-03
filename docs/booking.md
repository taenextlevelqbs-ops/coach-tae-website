# Coach Tae native booking rollout

Implementation is in this checkout; production integration has not been verified or deployed. Existing Calendly links remain the default. Do not set the release flag in production until the checks below pass. No production migrations have been applied.

## Secure configuration

Reuse the `coach-tae-website` Vercel project and its existing bindings. Never paste keys into source, logs, chat, or this document. No additional Stripe account is needed.

- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`: existing Coach Tae bindings. Every checkout and webhook checks the current Stripe account against `acct_1UVeHrQGpLTTSzQv`.
- `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`: existing Supabase project. Service-role credentials stay server-side. `SUPABASE_URL` is also accepted.
- `RESEND_API_KEY` and `EMAIL_FROM`: existing Resend bindings. `BOOKING_FROM_EMAIL` can override the sender.
- `COACH_SUPABASE_USER_ID`: the UUID of a verified coach user in this existing project's Supabase Auth. Do not infer an admin identity from an unverified email. Password sign-in authorizes this exact UUID only. Coach sessions expire with the Supabase token; signing in again is required.
- `COACH_NOTIFICATION_EMAIL`: verified coach notification address, still to be supplied.
- `BOOKING_SITE_URL`: defaults to `https://coachtaeqb.com`; set to the preview origin when testing previews. Mutations enforce same-origin requests.
- `CRON_SECRET`: scheduler bearer token. Configure a secure scheduler to GET `/api/booking/notifications` every minute (or at the supported deployment-plan interval). The worker retries pending notifications and queues reminders for appointments within 24 hours. This endpoint is not public. Webhooks and coach changes also attempt immediate delivery after responding.
- `NEXT_PUBLIC_BOOKING_ENABLED=true`: explicit release gate. Leave unset/false in production until live verification. Rebuild when changing it. A protected preview can enable it for end-to-end verification.

Parent package redemption uses Supabase email OTP. Configure the existing project's email template to include `{{ .Token }}` and verify email delivery, rate limits and abuse protection. A parent must verify the purchase email before viewing or redeeming credits. Coach privileges are never granted through parent sign-in.

## Inspect before applying

An authorized operator must first inventory the existing Supabase schema, migrations, RLS policies, Auth settings and backups. There are no previous Supabase migrations in this checkout and no SQL credentials were available locally. Review `supabase/migrations/202611020001_booking.sql` against that inventory. It creates only `ct_` tables and associated functions, enables RLS, denies anonymous/authenticated table access, and grants narrowly scoped RPC execution to the server service role. Do not replace existing tables, records or policies. Apply through the existing project's supported migration workflow only after review.

With securely injected project variables, `npx tsx scripts/verify-booking.ts` performs a read-only account/price inventory and count-only application-table checks. It does not print secret values, retrieve athlete records, apply migrations, activate offers, charge customers, or prove email delivery. SQL access is still required to inspect existing policies.

Verify each existing Stripe Price ID, owning product, active status, USD amount and recurrence. Populate `ct_session_types` using verified one-time prices: private $75 (7500 cents), group $50 (5000 cents), normally 60 minutes. Keep `active=false` until reviewed. Add verified three-session prices in `ct_offers` with `credits=3`, the corresponding training type, and actual verified total. Do not invent Price IDs. Checkout retrieves the selected price again and requires an exact currency/amount match and a non-recurring price.

The existing homepage advertises $85 private, $60 group, and a $240 three-session package. The requested native singles are $75/$50. The release flag switches single-session homepage prices with the links. Confirm the existing three-session Stripe total before activating its offer. No package is seeded or repriced automatically.

Membership products are intentionally not sold through the one-time checkout. Existing membership prices, subscriber entitlement rules, renewal/cancellation semantics and credit rollover have not been verified. Their integration remains outstanding if these products apply; do not reinterpret recurring prices as single sessions or create replacement subscriptions. Existing subscribers and Stripe subscriptions are untouched.

## Scheduling behavior

`/coach/schedule` is the private authoritative calendar. The coach can create private/group sessions, set capacities, materialize up to 12 weeks of recurring Eastern-time sessions, edit unused availability, close sales, delete unused sessions, block days, and reschedule/cancel paid appointments. Calendar views and contact details work at mobile widths. Recurrence is intentionally bounded; extend the next period through the dashboard. Editing recurring hours does not rewrite already-published sessions; close unused sessions and create the replacement hours.

All session intervals use a database exclusion constraint to prevent coach overlap. Row locks serialize capacity checks, temporary holds, confirmation and rescheduling. Group bookings share one session with multiple seats. Checkout lasts 30 minutes; the capacity hold has a one-minute processing grace period. Expired holds are ignored publicly and retired transactionally on the next booking attempt. A late payment is recorded for manual coach review without displacing another athlete. A cancelled booking is never restored by a repeated webhook.

Changing availability never cancels a paid appointment. Sessions with booking history cannot change time or type through an availability edit. Move individual appointments with the reschedule action. Cancellation does not automatically refund payments or restore package credits: settle refunds/credits deliberately in the original account, under the coach's policy. Training location and cancellation/refund terms must be agreed with Coach Tae before launch; none were invented.

Three-session purchases book the first appointment and grant two credits only after verified payment. Email-verified parents can atomically redeem remaining credits for the same session type. Single-session purchases grant no credits. New athlete details are collected per appointment; no DOB or medical data is collected.

Notification records capture immutable appointment snapshots. Resend uses a stable idempotency key for retry safety within its provider retention window. Delivery is at least once: a crash after send outside that retention window can duplicate an email. Monitor pending notifications and delivery failures. No email success is assumed from a paid booking. ICS attachments use a stable appointment UID; cancellation notices currently use plain text and reschedule invitations update the same UID. Stripe reference and amount are included in paid confirmation emails; enable Stripe customer receipts in the existing account if formal Stripe receipts are required.

## Validation and cutover

1. `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
2. The tests run an isolated PostgreSQL engine with the actual migration: capacity competition, overlaps, hold expiry, verified-payment transitions, event retries, RLS denial, safe closing/deletion, rescheduling, cancellation, package grants/redemption and notification snapshots. Timezone tests include spring gaps and autumn ambiguities. They do not establish production database or external-service health.
3. Configure a protected preview with existing-project test bindings. Verify coach authorization and rejection of unverified users, both calendar views at iPhone widths, Eastern recurring hours across DST, blocks and rescheduling. Confirm public APIs never expose contacts or athletes.
4. Register `/api/booking/webhook` on the correct Coach Tae Stripe account for `checkout.session.completed` and `checkout.session.async_payment_succeeded`; use the endpoint's actual signing secret. Test payment completion, bad signatures, duplicate delivery, abandoned checkout, simultaneous purchases of the last seat, delayed payments and package redemption. Never use DMV Attack account credentials. No checkout success redirect alone confirms a booking.
5. Verify real Resend delivery to the parent and coach, calendar attachments, reschedule/cancellation notices, notification retry and scheduled reminders. Inspect provider delivery events as well as the outbox.
6. Recheck the production account, Price IDs, database RLS and exact coach identity using secure Vercel configuration. Enable the release flag only after end-to-end checks pass, deploy, and perform an authorized production smoke booking. The flag switches existing booking CTAs to `/book`; turning it off returns them to Calendly while webhook processing remains available for in-flight payments.

No deployment or live charge has been performed by this implementation task. Required external access: secure configuration for Vercel project `coach-tae-website`, authorized Supabase schema/policy inspection and migration execution, the verified coach user/notification address, correct Stripe price mappings and webhook registration, and verified Resend delivery plus a scheduler. Membership semantics and training location/refund policy remain business decisions where applicable.
