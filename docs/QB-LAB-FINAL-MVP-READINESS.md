# QB LAB final six-capability MVP

All changes stay in `taenextlevelqbs-ops/coach-tae-website`, branch `feat/qb-lab-experience`, existing Vercel project **coach-tae-website**, at `/qb-lab`. No second website, frontend, Vercel project, payment service or production deployment is created.

**Status: implemented for isolated synthetic staging; hosted acceptance and launch remain blocked by owner configuration and approvals.** No live Supabase project, verified guardian-consent process, private buckets or media runner was available during implementation. Existing public welcome/sample, black-and-white design, four-card dashboard and optional simulator are preserved. Private routes still fail closed while accounts are unconfigured. Do not mistake a Ready Preview or mock browser journey for a configured membership service.

## Scope delivered

| Capability | Implementation | Activation / verification boundary |
| --- | --- | --- |
| Accounts | Verified email/password sessions; one-time invite/verification/recovery links; password change and global refresh-session revocation; guardian, adult athlete, consent-linked athlete, coach and administrator roles; privileged MFA; invitation-based account provisioning; owner-reviewed guardian tickets create managed profiles; explicit guardian consent withdrawal | Provider/email credentials and actual identity/consent review unavailable. No public child signup. A browser checkbox cannot issue consent or a role. Owner provisions approved child login links only after safeguards. |
| QB workouts | Existing 24 written drafts, review packet, account-backed start/complete/revisit, server completion dates/history, coach assignments and next-session selection | Draft technique, dose and age adaptations await Coach Tae. No browser histories imported, no fabricated performance scores. |
| Recovery | Existing 10 step-by-step drafts, separate database completion history | General movement education only; qualified review where appropriate before real use. No injury-treatment claim. |
| Film Room | 4 MB/60-second MP4 intake; server-authorized bounded upload; private quarantine; worker decode/transcode, metadata/audio removal; private validated playback with per-request RLS/range checks; paired coach review; written feedback + in-app notices; deletion queue, retention sweep, lease-safe processing/retry/rejection | Both app and database controls default off. Supabase buckets/HTTP, actual worker deployment, withdrawal/physical deletion, runner isolation and privacy/retention approvals require hosted staging acceptance. Raw quarantine has no member playback. |
| Coach messages | Individual and selected authorized-group messages, optional linked workout/recovery assignment, guardian visibility, athlete dashboard coaching note and durable history | In-app only. No unsupervised child replies, contact-directory sharing or email-notification claim. |
| Weekly IQ | Distinct flag/tackle banks; 20 starter drafts; coach question editor/review; exactly ten reviewed questions from one matching ruleset; age checks; Monday UTC weekly assignments; server scoring /10; immutable weekly snapshots; saved completion/review; coach participation; one credited result per week | No starter is auto-approved or published. Coach Tae must actually verify competition rules and age suitability. Future weeks stay hidden until due. Re-submission returns the original score. |

Only the six MVP capabilities are integrated. The existing simulator remains an optional explicitly synthetic practice tool; simulator histories are not imported into account training records. Historical playbook and other prototype routes remain preserved. No new business module or navigation tab is added. Authenticated MVP navigation remains Home / Train / Simulator / Profile; weekly IQ and messages are reachable from Home.

## Backend / security

- Migrations **005–007** extend existing 001–004, add private profile-login links, verified guardian tickets, authoritative training records, private answer keys/weekly snapshots/results and film processing/deletion metadata. Migration 006 seeds existing draft content, without review claims.
- Account UI uses `/api/qb-lab/mvp/*`; credentials remain in Secure/HttpOnly/Strict host-only cookies. Every private operation verifies provider identity and server-owned membership. Coach/admin requires signed `aal2`, including direct database access. Email confirmation is checked in both the account adapter and new database authorization kernel.
- RLS isolates owners/linked guardians/athletes and explicitly assigned coaches. Administrator is not a global data bypass. Athlete accounts with `adult_verified=false` require a server-owned login link and current verified training consent. No client can create a role, adult-verification flag, guardian ticket, consent evidence or privileged relationship.
- Start/completion timestamps, score, publication/receipt times and audit actors are database-owned. Quiz answer keys are not selectable by athletes before submission; snapshots preserve the actual questions/explanations used for each completed quiz.
- Guardian registration requires a one-use owner-issued verification ticket and a separate database enable control. Ticket consumption and profile/guardian/consent/coach linking are transactional. No birthday is collected; under13/13–17/18plus are explicit groups.
- Any verified linked guardian can stop media collection pending owner review. Withdrawal immediately denies access and queues all originals/derivatives for deletion. Training withdrawal also blocks child training/login access. This conflict-handling policy needs owner/privacy approval before real data.
- Uploads are explicit file selections, no camera API or background recording. The application uploads with the verified member's JWT and a five-minute database intent, not an unrestricted signed upload token. Filename/object key comes from the server. Bucket/MIME/size restrictions, intake signature checks and actual isolated decode/transcode are separate layers.
- Playback is a same-origin authenticated API stream, not a public URL or long-lived signed link. Permission is rechecked on each request/range; raw files remain inaccessible to members. Source and processed bucket policy SQL is in `db/provider-setup/002_mvp_private_storage.sql`.
- The worker has its own server-only secret, no browser or Vercel client credential. It claims leased jobs with SKIP LOCKED, rejects stale worker releases, strips metadata/audio, enforces duration/resolution/fps/byte limits and deletes pending originals/derivatives. Failed storage/release steps remain retryable and signal an aggregate failure. Codec details, tokens and athlete information do not enter worker logs.
- The existing application production guard deliberately remains active. `accountConfig` refuses Vercel Production; this turn authorizes Preview implementation, not production activation.

