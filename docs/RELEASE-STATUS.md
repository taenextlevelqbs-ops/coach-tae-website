# Production release status — October 29, 2026

Historical checkpoint: current native-booking cutover changes and verification boundaries are recorded in [CUTOVER.md](CUTOVER.md).

**Release held: hosted integrations and production acceptance remain unverified.** This is not a finished production release. The user has authorized production deployment after critical checks pass; the remaining issue is service access, not another deployment-approval request.

## Completed repository work

- Updated Next.js and its ESLint configuration from 16.3.3 to 16.4.3, sharp to 0.35.5, source-map-js to 1.2.2, and affected brace-expansion dependencies. The package lock is updated. The generated Next.js agent instructions changed only their heading level.
- Corrected logout feedback. Supabase's installed SDK removes the local session on remote revocation failure. The portal now closes local access, clears the code/email form and explicitly warns when sign-out on other devices cannot be confirmed. Genuine failures retaining a session display an error without claiming sign-out succeeded.
- Added a separate explicit production minute scheduler restricted to `https://coachtaeqb.com/api/jobs`, with production-only request markers, protected Vault access, browser-denied dispatch/run records, idempotent job registration and preservation of preview scheduling. It has not been installed against a hosted project. The daily Vercel cron remains Hobby-compatible; it does not provide timely reminders by itself.
- Added a timeout to the Auth Management API configuration tool. The integration preflight now distinguishes unavailable workspace bindings from unknown Vercel production configuration.
- Preserved Calendly, branding, existing page content, database migrations, and payment settings. No live Stripe activation, hosted schema update, product creation, main-branch merge or production deployment was performed.

## Verification evidence

- Automated backend/database suite: **61 passed**, zero failures/skips. Includes booking conflicts, group capacity, credits, cancellation/rescheduling, subscription entitlement, webhook retries/signature handling/refunds, family isolation and coach protection. SQL executes in a disposable PostgreSQL instance; service transport tests use fixtures.
- Full browser suite: **42 passed** in one complete run, mobile 375px, tablet 820px, desktop 1440px. Covers homepage/Calendly navigation, OTP request/verification shapes, invalid code feedback, email rate-limit cooldown/reload behavior, portal display, fixture session persistence, successful logout and local access removal when remote sign-out fails, coach protection/UI, scheduling, booking and QB Lab.
- Full `npm audit --json`: **zero known vulnerabilities** after the dependency updates. This is a point-in-time advisory check, not a guarantee against unknown vulnerabilities.
- Final lint, production webpack build, TypeScript and whitespace checks: **passed**.
- Tracked-file scan for full Supabase personal-token, Stripe secret-key and Resend key patterns: no matches. It does not establish revocation of any previously exposed token or certify all repository history.

These local checks do not prove real parent registration, SMTP delivery, Supabase production RLS, real Stripe Checkout/webhook delivery, external scheduler execution, or live-site behavior.

## Exact external blockers

The managed runtime reports current enforced configuration revision 1 with **no secret bindings, runtime variables or custom destination access**. Only GitHub repository transport is usable. The saved draft is separate and remains unpublished; its Supabase token entry has no saved value. Real requests to `coachtaeqb.com` and `api.vercel.com` fail at the proxy with CONNECT 403, before reaching the services. The existing Auth configuration script stops with `Missing SUPABASE_ACCESS_TOKEN`.

1. **Exposed Supabase token:** cannot revoke or replace it without account access. The user must revoke it through the Supabase account's access-token controls and securely bind a newly generated replacement as `SUPABASE_ACCESS_TOKEN`. The exposed token has not been used in this task.
2. **Supabase Auth/Resend:** no active Management API or Resend credential. Neither actual SMTP/rate-limit/template configuration nor real inbox delivery has been read or tested. Bind `RESEND_API_KEY`; discover and verify the existing authorized sender address before applying any settings. A controlled new-parent inbox and existing-parent inbox are needed for real OTP acceptance tests.
3. **Vercel:** no active `VERCEL_TOKEN` or connector, so the existing project/domain, production environment variables, deployment state and runtime logs cannot be inspected or changed. The existing project must be discovered and verified before deployment; do not create a replacement project or guess its ID.
4. **Stripe:** no accessible test-mode credential, verified Price IDs or webhook delivery environment. Bind a test-mode `STRIPE_SECRET_KEY` or make the existing test configuration available through authorized Vercel access. Existing production Stripe settings have not been inspected; no live payments were enabled.
5. **Network/config activation:** the draft contains the required Supabase, Resend, Vercel, Stripe and website destination rules and secure credential requirements. Saving a draft does not activate it. Review/save values and publish the **cloud development environment**, then recheck observed readiness before using credentials. This is separate from publishing the website.
6. **Production data and automation:** hosted tables/migrations, coach assignment, Cron/Vault permissions and actual minute ticks remain uninspected. Do not apply migrations blindly or claim the scheduler is delivering reminders based only on local tests.

No service settings should be described as missing in production solely because their values are unavailable to this workspace. Do not substitute a mocked success for any acceptance check above.
