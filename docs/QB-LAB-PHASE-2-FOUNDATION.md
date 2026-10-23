# Phase 2: staged account persistence and Film Room foundation

## Owner decision and deployment boundary

The owner confirmed that no QB LAB Supabase project, authentication, private storage or verified guardian-consent process exists or is approved yet. Do not reuse another application's project. This change provisions nothing and leaves all integrations disabled. Use synthetic data only. No real athlete registrations, child information, personal videos, payments, production deployment or merge is authorized.

This is an integration foundation, not a completed live account platform or a COPPA compliance certification. Self-service signup, minor login, guardian verification, cloud media ingestion/processing and account-linked review persistence remain blocked. The existing public coaching website and demo simulator/workouts/playbook continue unchanged.

## Implemented

- Official managed-provider adapters: `@supabase/ssr` 0.12.7 and `@supabase/supabase-js` 2.118.0. The provider package declares Node >=22; this repository uses Node 24. Exact versions are pinned. No service-role key is consumed by account routes.
- `/api/qb-lab/account/*` returns 503 before reading a request body unless explicitly configured for **synthetic staging**. It also refuses Vercel production. Legacy private, coach and video APIs remain disabled regardless of the new configuration.
- Staging invitation-only adult/guardian/coach password sign-in, provider `getUser()` verification, email confirmation and database-owned verified membership. Client role metadata cannot grant privileges. No signup endpoint or account-creation trigger exists. There is no path for a caller to make themselves a coach or minor account.
- Provider-issued sessions currently use `qb-stage-auth-v2`, HttpOnly, Secure, SameSite=Strict cookies scoped to `/api/qb-lab` (expanded in Phase 3 so guarded coach APIs receive the session). Refreshes preserve those attributes. Old path-scoped sessions are not used; synthetic staging members must sign in again after that change. Writes require an exact configured Origin; request JSON is capped at 8 KiB based on actual streamed bytes. Responses are private/no-store and same-origin. Credentials are never stored in browser localStorage by this adapter. Sign-out is local to the current device, not all devices.
- Authenticated, row-policy-protected athlete directory, append-only self-reported lesson/simulation/workout events, coach-created assignments and idempotent assignment completion. Database identity comes from the verified provider session and RLS, not supplied user IDs. Queries return at most the most recent 100 records. Events have client UUID idempotency keys, server receipt timestamps and bounded duration (0–3600 seconds); they are **not** verified scores or server-authoritative simulator history.
- `/qb-lab/access` has a separate account workspace. It displays only a disabled-services explanation until configured. In a future approved synthetic staging environment it provides member sign-in/out, an authorized-athlete selector, history, coach assignment creation and adult/guardian assignment completion. It never imports demo profiles, local activities or selected demo roles into an account. Existing gameplay continues to record browser-local demonstration history; automatic account synchronization is not connected.
- Migration 002 adds learning events and column-limited task writes, denies history rewrites and coach-fabricated athlete completion, and rechecks consent/relationships on every read/write. Training and media consent purposes are separate; existing consent defaults to training and cannot grant film access. It narrows film visibility to the exact assigned recipient coach or released-media adult owner. A second coach's general athlete assignment does not reveal someone else's paired film. Guardians retain no general playback permission; verified parental privacy requests need their own reviewed process. Existing unpaired films become inaccessible until a reviewed server workflow pairs them.
- The actual `/qb-lab/film` shows an explicit locked-upload notice. Its illustration now supports the HTML canvas drawing API, normalized pointer strokes, keyboard markers, undo, timestamped notes and seek-to-note. Notes/drawings reset between study clips and remain in memory, bounded to 20 each (200 points per stroke). No media files, network saves or real coach communication occur. The protected native-video adapter supports the same overlay and playback speed controls but remains unconnected to media.
- Provider-only private bucket setup SQL is separate from tested migrations. It creates two explicitly nonpublic quarantine/processed buckets, with no client object access policies or upload signer. It refuses silent reuse via conflicting IDs. It has NOT been applied to Supabase, and the storage pipeline is NOT functional.

## API contracts (only after approved synthetic staging setup)

