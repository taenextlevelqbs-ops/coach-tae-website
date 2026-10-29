# Calendly-preserving release — October 29, 2026

Current coordinated audit and payment/record-provenance fixes: [PAYMENT-RELEASE-AUDIT.md](PAYMENT-RELEASE-AUDIT.md). Training package purchases are paused while native booking is disabled; Calendly remains the scheduler.

**Prepared in the repository; not deployed or certified for production.** The user authorizes production deployment after real hosted acceptance and preservation of existing appointments. They have not authorized live charges. The live business remains Coach Tae; no DMV Attack payment integration has been added.

## Native booking and coach workspace

The latest user instruction is to **keep Calendly**. Homepage training cards and desktop/mobile booking buttons retain the existing private/group Calendly URLs even when the native booking flag is enabled for testing. `/book` retains its external-calendar fallback, including the closed-platform state. No external appointment has been deleted or modified. The protected native booking implementation remains behind `PLATFORM_BOOKING_ENABLED`; its activation still requires hosted acceptance. This supersedes the previous branch's native-only public link removal.

The protected coach dashboard now includes an all-appointments view with parent email, athlete, training kind, Eastern date/time, pending/confirmed/cancelled/expired state and payment/credit state. “Completed time window” means a confirmed session's scheduled end has passed; it does not claim attendance was recorded. Athlete profiles and the schedule's appointment cards expose parent contact to authorized coaches only. RLS and server coach authorization still protect these records. Reports retain their documented 1,000-row limit per dataset; they are not a full accounting export.

## Preserve occupied times before release

Migration `202610290005_legacy_busy_times.sql` adds a browser-denied import ledger and service-role-only `ct_import_busy_times(jsonb)`. It uses the same transaction lock as booking/schedule mutations. Imports create occupied blocks without changing external appointments, granting credits, creating customer charges or inventing booking/payment records. A batch conflicts with any live native reservation => the entire batch rolls back. Exact retries add nothing. Changed imported intervals require explicit review instead of silently moving existing blocks.

The prepared import tool accepts an authorized export of **all** upcoming/current legacy appointments, with these fields only:

```json
[
  {
    "external_id": "stable-source-appointment-id",
    "starts_at": "2030-01-03T16:00:00-05:00",
    "ends_at": "2030-01-03T17:00:00-05:00",
    "buffer_minutes": 15
  }
]
```

Offsets must be explicit; buffers default to 15 minutes on both ends. The tool hashes appointment IDs and stores no parent/athlete names or email in the import ledger. Dry-run validation does not contact Supabase. Apply requires the exact Coach Tae project and a server-only service-role binding. Existing coach block controls can remove a block after an authorized legacy cancellation; its tracking row cascades with that explicit removal. Removing a native block does **not** cancel the external appointment. Missing entries in an import never silently release previously occupied time.

No real appointment export/read integration is available to this runtime. No legacy appointments have been imported or deleted, and reconciliation remains a launch blocker. Run only after inspecting hosted migrations/schema; never apply migrations blindly over existing production data.

## Existing live Stripe prices

The six user-supplied Price IDs and account `acct_1UVeHrQGpLTTSzQv` are preserved in `lib/platform/live-catalog.ts`. The user reports these six live prices verified through their connected services. They are preserved as supplied and are not automatically activated as Checkout configuration. `scripts/check-live-prices.ts` reads only the existing account and six prices, compares USD amounts, active product/price state and expected month/year intervals, and refuses a different account or mismatched intervals. It never changes prices, creates products/Checkout, or enables payments. Audit output includes actual intervals so an unexpected one-time/weekly/reversed membership mapping can be reviewed without changing any price.

There is no live read credential available to this runtime, so this runtime has not repeated the user-reported verification; its read-only audit stops before making calls. Its simulated tests prove audit behavior only. No supplied live Price ID is substituted for a test-mode ID. Real Stripe test checkout/webhook delivery and separate live-account catalog verification remain required before any payment cutover.

## Production guard

