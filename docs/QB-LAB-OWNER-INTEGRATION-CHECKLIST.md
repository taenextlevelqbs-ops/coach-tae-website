# QB LAB owner integration checklist

Status on 2026-10-23: **BLOCKED for real accounts, child information, video uploads and payments.** The owner has not approved or created a dedicated QB LAB staging Supabase project or selected a verifiable guardian-consent process. Project reference, authentication and storage are pending. No other application's project may be reused. This checklist is preparation, not authorization to provision, migrate or enable anything.

Only synthetic data may be used during this work. Browser-local profiles, consent preferences, assignments and training history are demonstrations; none establishes a verified identity or permission. The public coach workspace has no administrative authority. Keep PR #3 draft, production unchanged and private routes unavailable.

## Identifiers and decisions the owner must supply

Supply identifiers or approval records for review; enter secret values directly into the approved environment's secret manager, never source, PRs, chat or this document.

| Item | Required decision/evidence | Current state |
| --- | --- | --- |
| Isolated project | Dedicated QB LAB **synthetic staging** project reference, provider/region, project owner, organization, budget and data-processing agreements | Pending; do not provision without approval |
| Staging application | Exact HTTPS origin and Vercel project/environment identifiers; separate production configuration and promotion restrictions | Requires review of the chosen staging origin |
| Identity | Invitation policy, adult/guardian verification method, coach approver, minor-account model, MFA/recovery/session lifetime and revocation policy | Not approved; no real registration |
| Guardian consent | Approved verifiable parental-consent provider/process, policy/notice versions, evidence retention and reviewer; qualified child-privacy/legal review | Not selected; a checkbox/email confirmation is insufficient |
| Football rules | Governing organization, season, age division, actual rulebook version and approved custom settings per tackle, passing 7v7 and flag competition | Coach review pending |
| Storage | Approved private quarantine/processed bucket identifiers, region, processing vendor, size/duration limits and signed-access policy | Not created or connected |
| Retention/privacy | Retention periods per record/media/derivative/backup, withdrawal/deletion/export procedure, verified request handling and accountable owner | Not approved |
| Operations | Restricted log/monitoring provider, alert recipients, incident owner, backup destination, encryption-key custody and measured recovery objectives | Not configured |
| Billing, post-beta | Separate test-mode provider account, actual product/price IDs, approved adult/guardian payer policy, terms, taxes, refunds and cancellation | Disabled; no live billing approval |

## Environment configuration contract — leave unset until approved

These are existing server-only configuration **names**, not values or an instruction to enable them. No privileged key may use `NEXT_PUBLIC_*` or enter a browser bundle.

| Names | Gate and requirement |
| --- | --- |
| `QB_LAB_ACCOUNTS_STAGE`, `QB_LAB_ACCOUNT_ORIGIN`, `QB_LAB_SUPABASE_URL`, `QB_LAB_SUPABASE_PUBLISHABLE_KEY` | Synthetic staging adapter only: stage literal `synthetic-staging`, exact approved HTTPS app origin, dedicated provider project URL and its publishable `sb_publishable_` key. No service-role/legacy JWT key accepted here. Vercel production rejected. |
| Future privileged provisioning/storage/consent credentials | No connected implementation or approved names yet. Select a secret vault and least-privileged server/worker identities before designing adapters; never place them in the browser-facing account adapter. |
| `QB_LAB_BILLING_STAGE`, `QB_LAB_STRIPE_SECRET_KEY`, `QB_LAB_STRIPE_MONTHLY_PRICE_ID` | Disabled test-only foundation. Requires stage `synthetic-test`, test key and reviewed monthly test price. Live keys/production rejected. A future webhook secret and durable worker are not configured. |
| `QB_LAB_ERROR_LOGGING` | Off by default. `redacted-console` enables the minimal custom error record only; it does not configure provider retention, alerts or other framework logs. |
| `QB_LAB_BACKUP_STAGE`, `QB_LAB_BACKUP_RECIPIENT`, `QB_LAB_BACKUP_DIRECTORY`, `PGSERVICEFILE`, `PGPASSFILE` | Inactive synthetic-staging encrypted-export script. Requires reviewed isolated runner, public age recipient and restricted service/password/output files. No actual provider backup/restore has been performed. |

## Staging acceptance before connecting any real service

- [ ] Approve the exact project/origin and verify separation from production and all other applications. Restrict preview environment variables and provider dashboard access. No real child data during acceptance.
- [ ] Disable public provider signup. Use synthetic invited members only. Implement reviewed adult/guardian verification, coach provisioning, email confirmation, recovery, session rotation/expiry and all-device revocation. Email confirmation alone does not establish age or guardianship.
- [ ] Add provider and application abuse controls: distributed rate limits for sign-in, recovery, progress writes, assignments and media grants; bounded request processing, quotas, concurrency limits and generic failure messages. Proxy/client headers alone cannot establish a trusted throttle identity.
- [ ] Review migrations 001–003 and apply only through the approved migration process to the dedicated synthetic project. Never apply test fixtures to a hosted project. Reconcile schema gaps first: `qb_athletes.pathway` currently supports `tackle`, `flag5`, `flag7`, but not `flag8` or `passing7`; age-band/account/media-principal mapping also needs the selected minor-account design.
- [ ] Keep role/relationship creation outside browser writes. Verify explicit guardian links, athlete ownership, coach assignment and per-purpose training/media consent on every private read/write. A coach role alone must not reveal all athletes. An administrator role alone must not reveal media.
- [ ] Test with actual provider sessions/JWTs and RLS: anonymous, unrelated athlete/guardian/coach, second coach, forged role metadata, expired/revoked sessions, revoked/expired consent, cross-account IDs and concurrent relationship changes. Local `auth.uid()` SQL fixtures are useful but do not replace hosted identity/storage integration tests.
- [ ] Define the minor identity model before implementation. The current gated login supports verified adults, guardians and coaches; the separate unconnected video policy uses a `player` principal. There is no live minor login or approved identity mapping. Do not infer one from demo profiles.
- [ ] Reconcile guardian privacy rights with strict normal video playback. Ordinary playback is restricted to the exact authorized player/coach pair; guardian access/export/deletion requests require their own verified, audited process. Never broaden ordinary playback to satisfy an unrelated profile permission.

