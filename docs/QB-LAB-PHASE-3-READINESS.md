# Phase 3 production readiness: implementation and launch blockers

## Current status

**Not approved for launch.** Dedicated QB LAB staging infrastructure, managed authentication, private storage and verified guardian consent remain unapproved/unconfigured per the owner's Phase 2 decision. No project was reused or provisioned. No real users, child data, uploads, payments, production deployment or merge is activated by this work. PR #3 stays draft and PR #2 is unchanged.

## Hosted CI and dependencies

The Phase 2 commit `59c29b5` hosted **quality** job succeeded in 3m 50s, including the database step. Evidence: https://github.com/taenextlevelqbs-ops/coach-tae-website/actions/runs/39890927558/job/120210243420. The earlier database failure did not reproduce locally and its root cause is not established; it is not an active failure in this latest observed completed job. The database script now fails explicitly when PostgreSQL readiness times out, prints synthetic container diagnostics and names each SQL file before execution. No assertions or checks were removed.

The hosted **dependency-audit** job still fails at the complete audit, exit 1. GitHub's API returns `Forbidden` for full logs and PR editing; the public job page exposes status/annotations, not all authenticated logs. Local audit reproduces five high development findings, zero critical, zero production findings.

Chain: `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`.
Advisory: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm (stack-exhaustion denial of service through deeply nested patterns). The advisory affects `braces <=3.0.3`, and 3.0.3 remains the newest published release checked. The current Next ESLint plugin still depends on fast-glob. No supported patched replacement has been identified. npm's suggested eslint-config-next 14.2.35 downgrade is incompatible with the chosen Next 16 tooling direction and was not applied. No override, audit exclusion, severity threshold, disabled check or risk acceptance is used to make merges pass. This remains a launch/merge blocker requiring a supported upstream patch or a separately reviewed tooling migration—not a claim of resolution.

Next and its matching ESLint config were updated from 16.4.1 to supported patch **16.4.2**; their declared runtime requirements are compatible with Node 24. This maintenance update does **not** fix braces. Added exact-pinned official **Stripe 23.0.1** (Node >=20). The new dependency introduces no additional findings in the audit. No Python source, requirements/Pipfile or pyproject manifests were found in this repository, so pip dependency remediation is not applicable; unrelated environment packages were not changed.

The existing CI retains read-only permissions, pinned actions and the failing full audit. An upload-artifact Node 20 runtime deprecation warning is visible; its runner currently forces Node 24. That warning is not the dependency failure, and no unauthenticated action-version replacement was guessed.

## Permission boundaries

All real coach API methods now pass through `guardedCoach`. Without approved staging configuration they return 503 before reading bodies. With synthetic staging configured, provider-verified, database-owned membership is required; adult athletes and guardians get 403, absent sessions get 401, and forged browser/header roles cannot grant access. Writes also require the exact configured Origin. Even an authorized coach receives 503 until the actual roster/media service is implemented. Existing per-athlete RLS still enforces assignments and consent.

The publicly accessible `/qb-lab/coach` remains an explicitly synthetic demonstration and contains no private administrative records. It does not authorize the real API. The account assignment endpoint already requires a coach role and an explicit athlete relationship; athletes cannot create coach assignments.

Session cookies are now `qb-stage-auth-v2`, HttpOnly/Secure/SameSite=Strict and scoped to `/api/qb-lab`, so protected coach routes can actually receive verified sessions. The new cookie name avoids ambiguous old path-scoped sessions. Any previously configured synthetic staging member must sign in again. No real accounts existed or were activated. Cookies remain inaccessible to browser JavaScript, and the PWA excludes API responses from caching.

## Subscription hooks: disabled test-mode foundation

No live checkout, product, price or customer was created. No billing UI was enabled. No Stripe key or approved monthly tier is configured. No real-money action occurred.

- `POST /api/qb-lab/account/checkout` is behind the existing account gate, verified adult/guardian membership and per-athlete RLS. It accepts only athlete/attempt UUIDs; caller prices, roles, customer IDs and entitlements are not inputs. It is additionally disabled unless `QB_LAB_BILLING_STAGE=synthetic-test`, a `sk_test_` key and an approved configured price ID exist. Vercel production and live keys are rejected.
- The provider price must be active, test-mode, fixed licensed per-unit USD billing every one month. The customer redirect is restricted to Stripe Checkout. A server-derived account/athlete pair and per-attempt idempotency key are attached. No email, athlete name or age is forwarded by this adapter. The checkout return URL never grants an entitlement.
- `receiveStripeEvent` uses the official SDK to verify the exact raw-body signature with five-minute tolerance. Tests cover tampering, stale signatures, live events and durable-sink failure. Only subscription lifecycle and invoice-paid/failed event types enter the future inbox adapter.
- Migration 003 creates a minimal private billing-customer mapping and event inbox. Anonymous/authenticated roles cannot read/write either table or call the enqueue function. Only the privileged service role can enqueue verified events. Event IDs deduplicate transactionally; enqueueing grants no entitlement. No raw webhook payload/card data is stored.
- The actual `/api/qb-lab/billing/webhook` remains **503 unconditionally**, before reading a body: no durable provider adapter/reconciler is connected. It will not return a misleading 200 and discard an event. The signature helper and tested SQL inbox are foundations, not a deployed subscription-processing service.

