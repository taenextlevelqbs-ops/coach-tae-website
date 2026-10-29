# Family Portal authentication

## Current verification boundary

Local code uses `signInWithOtp({ options: { shouldCreateUser: true } })` for both registration and sign-in, followed by `verifyOtp({ type: "email" })`. These calls do **not** select the email's format: Supabase templates must include `{{ .Token }}`. Configure both **Confirm signup** (new parents) and **Magic Link** (existing parents). No magic-link click is required by this flow.

This task's environment has no Supabase Management API token, Resend API key, or sender binding. Its enforced network policy excludes the production website, Supabase project/API, and Resend. No remote Auth configuration, actual rate limits, SMTP delivery, or real-user session has been inspected or changed. Do not describe the production issue as resolved on the strength of fixture tests.

## Authorized configuration tooling

Target: `fqmojknpqhogotyvxyie`. Never place tooling secrets in `NEXT_PUBLIC_*` variables or source control.

Required secure bindings:

- `SUPABASE_ACCESS_TOKEN`: authorized Supabase Management API token with access to this project's Auth configuration. A publishable/anon key or service-role key cannot replace this token.
- `RESEND_API_KEY`: Resend sending key for an already verified sender domain.
- `AUTH_EMAIL_FROM`: exact authorized sender email on that verified domain, without a display name. Do not guess this address or use Resend's onboarding sender for real parents.
- Network access: `api.supabase.com`, `fqmojknpqhogotyvxyie.supabase.co`, `api.resend.com`, `coachtaeqb.com` (and `www.coachtaeqb.com` if redirected).

Read-only audit (prints selected safe fields; never SMTP password):

```sh
node --env-file-if-exists=.env.local --import tsx scripts/configure-auth.ts
```

After the sender domain is verified, apply the SMTP/template update:

```sh
node --env-file-if-exists=.env.local --import tsx scripts/configure-auth.ts --apply
```

The script sets Resend SMTP (`smtp.resend.com`, port 465, username `resend`, password from `RESEND_API_KEY`), branded sender, six digits, and the two branded templates from `supabase/templates/email-otp.html`. It preserves signup settings, email confirmation requirements, OTP expiration, rate limits, CAPTCHA, redirect URLs, MFA, RLS, and payments. A PATCH success is not proof of mail delivery.

Read the reported `external_email_enabled`, `disable_signup`, and `mailer_autoconfirm` values. Parent registration requires email provider/signup enabled and confirmation required. Resolve an unexpected value deliberately; the script does not silently relax authentication. Confirm the Site URL is `https://coachtaeqb.com`; this OTP flow does not need broad redirect wildcards.

## Rate limits and production verification

The reported error may be Supabase's default shared email quota, custom SMTP quota, or a per-user send limit. The actual configuration and Auth/Resend logs must establish which. Custom SMTP does not automatically remove Supabase's configured email rate limit. Inspect `rate_limit_email_sent`, `smtp_max_frequency`, `rate_limit_otp`, `rate_limit_verify` and Resend account limits before choosing a suitable bounded quota; do not disable limits to hide a delivery fault.

The UI backs off for 60 seconds after a send attempt and five minutes after an HTTP 429. It retains the resend deadline across reloads in the current tab. This is a courtesy, not a security control or prediction of quota reset; Supabase still enforces its limits. Code verification remains available during the send cooldown.

Using two controlled inboxes (one new parent, one existing parent), once remote access is available:

1. Send exactly one code per inbox; confirm branded six-digit emails for **both** templates. Review Supabase and Resend delivery logs without copying tokens or addresses into reports.
2. Enter the latest code; confirm `/api/platform/me` succeeds, creates the new family's profile, and displays the correct family's portal. Never grant a coach role during signup.
3. Reload and navigate away/back; confirm persistent session and refreshed-token access. Sign out; verify protected data disappears and `/api/platform/me` without a token returns 401.
4. Confirm wrong/expired/reused codes fail. Wait for the configured interval before resending. Avoid deliberately exhausting production quotas.
5. As each parent, confirm coach GET and POST API paths return 403. Test a separately authorized coach account without changing its role. UI visibility alone is not an authorization test.

Local browser tests mock the Auth service and portal responses. They verify request shapes, six-digit input, cooldown, helpful rate-limit errors, session restoration after reload, sign-out, and denied coach UI. Server authorization tests separately mock only the upstream Supabase transport and exercise the real server identity function. None certify production SMTP, hosted RLS, token refresh against Supabase, or actual production deployment. Production deployment remains a separate release action.

## Local validation — October 29, 2026

- Lint, production webpack build, final TypeScript check, and `git diff --check`: passed.
- Automated backend/database tests: 60 passed, no failures or skips.
- Browser suite: 36 cases passed; the three new OTP flow cases initially failed because the mocked cross-origin response did not expose Supabase's API-version header. After fixing that fixture, all three targeted cases passed on mobile, tablet, and desktop (39 cases verified across these runs).
- OTP browser verification includes `shouldCreateUser: true`, email verification request shape, invalid code feedback, successful fixture session, portal access, reload persistence, and sign-out. Rate-limit feedback and reload cooldown also pass at all three sizes.
- Real server authorization function was tested with a mocked upstream transport for missing/invalid sessions, parents requesting coach access, ordinary family access, and a coach role.
- Configuration tool read-only and apply paths were exercised against a mock Management API. Apply reads settings back and checks the requested SMTP/template values. Tests ensure it does not patch unrelated settings or print credentials.
- Real website and Management API requests were rejected by the environment proxy (CONNECT 403). No hosted SMTP/template updates, actual email sends, production parent sessions, or deployment were performed.
