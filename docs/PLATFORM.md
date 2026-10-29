# Coach Tae platform implementation and release runbook

The existing Next.js 16 / React 19 / Tailwind website is preserved. The checkout contained no Supabase migrations, Stripe configuration, Vercel project binding, service credentials, or Price IDs when implementation began. No hosted schema was accessible for inspection. No remote migration, deployment, live payment, or production configuration change has been performed. The integration preflight was rerun for the final-integration request and still found no service bindings; see `docs/INTEGRATION-STATUS.json`.

## What is implemented

- `/book`: mobile calendar with local-time display, private and group sessions, family athlete selection, transactional credit redemption or paid reservation, policy disclosure, and Calendly fallback.
- `/portal`: email-code parent sign-in, multiple athletes, separate private/group balances, confirmed bookings and history, cancellations and rescheduling, package purchases, payment records and Stripe receipts, subscription status and Customer Portal.
- `/lab`: membership access based on current Stripe status and paid-through date, coach-published lessons and quizzes, server grading, athlete progress. The original curriculum now includes 41 lessons, approximately 8,600 words, scenario questions with explanations, schematic diagrams, beginner/intermediate/advanced paths, and progress-based achievements. Membership checkout is rejected while the library is empty. Content is seeded by migration 003 and remains editable in the coach dashboard; no videos, testimonials, certifications or unearned achievements are claimed.
- `/coach/schedule`: dedicated visual month calendar in America/New_York with automatic DST conversion, multiple recurring windows per day, multi-day weekly windows, one-time sessions, inclusive vacation/date blocks, capacity, policies, location, and coach rescheduling/cancellation. Changes publish immediately; booked slots survive edits.
- `/coach`: athlete directory, recorded payments, subscription invoices/renewals, credit and refund-recovery balances, memberships, visual quiz/content editor, and retry queue. Reports are explicitly bounded to 1,000 rows per dataset; they are not complete accounting statements for larger datasets.
- Server Checkout, exact test Price validation, signed raw-body webhooks, transactionally idempotent fulfillment, and an outbox for notifications, reminders, and automatic late-payment refunds.

The six prices must be discovered from your Stripe test account and supplied in configuration. None were invented. Each Checkout request retrieves its configured Price and checks active product, USD currency, exact amount, and one-time or monthly/annual interval. Private $85, group $60, three private $240, three group $150, monthly $9.99, annual $79.99.

## Local workflow