After infrastructure and pricing approval, configure synthetic test values only: `QB_LAB_BILLING_STAGE`, `QB_LAB_STRIPE_SECRET_KEY`, `QB_LAB_STRIPE_MONTHLY_PRICE_ID`, plus the Phase 2 account variables. Store a future webhook signing secret server-side in its own environment. Do not set live keys or reuse another application's Stripe customer/project data. The currently absent configuration remains absent.

Before any billing launch: approve actual tier names/prices/currency, guardian/adult payer rules, cancellation/refunds/taxes/terms; establish a server-owned customer mapping; implement a durable signature-verified inbox adapter and serialized reconciliation against current provider subscription state. Do not trust event order or metadata to assign an owner. Implement cancellation, grace-period/past-due/expiry behavior and verified entitlements transactionally. Test duplicate/concurrent/out-of-order events, invalid ownership, trial/cancel/dunning/recovery, webhook retry after persistence failure, portal access and reconciliation. No live billing or entitlement activation is authorized until these pass.

## Backups and logging

`instrumentation.ts` implements the installed Next onRequestError hook. It is off by default. Explicit future `QB_LAB_ERROR_LOGGING=redacted-console` emits only an event name, severity, timestamp and allowlisted route-type/router/runtime categories for QB LAB errors. It never serializes an error message/stack/digest, request URL/query/body/headers, route parameters, cookies, credentials or athlete identity. Public coaching website errors are excluded. No external logging SDK/project/drain, browser replay, analytics or dashboard was provisioned. Existing provider/framework logs outside this custom hook require a separate privacy review.

`scripts/operations/backup-staging.sh` prepares a gated Linux logical backup export. It requires explicit synthetic-staging selection, reviewed PostgreSQL service/password files, a mode-600 password file, mode-700 output directory and an age public recipient. It pipes a custom-format pg_dump directly to age encryption; plaintext is never written to disk. A failed dump/encrypt removes the partial archive. The encrypted archive gets a SHA-256 manifest. It does not upload data or run on a schedule. pg_dump and age are not installed/configured by this change.

`docs/operations/backup-workflow.yml.example` is an **inactive review template**, outside `.github/workflows`. It has no active schedule, approved runner, upload destination or secrets. A synthetic command-harness test verifies disabled behavior and cleanup after dump failure; it does **not** prove actual encryption, provider export or restore. No actual backup/restore or production dashboard is claimed.

See `docs/operations/LAUNCH-RUNBOOK.md` for approval gates, backup/restore acceptance, monitoring dashboards/alerts and incident/rollback procedures. Automated hosted backups/PITR, encrypted remote storage, retention jobs, restores, log retention/access and alert delivery remain infrastructure setup tasks blocked by owner/provider approval.

## Verification

Final local/browser and hosted results are recorded below after validation. A successful local build is not production readiness or proof of hosted authentication/billing/backup operation.

Final local results:

- Lint, TypeScript and the Next 16.4.2 production build passed.
- All **98 component/domain tests** passed. The backup failure/cleanup harness was repeated after adding termination-signal cleanup and passed. No actual encrypted archive/restore is claimed.
- All **236 browser tests** passed across desktop/tablet/mobile/compact projects, one worker, zero retries/skips, in 7.4 minutes. Existing public navigation/Calendly/pricing, approved dark athlete home, interactive learning/simulator/playbook/film/family/coach, automated accessibility, and disabled account/billing/video boundaries remain covered. This is Chromium automation, not certification across real devices or hosted identities.
- All three candidate migrations and the real isolated PostgreSQL policy tests passed, including duplicate inbox insertion, browser denial and no accidental entitlement grant. No hosted schema was changed.
- Full audit remains five high development findings, zero critical; production audit zero findings. No Python project dependencies were found. No checks are suppressed.
- The timestamp-tolerance test exercises the SDK's millisecond received-at argument through a seconds-to-milliseconds conversion; stale signed events are rejected. Tampered/live events and durable-sink errors also fail. No actual Stripe account or webhook delivery was used.
- No application screens were redesigned in this phase. All account/billing/logging configuration remains unset; no cloud service, backup schedule, dashboard, alert recipient or price was created.

## Changed files
- `app/api/qb-lab/account/[...operation]/route.ts`
- `app/api/qb-lab/billing/webhook/route.ts`
- `app/api/qb-lab/coach/[...operation]/route.ts`
- `db/migrations/003_qb_lab_billing_inbox.sql`
- `docs/QB-LAB-PHASE-3-READINESS.md`
- `docs/QB-LAB-PLATFORM-PULL-REQUEST.md`
- `docs/operations/LAUNCH-RUNBOOK.md`
- `docs/operations/backup-workflow.yml.example`
- `instrumentation.ts`
- `package-lock.json`
- `package.json`
- `scripts/operations/backup-staging.sh`
- `scripts/test-qb-lab-database.sh`
- `server/qb-lab/README.md`
- `server/qb-lab/accounts/coach-guard.ts`
- `server/qb-lab/accounts/session.ts`
- `server/qb-lab/billing/stripe.ts`
- `server/qb-lab/operations/errors.ts`
- `tests/database/auth-fixture.sql`
- `tests/database/billing.sql`
- `tests/domain/account-session.test.ts`
- `tests/domain/backup.test.ts`
- `tests/domain/checkout.test.ts`
- `tests/domain/launch-security.test.ts`
- `tests/e2e/privacy-foundation.spec.ts`