## Media and consent acceptance before accepting a video

- [ ] Qualified privacy/legal review covers under-13 collection, age screening, notices, verifiable parental consent, purpose limitations, data processors and applicable local requirements. Obtain explicit owner approval; do not label this code COPPA certified.
- [ ] Record verified guardian relationship, consent purpose/policy version/evidence, expiry and withdrawal. Test revocation races and immediate denial of new media access. Refusing consent must not trigger hidden collection.
- [ ] Create reviewed **nonpublic** quarantine and processed buckets only after approval. Provider SQL in `db/provider-setup` is unapplied; no storage policy, upload signer or processor is connected.
- [ ] Authorize every upload intent and playback/range/caption request server-side against the exact athlete/player/coach pair, consent, processing status and retention. Opaque object names are not authorization. Signed access must be short-lived; define revocation exposure and proxy/revalidation strategy explicitly.
- [ ] Bound bytes/duration/resolution, actual file signatures and decode resource use. Quarantine, scan, strip metadata, transcode and reject unsafe media before release. MIME labels and filename extensions alone cannot validate a video.
- [ ] Implement auditable retry-safe processing, authorized feedback release, withdrawal/deletion of originals/derivatives, retention sweeps, interrupted-upload cleanup, storage listing denial and privacy-safe audit records. Never use public URLs as a fallback.

## Release, recovery and monetization gates

- [ ] Complete [Coach approval](QB-LAB-COACH-APPROVAL.md), ruleset validation and age-appropriate content review. Synthetic deterministic tests prove implementation behavior, not universal football correctness.
- [ ] Resolve the full dependency-audit failure with a supported patch or separately reviewed tooling migration. Current finding: five high development packages from `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`, GHSA-vfj7-8cjw-p6xm. `braces` 3.0.3 remains the latest checked release and is affected; no safe patch identified. Production audit zero does not resolve the full finding. Do not suppress the check.
- [ ] Configure approved logging access/retention/redaction and aggregate alerts. Test that tokens, URLs, bodies, video identifiers and child information do not enter logs. Audit framework/provider logs as well as the custom hook. No session replay or child profiling by default.
- [ ] Establish database and private-object backup/retention coverage, isolated encrypted destination and separately held recovery keys. Perform a genuine restore rehearsal and measure recovery objectives. The current script/workflow example does not establish hosted automated backups.
- [ ] Before post-beta billing, implement durable signature-verified webhook ingestion, server-owned customer mapping and current-state subscription reconciliation. Test duplicate/concurrent/out-of-order events, retry after failure, cancellation, expiry, refunds and ownership. Server-side entitlements authorize features; redirects/local storage never do. Keep actual webhook unavailable until this works.
- [ ] Record exact reviewed commit, CI run, scoped desktop/mobile/accessibility evidence, provider isolation results, consent approval, rollback plan and explicit owner approval before any real athlete beta. Obtain separate production-launch approval afterward.

See [release gaps](QB-LAB-RELEASE-GAP-AUDIT.md), [Phase 2 foundation](QB-LAB-PHASE-2-FOUNDATION.md), [Phase 3 limits](QB-LAB-PHASE-3-READINESS.md) and [operations runbook](operations/LAUNCH-RUNBOOK.md). No checklist item is checked merely because a local test or Preview deployment succeeds.

## Public entry update — 2026-10-23

The public website now leads to `/qb-lab/welcome`; `/qb-lab/sample` is read-only and explicitly draft. Registration and sign-in remain unavailable without approved infrastructure. The preserved `/qb-lab` athlete dashboard and existing tools now require verified server membership. See [Public entry review](QB-LAB-PUBLIC-ENTRY-REVIEW.md), including the inactive v3 HttpOnly/Secure/Strict host-only cookie change needed for both page and API requests. No real or pretend registration is activated.

For current dependency evidence, [the advisory-withdrawal report](QB-LAB-ATHLETE-SECURITY-STATUS.md) supersedes the historical five-high audit observation above; full and production audits currently report zero. Audit enforcement remains enabled.

## Membership and messaging candidate

Migration 004 and guarded authentication/MFA, messaging and schedule adapters are now implemented but unapplied to hosted infrastructure. See [Membership readiness](QB-LAB-MEMBERSHIP-READINESS.md) for exact setup, default-off email gate, synthetic walkthrough, direct-database MFA, required provider testing and substantial remaining account-to-training integration gaps. The earlier 001–003-only schema description is historical; no checklist approval is implied.