Use the existing isolated checkout; do not create another worktree unless requested.

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build -- --webpack
npm run dev -- --webpack
```

Node 24 was used. The webpack flag avoids this cloud runtime's Turbopack worker-port restriction. Command sandbox restrictions may require the supported escalation flow for network access, local ports, build subprocesses and PostgreSQL tests. Never disable TLS verification or bypass the network proxy.

`npm test` starts a disposable PostgreSQL cluster from the locked `embedded-postgres` package under a temporary directory, creates a minimal `auth.users`/`auth.uid()`/role fixture, applies the actual migration, opens independent SQL connections for concurrency tests, and removes the cluster afterwards. It never connects to your Supabase project. Other tests use mock HTTP responses with the actual Stripe and Supabase SDKs.

```sh
npx playwright install --with-deps chromium
npm run test:e2e
```

Playwright uses system Chromium when installed, otherwise its bundled browser. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to override. It starts a local test server with intentionally fake configuration, exercises 375px, 820px and 1440px layouts, and uses mock family/service fixtures for signed-in UI tests. It also sends real unauthenticated HTTP requests to check authorization, origin, webhook and cron rejection. These tests do **not** certify hosted Supabase Auth delivery, real Stripe Checkout, provider email delivery, Vercel cron, or actual browser-to-database integration. Fixture athlete data and lesson text exist only under `tests/`.

CI is included in `.github/workflows/platform.yml`. No deployment action is configured.

## Required service configuration

Copy names from `docs/platform.env.example`; enter actual secrets securely in local ignored `.env.local` or Vercel **preview/staging** settings. Never put a service-role key in a `NEXT_PUBLIC_` variable. Production Supabase keys are not necessary for staging; use an isolated staging project or Supabase branch.

| Configuration                                               | Purpose                                                                                                                                   |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `APP_URL`                                                   | Exact trusted origin, HTTPS on hosted deployments; Checkout, email and Customer Portal return URLs; CSRF origin validation                |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser Auth against the selected staging project                                                                                         |
| `SUPABASE_SERVICE_ROLE_KEY`                                 | Server-only database access; API handlers verify the user's bearer token with Supabase Auth and enforce family ownership/coach membership |
| `STRIPE_SECRET_KEY`                                         | Stripe **test** secret or restricted test key with needed permissions                                                                     |
| `STRIPE_WEBHOOK_SECRET`                                     | Signing secret for this deployment's test webhook endpoint                                                                                |
| Six `STRIPE_PRICE_*` variables                              | Actual test Price IDs for the six exact catalog entries                                                                                   |
| `RESEND_API_KEY`, `EMAIL_FROM`                              | Email provider and verified sending domain/address                                                                                        |
| `CRON_SECRET`                                               | Strong random secret sent as `Authorization: Bearer ...` to `/api/jobs`                                                                   |
| `COACH_NOTIFICATION_EMAIL`                                  | Optional coach copies of confirmations, cancellations, payments and subscription updates                                                  |
| `PLATFORM_BOOKING_ENABLED`                                  | Default `false`; preserves all original Calendly booking links. Enable only in staging for validation                                     |

For cloud execution, allow the selected Supabase project's hostname, `api.stripe.com`, and `api.resend.com` through environment network settings when configuring those services. Existing npm/GitHub package access is sufficient for local tests. No account API keys or bindings were available during implementation. `npm run check:integrations` performs read-only discovery when bindings exist and writes a secret-free status report; absent bindings fail the check rather than reporting a pass. It lists matching existing Stripe test prices without creating products, checks staging schema columns and anonymous read denial, checks email-domain status without sending messages, and verifies the existing Vercel project domain. Account reads do not prove Checkout, email delivery or hosted acceptance. For this cloud runtime, run with `NODE_USE_ENV_PROXY=1` on Node 24 when service traffic needs the configured proxy; retain the inherited CA trust.

## Safe database setup

1. Inspect/export your actual Supabase schema and migration history first. The repository has no prior schema; the remote schema remains unverified. Confirm there are no existing `ct_*` objects and review the migration against your backup/staging branch. Do not run the file over an unknown production project.
2. Apply all four ordered SQL files under `supabase/migrations/` to staging through your existing migration workflow or the Supabase SQL editor. Migration 001 creates isolated prefixed objects; 002 extends those objects for windows, learning metadata and nonnegative credit recovery; 003 inserts the original curriculum without overwriting existing coach edits; 004 adds cumulative partial-refund reconciliation. Each is transactional, preserves existing application tables/auth policies, and must be checked against actual hosted migration history before applying. Normal migration history must prevent applying it twice.
3. Confirm every `ct_*` table has RLS enabled, anon has no table access, and authenticated clients cannot write tables or execute mutation functions. Families may read only their own records. Premium lesson bodies and correct quiz answers are served through the entitled API; direct browser lesson reads are coach-only. Service-role credentials must remain backend-only.
4. In Supabase Auth, enable email OTP, configure your real SMTP provider, site origin and allowed redirects. The email template must show `{{ .Token }}`; the interface verifies the numeric email code directly and does not rely on a magic-link callback route. Configure rate limits/CAPTCHA and email deliverability for your expected traffic before release.
5. Sign in with Coach Tae's actual account, then add that existing Auth user ID to `ct_coaches` using the privileged SQL editor:

```sql
-- Substitute the verified coach Auth user UUID; never use user-editable metadata for roles.
insert into public.ct_coaches(user_id) values ('<verified-coach-auth-user-uuid>');
```

6. Sign in at `/coach`, set the real training location, timezone, notice/cancellation/reschedule policies and weekly rules, and publish the next 60 days. There is intentionally no invented availability. Review and adapt the seeded original lessons before opening real membership sales; the coach editor supports lesson text, category, topic, level, diagram, questions, choices, correct answers, explanations and publication status.

## Stripe test setup and acceptance

Configure a test webhook at `/api/stripe/webhook` for:

- `checkout.session.completed`, `checkout.session.async_payment_succeeded`
- `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
- `invoice.paid`, `invoice.payment_failed`, `invoice.payment_action_required`
- `charge.refunded`, `refund.created`, `refund.updated`, `refund.failed`

