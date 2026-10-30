# Coach Tae launch execution — October 30, 2026

**Production status: BLOCKED. No hosted acceptance or production promotion is claimed.**

The execution started from the latest `coach-tae-platform`, `f20b3cb`, including the native booking release. `origin/main` was `b502819`; that repository reference is not proof of the currently deployed production commit. The existing Coach Tae account, database identity, native booking code, six price mappings, booking rules and existing migrations were retained. DMV Attack and NOVA repositories, databases and credentials were not used or changed.

## Access actually observed

The Cloud Environment runtime reported current enforced revision 1, only package-manager destinations, no custom service destinations, no secret bindings, no runtime variables and no outbound identities. The non-secret identity manifest also had zero connections. No callable Vercel, Supabase, Stripe, Calendly or Resend connector was available in the tool catalog. No credential values or secret files were inspected or printed.

Actual HTTPS probes to `coachtaeqb.com`, `api.vercel.com`, `api.stripe.com` and `fqmojknpqhogotyvxyie.supabase.co` failed with proxy CONNECT 403 before reaching those services. GitHub repository clone/fetch/push transport was available. No proxy bypass, fabricated acceptance marker or live payment activation was attempted.

`docs/CUTOVER.md` records earlier hosted reads/imports, including two occupied Calendly intervals and six live prices. Those historical observations are preserved, but cannot certify that all current appointments remain reconciled or that hosted settings have not changed. No current production record was deleted, overwritten, migrated or mutated by this execution.

## Work completed

- Audited the native Checkout and verified webhook paths, booking/hold lifecycle, packages, credits, parent/coach access, learning entitlements, notifications, migration and production guards.
- Fixed the integration preflight so it verifies the existing Coach Tae Stripe account **before** reading its test catalog. A different business's account is refused. Merely finding a matching test price no longer counts as configured readiness: all six actual runtime price bindings remain required. Tests exercise account refusal before catalog reads and candidate/configured/mismatched mappings through the actual SDK transport, without contacting Stripe.
- Pinned read-only Supabase preflight to the Coach Tae project and included the legacy occupied-time schema. It explicitly distinguishes table presence from completed migration/closure-RPC verification and appointment reconciliation.
- Added a real PostgreSQL upgrade test: populate the earlier schema with a family, Stripe customer reference, athlete, confirmed paid booking, paid order and three existing credits; apply native cutover migrations 005 and 006; compare all original rows unchanged and verify browser-denied service RPC permissions. This runs only in disposable local databases.
- Ran the current read-only integration and live-price audits. Both correctly stopped with unavailable service access; no missing workspace value was described as missing in Vercel production.

## Verification

- **83 backend/database/tooling tests passed**, zero failures or skips. Real PostgreSQL migrations, upgrade preservation, conflict/capacity races, paid fulfillment, release on failed/cancelled/expired Checkout, late-payment refunds, package credits, family isolation, coach controls, QB Lab entitlements, signatures/idempotency and notification handling are covered.
- **54 browser tests passed** across mobile 375px, tablet 820px and desktop 1440px. Auth, parent/athlete portal, native private/group selection, credits, cancellation-return handling, coach availability/policies, QB Lab and responsive behavior use isolated fixtures.
- Lint, TypeScript, webpack production build and whitespace checks passed. `npm audit` reported **zero known vulnerabilities**.
- Built production artifact: seven page routes returned 200; public pages contain no Calendly destinations; unauthenticated family/coach APIs return 401; unsigned webhook returns 400. With unavailable service configuration, booking and payments remain closed. Desktop/mobile artifact smoke passed without horizontal overflow or browser runtime errors. This is a local built artifact, not a hosted test.
- The production guard rejects the unconfigured/unaccepted execution. It was not disabled or given a false acceptance marker.

Logs and screenshots: `/workspace/setup-logs/coach-tae-*`. The dependency install used a workspace-safe npm cache after the inherited npm cache path was unavailable; no package-lock change was needed.

## Exact remaining launch requirements

1. Activate allowed network access to `coachtaeqb.com`, `www.coachtaeqb.com`, `api.vercel.com`, the Coach Tae Supabase project and Management API, `api.stripe.com`, `checkout.stripe.com`, `api.calendly.com` and `api.resend.com` (plus any actual discovered preview/sender/Stripe redirect destinations). Bind authorized existing-service credentials or expose their connectors to this execution. An unpublished configuration draft does not grant access.
2. **Existing Vercel project:** `VERCEL_TOKEN` or authorized connector with project/environment/deployment/log access. Discover the existing domain-linked project and current production commit; inspect its real bindings. Do not create a replacement project.
3. **Coach Tae Supabase:** authorized Management API/SQL migration access (`SUPABASE_ACCESS_TOKEN` or database connection with migration privileges), and the existing project's public configuration plus server-only `SUPABASE_SERVICE_ROLE_KEY`. Read actual migration history and schema; back up and apply only missing additive migrations. Verify existing data, role/RLS, coach assignment, credits and minute scheduler ticks after applying. The public project URL is `https://fqmojknpqhogotyvxyie.supabase.co`.
4. **Calendly:** read access to the existing Coach Tae calendar and all upcoming/current scheduled appointments, or a current complete authorized export. Reconcile occupied intervals including buffers, and verify legacy booking intake is closed or continually reconciled before opening native availability. Earlier imported intervals alone do not prove that current capacity is safe.
5. **Existing Coach Tae Stripe account `acct_1UVeHrQGpLTTSzQv`:** test-mode secret/restricted key with account, prices, customers, Checkout and webhook test access; the six existing test-mode Price IDs; matching `STRIPE_WEBHOOK_SECRET`. Existing live catalog read access (`STRIPE_LIVE_READ_KEY` or connector) is separately needed to repeat the six live-price audit. Do not substitute DMV Attack credentials or live Price IDs into a test Checkout. Run an actual hosted card success/decline/cancel/expiry journey and verify signed Stripe-delivered events plus resulting database records and emails before setting exact-commit acceptance or enabling payments.
6. **Auth/email/notifications:** authorized Supabase Auth configuration access, `RESEND_API_KEY`, verified `EMAIL_FROM`, controlled new/existing parent test inboxes, configured coach destination and strong `CRON_SECRET`. Verify real OTP, confirmations, reminders, cancellations/reschedules and scheduler delivery.
7. Once these hosted gates pass, deploy the exact accepted commit to the existing production project, confirm Vercel READY and the custom-domain desktop/mobile flows, then re-read database/webhook/runtime health. No production merge, promotion, hosted migration, real Checkout or live charge was performed while these gates remain unverified.
