# Owner setup: existing Coach Tae website

Use the current **coach-tae-website** Vercel project and `/qb-lab`. Do not create another website, repository, Vercel project or production domain. A dedicated Supabase database is a backend for this same application.

## 1. Find or prepare the backend

1. Open the existing Coach Tae Vercel project → **Settings → Environment Variables**. Check whether any Supabase URL/project reference is already configured. Do not paste keys into chat or source.
2. In your existing Supabase account → **All projects**, look for a Coach Tae project. Verify its organization, region, ownership, data-processing/budget terms, existing tables/apps, Auth settings, public storage and service-role access. Do not reuse another application's project. A shared/public or unrelated project is not automatically suitable for private athlete data.
3. If there is no suitable dedicated project, choose **New project** in your existing organization, name it `coach-tae-qb-lab-staging`, select an owner-approved region/plan and save the database password in your secret manager. No paid plan or provisioning was purchased during development.
4. Record the project reference, HTTPS API URL and publishable `sb_publishable_…` key from **Project Settings → API / API keys**. The web app needs no service-role key. Keep all keys out of source/PR/chat.

## 2. Apply reviewed schemas to empty synthetic staging

1. Back up/inspect the chosen staging schema. Review migrations with the database/security owner first. They are additive candidate migrations and must not be blindly applied to a populated or production project.
2. In that project's **SQL Editor**, run repository files **001, 002, 003, 004, 005, 006, 007** from `db/migrations/` in order, each as a reviewed migration. Historical 003 billing infrastructure stays inactive and does not activate payments.
3. **Never run `tests/database/*` in hosted Supabase.** Those are disposable local auth/storage fixtures and synthetic assertions, not project setup.
4. Keep `qb_mvp_controls.synthetic_media_enabled` and `.minor_onboarding_enabled` false. Both default false. Do not grant clients INSERT/UPDATE on accounts, consent, tickets, relations, answers, results or film state.
5. In the Supabase SQL policy viewer, verify RLS on every `qb_*` table and inspect function EXECUTE grants. Test unrelated identities, unconfirmed email, expired/revoked consent and MFA level before accepting data.

## 3. Configure the existing Vercel Preview

Use **Settings → Environment Variables → Preview**, restricted to branch **feat/qb-lab-experience**. Keep Production empty for these integrations. Select one exact stable branch Preview origin; do not use a wildcard across all `vercel.app` sites. The branch alias can be taken from the current Vercel deployment metadata. Do not use the production coaching origin for staging.

Set directly in Vercel's environment manager:

| Variable | Staging value |
| --- | --- |
| `QB_LAB_ACCOUNTS_STAGE` | `synthetic-staging` |
| `QB_LAB_ACCOUNT_ORIGIN` | Exact approved HTTPS origin of the existing Coach Tae branch Preview, no trailing slash/path |
| `QB_LAB_SUPABASE_URL` | Dedicated project's HTTPS API origin |
| `QB_LAB_SUPABASE_PUBLISHABLE_KEY` | That project's publishable key |
| `QB_LAB_AUTH_EMAIL_STAGE` | Leave unset until mail/templates/abuse controls pass; then `synthetic-staging` |
| `QB_LAB_MINOR_ONBOARDING` | Leave unset until reviewed synthetic guardian setup; then `approved-synthetic` |
| `QB_LAB_MEDIA_STAGE` | Leave unset until storage/runner/deletion/consent acceptance; then `approved-synthetic` |

Names/default-off examples: `docs/env/QB-LAB-STAGING.env.example`. No `NEXT_PUBLIC_*` privileged key. Keep Stripe / `QB_LAB_BILLING_*` variables unset. Changing variables requires a **new Preview** of this same project; do not promote it to Production. Use the configured canonical branch origin when testing sign-in: a different immutable Preview origin is intentionally rejected by the exact-origin write guard.

## 4. Provider authentication and email links

1. Supabase **Authentication → URL Configuration**: Site URL = the exact approved Preview origin. Redirect allowlist = that exact origin plus `/qb-lab/account-help` as required by Supabase's settings. Do not add a broad cross-project wildcard.
2. Disable public and anonymous signup. MVP enrollment is owner-invited and server-provisioned; real minors cannot self-register. Enable email confirmation, an appropriate password policy/leaked-password checks and reviewed session/JWT lifetime.
3. Configure approved test SMTP/mail-catcher, rate limits and CAPTCHA/abuse controls before requesting emails. Use owner-controlled synthetic test addresses only.
4. Configure provider **Invite user** template link to:
   `{{ .SiteURL }}/qb-lab/account-help?token_hash={{ .TokenHash }}&type=invite`