The installed Stripe SDK pins its API version. Configure the webhook destination using that same API version (see `node_modules/stripe/esm/apiVersion.js`) and validate actual test events. Unsupported/unrelated account events are acknowledged without affecting families. Failed fulfillment returns non-2xx so Stripe retries. The event record, credits, booking confirmation and outbox entries commit together; duplicate event IDs and separate duplicate completion events cannot grant credits twice.

Enable Stripe Customer Portal in test mode. Limit plan changes to the two verified QB Lab prices and configure end-of-period cancellation, payment-method updates and invoices. Enable Stripe payment receipt emails and invoice emails. The application also queues a payment confirmation and links to the hosted invoice/receipt. A cancellation at period end preserves access while Stripe remains active and the paid-through date is in the future. `past_due`, `unpaid`, `incomplete`, `paused`, cancelled, or expired access is denied. Current Stripe subscription objects are retrieved when processing events; event timestamps prevent older deliveries overwriting newer state. A switched subscription that no longer matches the configured Lab prices loses entitlement. Only one pending or active Lab subscription is allowed per family through this platform.

Before release, test against actual configured **test-mode** services:

1. Two real parent accounts, email OTP, expired code, sign-out and session expiry; cross-family API attempts and a parent opening `/coach`.
2. Two athletes per family; private and group dates, multiple display timezones, DST change, buffers, blocked times, minimum notice, disabled weekly rules, capacity reduction and simultaneous last-place purchases.
3. All six actual prices; Stripe's official test payment methods for success, decline and authentication. Verify webhook confirmation, portal records, receipts, and that returning to the success URL never grants access by itself.
4. Three-credit package purchase, duplicate webhook delivery, concurrent redemption, private/group separation, eligible cancellation credit return, late cancellation refusal, successful reschedule and full-target refusal.
5. Expired reservation followed by a late paid webhook: it must either confirm within capacity or queue one idempotent Stripe refund. Monitor the refund queue until complete.
6. Monthly/annual subscription purchase, renewal via Stripe test clocks, cancellation at period end, immediate cancellation, payment failure/recovery, expiration and Customer Portal return. Verify published content/quiz progress is blocked for inactive accounts.
7. Actual email delivery, reminder timing, reschedule/cancellation notifications, provider failure, retries, terminal failures and manual retry. Verify no stale reminder sends for a changed booking.
8. Actual iOS/Android devices and desktop, slow network, refresh during Checkout and two simultaneous tabs. The browser fixture suite is supplemental to this hosted acceptance.

## Booking, credit and refund rules

One coach has one buffered calendar. SQL mutation functions use the same transaction-scoped schedule lock and row locks. A GiST exclusion constraint also rejects overlapping active slot ranges. Group participants share a slot; a private slot always has capacity one. Slots contain absolute UTC instants; weekly rules use an IANA timezone and PostgreSQL converts each local occurrence separately across DST. Buffers reserve time on both sides. Overnight availability uses separate rules. Saved availability windows publish immediately for 60 days and are extended by the worker; conflicts are skipped, not silently double-booked. Editing a window creates a new version and closes its old empty slots while preserving reserved slots. Turning off a rule closes future empty slots while preserving existing reservations and confirmations. Cancelling an entire session restores eligible credits, notifies booked families and adds a block so cron cannot reopen it. Published IDs remain stable across scheduled refreshes.

A card checkout initially holds a place for 35 minutes; the Stripe session expires after about 31 minutes. Expired holds stop counting even if cron has not run. A delayed successful payment rechecks capacity, blocked times and athlete duplication under the lock. If the place cannot be confirmed, no credit is fabricated: an idempotent refund is queued. Do not promise confirmation until the webhook has marked the booking confirmed.

Packages grant three family credits of the selected type after verified payment. Single-session payments confirm the held booking and do not add an extra credit. Eligible self-service cancellations restore one same-type credit exactly once; they do **not** issue a cash refund. The UI discloses this before booking. Rescheduling preserves payment/credits and replaces the reminder version. Current configured policy cutoffs govern changes; late changes require coach contact.

