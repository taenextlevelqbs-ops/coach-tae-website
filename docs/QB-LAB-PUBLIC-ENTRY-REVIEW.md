# QB LAB public entry and private-dashboard boundary

This change updates the journey to **Coach Tae website → public introduction → account availability / sign-in → verified private dashboard**. It preserves the approved athlete design and existing training implementations. It does not activate accounts, private media or payments.

## Routes and current behavior

| Destination | Route | Current behavior |
| --- | --- | --- |
| Public introduction | `/qb-lab/welcome` | Both public website QB LAB links open this page. Black/charcoal/white branding, short headline, four capabilities, working sample action, Get Started / Sign In and a concise personalization explanation. No athlete provider, profile selector or training-store subscription. |
| Public sample | `/qb-lab/sample` | One server-rendered, read-only **Reset Your Feet** drill. Written steps and safety notes; no file, credential, progress, completion, assignment or account input. Does not mount `InstructionDetail`, record a start or subscribe to browser history. |
| Create Account | `/qb-lab/create-account` | Registration disabled. Separate parent/guardian and adult pathways explain the pending approval/verification requirements. No child, contact or credential fields and no signup API. |
| Sign In | `/qb-lab/sign-in` | No fields while the staging adapter is disabled. If an owner later configures the existing approved synthetic adapter, only invitation-only verified adult/guardian/coach staging members can use it. Success uses the verified server login endpoint, validates the return destination and performs a full navigation through the server guard. |
| Athlete dashboard | `/qb-lab` | The exact previously approved dashboard remains here. Now requires a server-verified member; unavailable in the deployed Preview while infrastructure is unapproved. A local demo profile, cookie name, query parameter or browser role is not authentication. |
| Workouts / recovery / IQ / film / plays / simulator / history / family | Existing routes | Preserved implementations, now behind the same request guard. There is no public full-library or local-progress exception. |
| Coach workspace | `/qb-lab/coach` | Requires the verified **coach** role; adult and guardian members cannot gain it by choosing a demo profile. Real coach operations retain their independent API checks. |

The public sample is **not represented as approved**. No source records Coach Tae's approval of the library. Its cue, instructions and age suitability remain clearly marked draft. Owner/Coach Tae content approval is still required before calling it an approved public drill. No repetitions, rehabilitation or individualized prescription is invented.

## Authentication and privacy implementation