5. Configure **Reset password** template analogously with `type=recovery`, and email-confirmation template with `type=email` (or the supported `signup` type). Only these bounded one-time types are accepted. App-initiated PKCE recovery can also return `?code=…` to this exact route.
6. Do not send implicit `#access_token=…` email templates to this app. They are not accepted; the application clears/replaces unsupported token links. One-time codes/hashes are removed from browser history before subsequent navigation. Review provider/Vercel logging/redaction and short link expiry; no credentials should enter URLs or logs.
7. First invite the synthetic Coach Tae administrator and guardian in **Authentication → Users → Invite**. Before opening those invites, provision the matching **auth.users UUIDs** in `qb_accounts` through the reviewed owner SQL workflow. Set `adult_verified=true` only for the approved synthetic adult identities; never a client-provided assertion. Example shape, **replace placeholders, do not execute as-is**:

   ```sql
   insert into public.qb_accounts(id, role, adult_verified)
   values ('<invited-coach-auth-UUID>', 'administrator', true),
          ('<invited-guardian-auth-UUID>', 'guardian', true);
   ```

8. Open each owner-configured invite. Staff must enroll an authenticator, verify a current code, then set their password. Password change requests provider-wide refresh-session sign-out. On the next password login, staff must verify MFA before opening private pages. Guardians/adult athletes use their verified invited account; email confirmation does not establish age or guardianship.
9. Test wrong/expired/reused links, missing memberships, MFA enrollment/challenge failures, lost-factor recovery through an approved owner process, logout and fresh-browser login. Provider global sign-out revokes refresh sessions; stateless access JWTs may survive until their short expiry. Relationship/consent RLS denies private access immediately when revoked.

## 5. Synthetic guardian and athlete onboarding

1. Select and approve the actual guardian-verification/consent process and child notices. No checkbox counts as verified consent. Until approved, use only synthetic records and keep live child activation off.
2. For a verified synthetic guardian, an authorized owner issues a one-use `qb_guardian_tickets` row: guardian UUID, reviewing coach/admin UUID, evidence reference, actual policy version and expiry. The browser cannot issue or edit this record. No actual child identity is needed to issue a synthetic ticket.
3. After staging/privacy review only, enable the **database** `minor_onboarding_enabled` control and the branch-only Vercel onboarding variable. Guardian → Profile → approved ticket → synthetic nickname, pathway and age group. This transaction creates the profile, verified guardian link, training consent and assigned reviewing coach. A ticket cannot be reused. Media consent is **not** created here.
4. Child login is a separate reviewed owner provisioning action. After synthetic consent/link acceptance, invite an owner-controlled synthetic athlete identity in provider Auth, provision `qb_accounts(role='athlete', adult_verified=false)` and `qb_athlete_logins(account_id,athlete_id)`. Do not collect real child email or create real youth credentials until the identity/privacy process is approved. A linked guardian can otherwise manage the profile through their own account.
5. Adult athletes use an invited `adult` membership and a nonminor profile whose `adult_owner` is that account. Set explicit `age_group='18plus'`, pathway, display name and actual reviewed ruleset. Never infer a precise age from legacy age bands.
6. Coach/admin sees only explicit `qb_coach_assignments`. Add that relation only through reviewed owner provisioning. Administrator role alone does not reveal every athlete or video.

## 6. Workouts, recovery, quizzes and messages

1. Review `docs/QB-LAB-MVP-INSTRUCTION-REVIEW.md`: all 24 workouts and 10 recovery items, safe technique, handedness/system variations, age/experience, dose and equipment. Record the actual coaching review. Do not treat draft duration estimates as a medical/personal prescription.
2. Sign in as MFA-verified Coach Tae → Coach administration (from Profile). Select a linked athlete, verify their age group and exact competition/version/ruleset, and save the reviewed ruleset.
3. Review each question's choices, correct answer, explanation, age eligibility and official source. Edit the starter `review-required` ruleset to an actual reviewed competition/version. A generic NFL FLAG5 guide does not authorize flag7/flag8 rules; tackle fundamentals do not determine NFHS/NCAA details.
4. Select exactly ten reviewed questions from one matching ruleset and eligible age group, choose Monday UTC and selected authorized athletes, then assign. Publishing creates an immutable question snapshot and an in-app notification. One credited assignment per athlete/week; duplicate submission preserves the first result.
5. Test both flag and tackle: no pre-submit answer-key exposure, automatic /10 score, saved time, incorrect-answer review, coach participation and no repeated credit. Future weeks are not available early.
6. Send individual and selected-group coaching messages. Linked guardians see relevant minor notices; verify unrelated families do not. Keep replies and notification email off.

