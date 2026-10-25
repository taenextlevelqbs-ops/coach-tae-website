## Final QB LAB MVP scope

Keep QB LAB inside the existing Coach Tae website and Vercel project at `/qb-lab`. Preserve the public welcome/sample, black-and-white design, four-card athlete home, existing coaching website and optional simulator. Integrate only accounts, the 24 workout/10 recovery drafts, private film, coach messages and distinct ten-question weekly flag/tackle quizzes. No new business modules, subscriptions or production deployment.

Account-enabled routes now use verified member data instead of browser demonstration history: private home/next session/coaching note, start/complete/revisit history with server timestamps, guardian-managed profiles, messages, weekly quiz review, coach progress and private film queue/feedback. The legacy prototype remains preserved when services are disabled. No synthetic history is imported as real account progress.

Migrations 005–007 add consent-linked athlete identity, one-use owner-reviewed guardian tickets, authoritative training records, coach-reviewed question banks, immutable weekly snapshots and one credited server-scored result per athlete/week. They also add private upload/processing/deletion metadata, leased worker claims, per-request playback authorization, written feedback notifications and guardian withdrawal. Private storage policies plus an isolated FFmpeg worker implementation keep raw clips quarantined, remove audio/metadata and handle retention/purge. Every service defaults off; no live account, child data, upload, payment or infrastructure was activated.

Authentication supports secure provider sessions, one-time invite/recovery verification, password reset, mandatory staff MFA and coach/administrator authorization without a global athlete-data bypass. Signup/guardian permissions cannot be forged with browser metadata or a consent checkbox.

### Validation and evidence

Local validation: lint/TypeScript/build passed, 214 component/domain tests passed, seven migrations plus storage-policy/security fixtures passed, and the complete 380-test browser run passed. Final-source MVP desktop/iPad/mobile acceptance passed 12/12 after visual navigation verification. Full/production npm audits: zero findings; dependencies unchanged. Exact Preview and commit are in the delivery artifact. Tests distinguish actual PostgreSQL RLS/RPC/storage-policy checks, real codec processing, actual guarded/public application browser checks and synthetic provider-intercepted account-component journeys on desktop/iPad/mobile. They do not claim hosted Supabase or private-storage acceptance without credentials. Full lint, TypeScript, build, component/domain, browser and complete/production audit checks remain enforced; no security check is bypassed.

### Launch blockers and owner setup

No configured Supabase project/key/management access was available in the repository/environment; the owner's remote settings could not be inspected. Dedicated project selection, actual provider/email/MFA acceptance, guardian/privacy approvals, coaching content review, private storage/isolated worker scheduling, physical deletion tests, monitoring and production activation remain required. Current configuration still rejects Vercel Production. No real children or video may be enabled before these safeguards are reviewed.

- `docs/QB-LAB-FINAL-MVP-READINESS.md` — delivered scope, security, evidence and explicit blockers.
- `docs/QB-LAB-MVP-OWNER-SETUP.md` — exact Supabase/Vercel/invitation/storage/worker and production checklist.
- `docs/QB-LAB-MVP-INSTRUCTION-REVIEW.md` — all 34 existing training drafts prepared for Coach Tae.

Keep PR #3 draft. Do not merge, modify PR #2, activate payments or deploy production.