- `proxy.ts` checks every `/qb-lab` HTML, direct-navigation and RSC/prefetch request. Only an explicit list of public pages and public offline/icon assets is exempt. Prefix lookalikes are not public exceptions.
- The disabled account adapter, invalid/expired/revoked session, provider error and unverified membership fail closed. Configured membership verification uses the existing provider `getUser()` and server-owned `qb_accounts` role/adult-verification record, not `getSession()` or browser metadata.
- Coach-page authorization checks decoded paths. Private API operations continue to verify their own identity, role, relationship and/or disabled-service gates. The page guard does not replace RLS or per-operation authorization.
- QB LAB routes are dynamically rendered and protected responses use private/no-store caching. The service worker continues to exclude API responses, RSC requests, personal page HTML and media. Only generic public assets/offline guidance may be cached.
- Future staging session cookies use a new `qb-stage-auth-v3` name with **Secure, HttpOnly, SameSite=Strict, host-only, Path=/** attributes. The previous API-only path could not authenticate page requests. Refresh preserves cookie chunk names and propagates changes to the upstream request; redirect responses retain cookie deletions/refreshes. Legacy v2 cookies do not grant page access. This inactive scope change requires review on the dedicated staging hostname before service activation.
- Sign-in return values must remain same-origin QB LAB paths. External URLs, slash/backslash tricks, control characters, encoded traversal and public sign-in loops are rejected. No return value authorizes access.
- The public shell never mounts the synthetic athlete provider, local history hooks or installation controls. Existing synthetic browser history remains unchanged and is not read by the sample.

## What is deliberately unavailable

The owner has not created or approved the dedicated staging Supabase project, authentication, guardian-verification/consent process or private storage. No project or provider was reused or provisioned, no environment secret was set and no real registration or hosted migration occurred. There are no valid deployed test credentials to provide.

Consequently an **authenticated synthetic dashboard link cannot currently show a signed-in dashboard**. The protected link is supplied, and it correctly routes an unauthenticated visitor to the unavailable sign-in screen. Inventing a token, local role or fake account to make that link look authenticated would violate the stated privacy boundary. The authenticated redirect contract and role checks have synthetic unit coverage; actual hosted provider sign-in/session/RLS acceptance remains blocked pending owner approval.

The existing browser-local training models are still synthetic and are not bound to real athlete accounts. Connecting approved account records to the personalized shell, account-scoped history, logout/revocation lifecycle, guardian-managed minors and durable synchronization remains a separate approved integration task. Do not describe the current prototype as a secure real-athlete beta or a certified child-privacy service.

## Regression architecture — no deployed test bypass

Two clearly separate browser surfaces are tested:

1. **Real production build, loopback port 3192:** new public-entry projects exercise the actual `proxy.ts`, public website navigation, disabled forms, private HTML/RSC denial, forged browser claims, safe redirects, no sample history access/writes, accessibility and responsive design.
2. **Generated local-only component harness, loopback port 3150:** existing prototype browser regressions exercise the preserved athlete shell, libraries, tactical engine, playbook, replay and coach components while real account services remain off. The harness copies current application sources into ignored `.qb-lab-browser-harness/` and does not include the root proxy. It is expressly not an authenticated product or an authorization test. It is never imported by the production app, committed or deployed, and starts only on loopback in Playwright.

The production app contains **no test authentication bypass**, synthetic-login endpoint, preview password, role cookie exception, CI identity or `NODE_ENV` shortcut. Private API gates are unchanged and also tested. Existing prototype browser assertions are retained rather than disabled to accommodate the new boundary. All guard checks target the actual production build, not the component harness.

## Verification

Final local outcomes, exact commit, screenshots and new Vercel Preview are recorded in the delivery evidence outside tracked source at `/workspace/artifacts/qb-lab-public-entry/`. Record actual results, including any failures and reruns; do not infer hosted provider acceptance from unit mocks or prototype-harness passes.

The public coaching site's only source change is its two QB LAB link destinations. Pricing, Calendly links, brand layout and existing website sections remain unchanged. Keep PR #3 draft; no main merge, PR #2 modification or production deployment.

## Local validation results

- ESLint, TypeScript and the production build passed.
- All **177 component/domain tests** passed across 37 files.
- Complete browser matrix: **364 passed**, zero retries/skips. This comprises **32 real-app public/guard cases** and **332 preserved prototype component-harness cases** across desktop, tablet, mobile and compact viewports.
- The initial targeted public run found a test-parser assumption that redirect Locations were absolute. Next.js emits same-origin relative Locations; the test now resolves against the request URL and still verifies the protected redirect target/no-store boundary. The final full run passed all cases.
- Full and production-only npm audits: **zero findings**. No dependency versions changed.
- No new database migrations or hosted service changes were required. Actual provider-backed sign-in, session lifecycle and hosted isolation acceptance remain unavailable, rather than simulated.

Exact final commit, Preview metadata and local production screenshots accompany delivery. Component-harness dashboard screenshots are labelled as design-preservation evidence, not authenticated screenshots.

## Changed paths from `b5f6f71`

- `.github/workflows/qb-lab-platform.yml`
- `.gitignore`
- `app/SiteNav.tsx`
- `app/qb-lab/create-account/page.tsx`
- `app/qb-lab/entry.css`
- `app/qb-lab/forbidden/page.tsx`
- `app/qb-lab/layout.tsx`
- `app/qb-lab/sample/page.tsx`
- `app/qb-lab/sign-in/page.tsx`
- `app/qb-lab/welcome/page.tsx`
- `docs/QB-LAB-OWNER-INTEGRATION-CHECKLIST.md`
- `docs/QB-LAB-PLATFORM-PULL-REQUEST.md`
- `docs/QB-LAB-PUBLIC-ENTRY-REVIEW.md`
- `eslint.config.mjs`
- `modules/qb-lab/LabShell.tsx`
- `modules/qb-lab/entry/Introduction.tsx`
- `modules/qb-lab/entry/PublicLabShell.tsx`
- `modules/qb-lab/entry/SignIn.tsx`
- `modules/qb-lab/entry/login.ts`
- `modules/qb-lab/entry/routes.ts`
- `package.json`
- `playwright.config.ts`
- `proxy.ts`
- `scripts/build-qb-lab-browser-harness.mjs`
- `server/qb-lab/accounts/cookie-policy.ts`
- `server/qb-lab/accounts/session.ts`
- `tests/components/public-entry.test.tsx`
- `tests/domain/account-session.test.ts`
- `tests/domain/public-entry.test.ts`
- `tests/e2e/entry-flow.spec.ts`
- `tests/e2e/lab.spec.ts`
- `tsconfig.json`