## 7. Private storage, validation worker and deletion

1. Review the private provider agreement/region, retention period, consent, processing and access policy. The candidate currently proposes **30 days**, maximum **4 MB/60 seconds**, MP4 only. Approve these settings before real video collection.
2. In the dedicated staging SQL Editor run **only the MVP storage setup** `db/provider-setup/002_mvp_private_storage.sql` after schema migrations. Do not also run the historical storage candidate. If buckets already exist, the script intentionally fails; inspect them instead of silently reusing or making them public.
3. Verify both buckets are **private**, limit 4 MB, MP4 only. Quarantine has intent-bound INSERT only; processed playback has exact authorized-row SELECT. No anonymous, raw playback, overwrite, public listing or client delete policy. Test actual provider HTTP requests as each role.
4. Prepare an approved **isolated background worker**, with Node 24 and a current patched FFmpeg/ffprobe runtime, CPU/memory/time limits, encrypted ephemeral storage, restricted egress and no other app's secrets. This is background processing for the same backend, not another website/Vercel application. No runner was purchased or deployed here.
5. Inject `QB_LAB_MEDIA_WORKER_STAGE=synthetic-staging`, project URL and `QB_LAB_MEDIA_WORKER_KEY=sb_secret_…` into the worker's secret manager only. Never put this privileged key in browser code, `NEXT_PUBLIC_*`, chat or source. See the worker env-name example. It is not needed by the Vercel web app.
6. Schedule `node scripts/qb-lab/media-worker.mjs` on the approved runner, for example every minute, with monitoring/retries. It processes leased bounded batches, actual decodes/transcodes, strips source metadata/audio, releases validated metadata, sweeps retention and performs queued source/derivative deletion. Verify schedule frequency, quota, codec vulnerabilities, failure alerts and lost-job recovery before enabling uploads.
7. Create separately reviewed **media-purpose consent** evidence for the synthetic minor (owner workflow only), with linked verified guardian, policy version, evidence, expiry and revocation. Do not copy training purpose blindly. Test the normal uploader and paired coach; unrelated coaches/families must be denied.
8. After runner/private-storage/consent testing, enable both `qb_mvp_controls.synthetic_media_enabled` in the database and `QB_LAB_MEDIA_STAGE=approved-synthetic` in branch Preview. These two controls are required. Test actual small synthetic color clips first, never child footage.
9. Verify intake rejects oversized/type/signature failures; malformed/long/oversized-dimension clips fail real processing; quarantined/rejected clips cannot play. Processed clips stream only through authenticated `/api/qb-lab/mvp/film-stream` with current permissions and private/no-store headers. No public or long-lived signed playback link exists.
10. Verify coach written feedback and recipient/guardian notice, then withdraw media consent and test every old playback/range/direct-storage request again. Confirm **physical deletion** of source/derivative objects, not only a hidden UI. Test retention expiry, interrupted uploads, stale leases, worker restarts and idempotent purge. Guardian privacy rights after withdrawal need the reviewed owner workflow.

## 8. Production approval checklist

- [ ] All hosted synthetic acceptance steps 1–12 in the user scope pass on two independent browsers/devices, including actual provider auth, private object storage and physical deletion. Local mocks are not acceptance evidence.
- [ ] Desktop/iPad/mobile Chromium checks pass; verify actual iPad Safari/mobile device behavior and accessibility with the owner.
- [ ] Coach approves all released instructions and weekly question versions; no unsupported health or format-wide rules claims.
- [ ] Guardian verification, minor identity policy, consent/withdrawal, retention, deletion/export, logging and appropriate qualified privacy review approved in writing before real children or media.
- [ ] Distributed abuse controls/limits, MFA recovery, least-privilege provisioning, monitoring, secrets/rotation, storage processor isolation, incident owner and genuine backup/restore rehearsal complete.
- [ ] Dependency audit and exact-commit CI pass; review FFmpeg/OS/runner security separately from npm audit.
- [ ] Review data/UI window limits and pagination before exceeding 100 profiles/200 recent attempts/100 messages or films per load.
- [ ] Owner explicitly approves the reviewed release commit and rollback plan. Keep PR #3 draft until owner review; do not merge automatically.
- [ ] A separate reviewed production activation change is required: current account configuration deliberately rejects Vercel Production. Do not remove that guard as an unreviewed environment workaround.
- [ ] Configure approved production secrets/origin/project, apply reviewed migrations safely, verify guarded paths/storage on the actual release, and obtain explicit production deployment authorization. This task performs none of those production actions.
- [ ] Payments/subscriptions remain disabled and outside this MVP.