| Method/path below `/api/qb-lab/account` | Behavior |
| --- | --- |
| POST `/login` | Email/password sign-in for preprovisioned verified adult/guardian/coach membership; generic failures |
| POST `/logout` | End the current-device provider session |
| GET `/session` | Verified database membership; no client role inference |
| GET `/athletes` | RLS-filtered directory, max 100 |
| GET `/progress?athlete=UUID` | Latest 100 authorized self-reported events |
| POST `/progress?athlete=UUID` | `id`, `kind`, `contentKey`, `durationSeconds`; immutable self-report, no actor/score/visibility fields |
| GET `/assignments?athlete=UUID` | Latest 100 authorized tasks |
| POST `/assignments?athlete=UUID` | Assigned coach only: `title`, `contentKey` |
| POST `/complete?athlete=UUID` | Task `id`; verified owning adult/linked guardian, transactional/idempotent completion |

All operations currently return 503 because no integration is configured. No public signup endpoint exists. The standalone simulator pocket calculator remains a stateless public synthetic exercise and receives no private data.

## Required setup — do not execute until owner approval

1. Approve provider, region, budget, data processing agreements, retention and privacy policies. Create a dedicated **QB LAB synthetic staging** Supabase project. No shared production or other-application project. Record its actual project reference; it is currently pending.
2. Disable public Auth signups in the provider. Configure provider password policy, email confirmation, rate limits/CAPTCHA or equivalent reviewed abuse protection, session expiry/revocation and recovery. Provision synthetic invited adult/guardian/coach test identities through an owner-controlled process. Never expose the provider admin/service key to a browser or these account routes. Email verification is not adult/guardian identity verification.
3. In isolated staging, review and apply migrations 001 then 002 (never test fixtures). Use a separate reviewed privileged provisioning tool to create verified test memberships, athletes and explicit coach/guardian links. The web application intentionally has no role/relationship mutation API. No production migration has run.
4. Add server-only staging environment values, never real values in source control:
   - `QB_LAB_ACCOUNTS_STAGE=synthetic-staging`
   - `QB_LAB_ACCOUNT_ORIGIN=https://<exact-approved-staging-origin>` (no trailing slash or wildcard)
   - `QB_LAB_SUPABASE_URL=https://<new-project-reference>.supabase.co`
   - `QB_LAB_SUPABASE_PUBLISHABLE_KEY=<that-projects-sb_publishable-key>`
   Do not set these values until approved. The gate rejects legacy JWT/service-role keys and Vercel production. Use one stable HTTPS staging origin for cookie/Origin tests; immutable Preview origins require their own exact configuration. No privileged key is needed for ordinary RLS operations.
5. Run actual provider-session integration tests: confirmed/unconfirmed identities, password failures, refresh/expiry, logout/revocation, concurrent devices, role escalation attempts, cross-account IDs, duplicate events and assignment completion. Existing unit mocks and local auth fixtures cannot prove hosted JWT verification or cross-device operation. Fix failures before connecting gameplay to account persistence. Do not automatically upload existing browser histories.
6. Select and approve a legally suitable verifiable guardian-consent process, direct parental notice, policy purpose/version evidence, verified relationships, expiry/revocation and parental review/export/delete procedures. A checkbox, email confirmation or caller-supplied `verified=true` is not evidence. All minors remain blocked; no independent minor signup is implemented. The account/guardian model and purpose-specific consent evidence workflow need review before any real collection.
7. Only then review `db/provider-setup/private-buckets.sql` against a fresh project. Verify both buckets are private, anonymous and unrelated authenticated listing/download/upload fail, and no inherited permissive policies exist. This SQL is not an operational pipeline. Implement short-lived server-owned upload intents, quotas, quarantined object ownership, authenticated callbacks, byte-signature validation, media decode/transcode, malware inspection, metadata stripping, deletion/retention workers and audit. Keep all video endpoints 503 until these controls pass integration tests.
8. Implement an authenticated streaming proxy (including Range requests/captions) that reauthorizes current exact player/coach pairing, current consent, processed status, retention and revocation on every request. No public URL or browser-delivered privileged signer. Add authenticated bounded feedback/canvas persistence, film-duration validation, released-feedback controls and parental privacy-request handling. Deleting DOM controls cannot prevent copying authorized video.
9. Test consent withdrawal during upload/playback, stale-session refresh, relationship transfers, retention/deletion, backups, interrupted uploads, listing denial and signed-capability expiry. Confirm the PWA never caches private API responses, route HTML, media, identity or notes. Existing worker policy tests remain applicable.
10. Obtain owner/privacy/security approval before enabling real adults or minors. Complete legal review; no implementation alone establishes COPPA compliance. No payments or production activation is included.