## External configuration audit

Checked repository configuration files, `.env*` file names and environment presence without printing secret values. No Supabase project configuration, key, access token, linked local Vercel configuration or Supabase management CLI was available. No connected Supabase/Vercel management tool is provided. Therefore the owner’s remote account/project list and Vercel environment settings **could not be inspected**, and no project was created or silently reused. A project might still exist in the owner’s dashboard; review it before choosing the dedicated backend. See the exact [owner setup steps](QB-LAB-MVP-OWNER-SETUP.md).

## Football/content evidence

Retrieved the official NFL FLAG rules guide and NFL rulebook HTML on 2026-10-25. The NFL rulebook's embedded text confirms standard eleven-player teams and six/three/two-point scoring. NFL FLAG's guide explicitly identifies its 5-on-5/no-contact examples and seven-yard designated rushing requirement while warning other formats vary. These facts support the bounded starter drafts, not an assertion that every flag league shares those rules. The static NFL PDF host was blocked by this environment; review the current competition rulebook before publishing.

- NFL FLAG: https://nflflag.com/flag-football-rules
- NFL rulebook: https://operations.nfl.com/the-rules/nfl-rulebook/
- Starter ruleset keys deliberately end `review-required`. Coach Tae should use the actual reviewed competition/version when editing a bank and setting an athlete’s ruleset. Flag7/flag8 cannot inherit NFL FLAG5 rules automatically; passing7 does not silently receive a tackle-contact quiz.
- [All 34 instruction drafts, prepared for review](QB-LAB-MVP-INSTRUCTION-REVIEW.md).

## Test interpretation and limits

The suite has three separate browser boundaries: original component regressions with services disabled; the actual production application's public/forged-identity guards; and account-enabled components in an **isolated ignored harness** with browser-intercepted synthetic APIs. The latter exercises real React navigation/forms/video rendering across separate browser contexts, not real provider authentication. No test role, token, environment bypass or fixture is present in deployed authorization.

The PostgreSQL suite executes actual migrations/RLS/atomic RPCs with synthetic auth and storage-policy tables. It proves database behaviors and persistent records across identities, not provider JWT verification, Supabase Storage HTTP or hosted mail delivery. Media tests create color/tone-only clips locally and run actual FFmpeg/ffprobe; no athlete video is used. Hosted acceptance remains required.

UI queries are bounded: up to 100 authorized profiles, 200 recent training attempts, 100 messages/films/tasks, and 200 bank questions per load. Full records remain in the database. Review history pagination/aggregation before exceeding these MVP windows; the dashboard is not a lifetime analytics product. No real training/personal data is stored in browser local storage by the MVP components.

## Explicit launch blockers

1. Dedicated owner-approved Supabase project/reference, publishable key and exact existing Preview origin are missing. Remote project/environment configuration cannot be completed without owner access.
2. Actual provider invitations, MFA, verification/recovery templates, JWT/cookie expiry, abuse controls and separate-device hosted acceptance must pass.
3. Verified guardian process/vendor, notices, purpose-specific evidence, age/identity model, lawful retention, withdrawal/deletion/export handling and qualified privacy review are unapproved. This code does not establish COPPA compliance.
4. All 24 workout/10 recovery drafts and actual flag/tackle weekly banks need Coach Tae's review. A source URL or test-fixture review is not real approval.
5. Private buckets, patched/sandboxed FFmpeg worker, scheduling, secrets, retry/deletion monitoring, physical purge/revocation and interrupted upload tests have not been deployed/verified against an approved service. The scripts are implementation, not an already operating processor. No separate malware-scanning service is connected; runner hardening and processor security require review before accepting private media.
6. Provider logging/redaction/retention, distributed rate limits/CAPTCHA/quota configuration, backup/restore, incident ownership and real-device Safari/iPad validation need owner acceptance. Tests use Chromium desktop/tablet/mobile viewports.
7. Vercel Production remains explicitly disabled for account integrations. A separately reviewed production configuration/release change and explicit owner approval are required after staging acceptance. No merge or production deployment is authorized here.

These are concrete blockers, not requests to create another website. Keep PR #3 draft and leave payments disabled.

## Local verification for this delivery

- Lint, TypeScript and production build passed.
- **214 component/domain tests in 46 files passed**, including real synthetic codec processing, verification/recovery/MFA contracts, role boundaries, bounded intake/ranges, error states and content-seed consistency.
- All seven schema migrations, private storage setup policy SQL and PostgreSQL fixtures passed: actor/guardian isolation, verified email, staff MFA, managed registration, workout/recovery persistence, correct quiz scoring and immutable snapshots, no repeat credit, future-week/notice timing, exact film pairing, leases/revocation/kill switches, rejection, deletion queue and protected purge confirmation. This is not hosted Supabase HTTP or actual cloud-purge acceptance.
- **380 browser tests passed** in the complete regression run: 332 preserved prototype checks, 36 actual guarded/public app checks and 12 synthetic account/MVP checks. The final-source MVP acceptance group passed **12/12** again on desktop, iPad-sized and mobile viewports, with fixed-navigation/touch-target assertions. No skips or retries.
- Complete and production-only npm audits report **zero findings**. No npm dependency changes or overrides. FFmpeg/OS/runner security is a separate owner deployment review.
- Desktop/mobile screenshots are in the delivery artifact, explicitly distinguishing actual production-built public pages from the isolated synthetic-provider component harness. Hosted private account screenshots are not claimed.

The code is ready for the documented **synthetic staging integration review**, not real child enrollment or production activation.