Settled one-time refunds are reconciled cumulatively from Stripe. A package refund revokes whole credits at the original per-session price ($50 group / $80 private), up to three credits; fractional amounts below the next full-credit threshold do not revoke an additional credit. Duplicate or older deliveries cannot repeat a deduction. A full direct-session refund cancels the booking or reverses its previously restored credit. Refunds never create negative spendable balances: already-redeemed refunded units become explicit recovery adjustments, which absorb future same-type credit additions or qualifying credit returns. Both parent and coach can see these adjustments. Pending/failed refunds are never counted as settled. Disputes and subscription refunds still require review in Stripe; subscription invoices are displayed as gross volumes rather than net accounting statements. Refunding a subscription charge does not cancel the subscription; cancel the subscription in Stripe when intended. Do not interpret the operational dashboard as net accounting revenue.

Existing Calendly bookings are **not** automatically imported or synchronized. Before switching booking links, enter blocks for all remaining Calendly commitments, reconcile existing package balances/subscriptions, and avoid accepting the same coach time in both calendars. Calendly fallback must remain available during staging tests; do not run two independent production calendars for the same availability.

## Automation and operations

`vercel.json` configures the webpack production build and `/api/jobs` every five minutes. This cron frequency requires a suitable Vercel plan (for example Pro); alternatively use an authenticated external scheduler. Every invocation must provide the configured cron bearer secret. Vercel previews do not automatically execute production cron: invoke it against staging with a secure test scheduler. Never put cron credentials in a URL.

The worker extends the next 60 days, marks expired holds, leases up to five due jobs with `FOR UPDATE SKIP LOCKED`, and processes them concurrently. Reminders are due 24 hours before training (or immediately for shorter lead time). Each job has a five-minute lease, exponential backoff and at most 12 automatic attempts; terminal jobs stay visible for coach review/retry. Email sends use a stable Resend idempotency key. Delivery is at least once: provider idempotency windows are finite, so very late retries can duplicate email. Refunds use Stripe order-scoped idempotency keys. No real emails or refunds were sent in local tests.

Check the coach delivery queue and Stripe webhook failures. Add service monitoring/alerts for stopped cron, pending refunds and terminal delivery errors before production release. Configure backups, Supabase authentication rate limits, and least-privilege Stripe keys in the actual service dashboards. External account operations cannot be validated without credentials.

## Release status

Local implementation and automated validation do not constitute production readiness. Hosted Supabase compatibility, actual Price IDs, real Stripe test Checkout/webhooks, email delivery, cron execution, existing Calendly commitments, coach review of the original curriculum and a Vercel staging deployment remain external prerequisites. Live keys and live webhook events are deliberately rejected in code. Production deployment and enabling live payments require passing hosted acceptance and explicit release approval. Keep `PLATFORM_BOOKING_ENABLED=false` in production until then; the original booking links remain operational.

## Final integration work and access requirements

The implementation now includes four migrations. No migration has been applied to a hosted database in this session. Do not remove Calendly or enable live payments: both still require explicit cutover approval **after** hosted acceptance. Public homepage links to the unfinished platform remain hidden while `PLATFORM_BOOKING_ENABLED=false`.

Supply existing Supabase staging bindings, Stripe test access/signing secret, verified email sender access, and Vercel token/project ID through secure environment settings or ignored `.env.local`. The Vercel account token and project ID are tooling-only and must never be public. Once account access exists, the read-only preflight can discover actual matching Price IDs; they must then be supplied under the six documented `STRIPE_PRICE_*` names. No products or accounts should be duplicated. The preflight also needs API network access to `api.stripe.com`, `api.resend.com`, `api.vercel.com`, and the selected Supabase host in this restricted cloud environment.

Next hosted verification must use the existing project's preview deployment with isolated staging Supabase and Stripe test mode. A successful account read is not a real login, Checkout, webhook, email-delivery or deployment test. Those remain blocked until the bindings are supplied. The production domain was provided by the user; this session did not deploy to it or certify its current remote state.