## Validation

Results will be recorded below after the final checks. Local PostgreSQL tests use a pinned ephemeral image, no external network and no published port; they test real RLS with synthetic `auth.uid()` fixtures, not hosted authentication. Hosted CI's earlier migration failure did not reproduce locally; the cause cannot be claimed fixed without its logs.

Final local validation:

- Lint, TypeScript and production build passed.
- All **87 component/domain tests** passed.
- The complete **236-test browser suite** passed across desktop, tablet, mobile and compact phone widths, one worker, zero retries/skips. This includes configured WCAG A/AA axe checks, existing public navigation/booking regression, the approved dark athlete home, simulator/playbook/workout/family/coach interactions, disabled-account/upload checks and keyboard/pointer canvas interactions. Automated accessibility is not screen-reader or real-device certification.
- Both migrations and expanded PostgreSQL isolation checks passed in a fresh ephemeral container, including purpose-specific training/media consent, selective media revocation, a second assigned but unpaired coach, cross-account history, coach fabrication denial and guardian completion. No hosted migration occurred.
- Full npm audit: **five pre-existing high development findings**, zero critical. Production audit: **zero findings**. No new reported findings from the added provider packages; no check is suppressed. This is not a guarantee that dependencies have no undisclosed vulnerabilities.
- The first browser run was stopped after a stale new-test study-title selector and an obsolete assertion that prohibited all textareas. The selector now matches the actual study title. The updated regression still denies file inputs, bounds the new session-only note and checks zero localStorage persistence. The final complete suite above passed.
- All four new account environment names are absent locally (presence checks only). No credentials, provider identifiers or deployment environment settings were added.

Production-build screenshots are stored outside source control in `/workspace/artifacts/qb-lab-phase-2/`. They demonstrate synthetic illustration review and disabled services; they are not screenshots of authenticated provider integration or hosted media.

## Changed files
- `app/api/qb-lab/account/[...operation]/route.ts`
- `app/qb-lab/access/page.tsx`
- `app/qb-lab/application.css`
- `db/migrations/002_qb_lab_persistence.sql`
- `db/provider-setup/private-buckets.sql`
- `docs/QB-LAB-PHASE-2-FOUNDATION.md`
- `docs/QB-LAB-PLATFORM-PULL-REQUEST.md`
- `modules/qb-lab/FilmReview.tsx`
- `modules/qb-lab/ReviewCanvas.tsx`
- `modules/qb-lab/accounts/AccountWorkspace.tsx`
- `modules/qb-lab/coach/ProtectedVideoPlayer.tsx`
- `modules/qb-lab/platform/Access.tsx`
- `package-lock.json`
- `package.json`
- `scripts/test-qb-lab-database.sh`
- `server/qb-lab/README.md`
- `server/qb-lab/accounts/config.ts`
- `server/qb-lab/accounts/http.ts`
- `server/qb-lab/accounts/session.ts`
- `tests/components/review-canvas.test.tsx`
- `tests/database/persistence.sql`
- `tests/domain/account-routes.test.ts`
- `tests/domain/account-session.test.ts`
- `tests/domain/accounts.test.ts`
- `tests/e2e/lab.spec.ts`
- `tests/e2e/privacy-foundation.spec.ts`

Screenshot review: desktop and mobile production renders were visually inspected. The canvas/notes work in the existing film console without horizontal overflow; the account screen clearly exposes no login/registration/file input while unconfigured. The actual home remains the approved dark Jordan demonstration dashboard. Captures include `film-desktop.png`, `film-mobile.png`, `access-mobile.png` and `home-mobile.png`. Home captures use a fresh browser context so the established default Jordan profile is shown, rather than a synthetic profile retained after visiting another tool. No screenshots use real athlete data.