`vercel.json` invokes `scripts/check-production-cutover.mjs` before the normal webpack build. A normal production website update with native booking disabled can build while preserving Calendly, without claiming native hosted acceptance or requiring its activation. Attempting to activate live Stripe payments still blocks a production build.

If native booking is enabled on production, the guard additionally requires an exact `BOOKING_CUTOVER_VERIFIED_COMMIT` matching `VERCEL_GIT_COMMIT_SHA`, correct Supabase project and website origin, required service variables, a strong cron secret and a Stripe test key. Record that marker only after actual hosted Auth, payment/webhook, credit, coach/schedule, email, reminder and appointment reconciliation checks pass for that commit. It is an operator attestation, not evidence generated by the guard. Calendly links remain available; do not open overlapping native availability without ongoing reconciliation of external appointments. No production settings or deployment have been changed by this session.

## Runtime access boundary

The actual tool catalog was inspected for this request. No callable GitHub API, Vercel, Supabase, Stripe or Resend connector is exposed to this execution session; only managed cloud-environment configuration/diagnostic tools are available for connected services. Existing GitHub repository transport works and is reused for fetch/push. This does not deny that connections may exist elsewhere in ChatGPT.

The managed runtime reports enforced revision 1, no secret/runtime-variable bindings, and no custom allowed destinations. Previously saved credential requirements and network destinations are a draft, not active runtime access. Access to the website and service APIs remains blocked by the proxy. No Supabase access token, including the previously exposed one, has been used here. Revocation/replacement cannot be performed or verified without account access.

No live SMTP, account signup/login, Stripe checkout, deployed coach/schedule edit, actual reminder, hosted migration/RLS, deployment READY status or runtime logs have been certified. Local tests must not be represented as these live results. The exact credential/network limitations, plus legacy appointment reconciliation, prevent a safe production cutover. No plugin installation or duplicate services are required.

## Previous native-only checkpoint (superseded by preservation update)

- ESLint, production webpack build, final TypeScript check and whitespace check: passed.
- Backend/database/tooling suite: **66 passed**, no failures/skips. Actual additive migrations execute in disposable PostgreSQL; service transports use fixtures. Tests cover existing bookings/credits/RLS plus import atomicity/idempotency/browser denial, read-only price-audit behavior and production guard refusal.
- Browser suite: **48 passed** in one full mobile/tablet/desktop run. New cases verify native-only links, group selection and coach appointment/contact/status displays. Existing cases cover Auth/session/logout, schedule editing, native credit booking, entitlement and responsive layout.
- Built-app local smoke: `/`, `/book`, `/portal`, `/coach`, `/coach/schedule`, `/lab` return 200 with no Calendly references. With no service configuration and booking disabled, `/book` explicitly says online booking is closed. Unauthenticated family/admin/calendar API requests return 401.
- Actual live `/book` and Vercel API requests: proxy CONNECT 403; no hosted service reached. Read-only live price audit: stops for missing authorized credential. No production configuration, hosted migration, real checkout, email send, occupied-time import or deployment was performed.

The lint pass required replacing two home-return anchors with Next.js `Link`; the build pass required making the tooling test's environment overrides partial rather than pretending every process variable was supplied. No remaining local check failures are hidden by these results.

## Latest preservation update

The user confirmed the preview is READY, production still uses older code, Calendly remains live, and the existing six live Stripe prices were verified through their connected services. These are user-reported hosted observations; this runtime has not independently rechecked them.

The branch now preserves Calendly across homepage, mobile navigation and `/book`, including when native booking is enabled for testing. Coach dashboard/contact/status improvements, occupied-time protection, dependency patches and Auth/logout work are retained. The production guard permits a website update with native booking disabled and still refuses unauthorized live Stripe activation or unaccepted native activation.

Verification for this update: **66 backend/database/tooling tests**, **6 targeted browser checks** across mobile/tablet/desktop, ESLint, production webpack build, final TypeScript and whitespace checks all passed. No production deployment, service configuration change, hosted checkout or live charge was performed by this session.
