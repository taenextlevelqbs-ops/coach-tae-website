# Athlete experience redesign — implementation and review ledger

This change follows the owner’s exact simplified athlete dashboard and drill-detail specification. The baseline inventory and preservation contracts are in [Athlete redesign audit](QB-LAB-ATHLETE-REDESIGN-AUDIT.md). It is a UI simplification and structured draft-content implementation, not activation of a real athlete platform.

## Implemented surface

| Surface | Behavior to verify on the final commit |
| --- | --- |
| Home | Compact Coach Tae/QB LAB identity, demo Alex greeting, Today's Training, exactly four Workouts/Recovery/QB Simulator/Film Room destinations, one clearly synthetic coaching note. Compatible pending local coach assignments override the sample 3-Step Drop + Shuffle. |
| Shared navigation | Home, Train (`/qb-lab/workouts`), Simulator, Profile. Persistent mobile navigation; no top-level Playbook/IQ/Progress cards. Existing deeper tools remain reachable. |
| Workouts | Four compact categories and 24 distinct structured draft drills. Dynamic details supply written purpose, metadata, matching movement diagram where useful, numbered steps, draft tip, completion and optional browser speech. No video is required or fabricated. Legacy `?activity=...&profile=...` guided activities remain available. |
| Recovery | Three categories and 10 distinct exercise/education drafts with positioning, steps, common mistakes and safety limits. No diagnosis, rehabilitation, healing or injury-prevention claim. |
| Today's Training | A fixed draft sample sequence of footwork, comfortable mobility and pathway-specific recognition; statuses reflect actual local start/completion events. It is not an automatically personalized or dated coaching prescription. Completion points to the next available activity. |
| Simulator | Simple Learn/Practice/Challenge-preview entrance. Full technical settings remain behind Advanced Settings. The actual deterministic engine, protection/coverage/passing, replay, seeds, rules and exact saved-play launch remain preserved. Legacy recognition/spacing lives at `/qb-lab/simulator/spacing`; engine and spacing keep landscape support without rotating the entrance. |
| Film Room | A truthful sample task and empty feedback state, upload lockout and explicit Explore sample feedback disclosure. Existing illustrated timeline, canvas, tags, comparison and synthetic queue remain available inside; no private file is accepted or sent. |
| Profile / progress / IQ / coach | Shared monochrome surfaces, fixed demo identity/pathway, deeper history and tools; advanced recognition is secondary but exact assignment/deep links still open it. Existing synthetic coach workspace remains operational within its local/session limits. |

The actual desktop and mobile Home, drill, recovery, simulator and Film Room pages were rendered and inspected during implementation. Exact final-commit captures and publication metadata accompany delivery; automated tests alone do not establish visual or coaching approval.

## Persistence and content boundaries

- Fixed demo profiles are not authenticated athletes. New training events record actual browser interactions and self-reported completion only; no movement evaluation, ability score or coach verification is inferred.
- Local history is confined to this browser and synthetic profile. It is not synchronized across accounts or devices. Storage failure must be reported as memory-only; imported history is untrusted.
- Written workouts and recovery instructions remain **DRAFT**, including technique, timing, sets/repetitions and age/experience suitability. Do not attribute unapproved advice to Coach Tae as reviewed instruction. Exact drop-footwork terminology varies by system. Recovery/conditioning content requires appropriate professional review before prescribed use.
- The exercise library is not a personalized age-progressive conditioning prescription. Where dosage lacks approval, the UI must say so rather than invent safe repetitions for every age. Optional speech depends on browser support and cannot replace written steps.
- Existing private APIs, authenticated staging adapters, consent, storage and billing gates remain disabled/unconfigured. A local completion, sample feedback note or public coach demo grants no server authority. No real account, child information, private video or payment collection is enabled.
- Public coaching pages, pricing and Calendly links, production, PR #2 and merge status are outside the change.

## Regression strategy

Existing browser/component tests are adapted to deliberate surface changes rather than discarded: four-card Home/navigation/default Alex replace obsolete six-card/Jordan assertions; old spacing scenarios use their explicit secondary destination; technical engine controls and Film Room interactions open their new disclosures first. Actual gameplay, replay, saved-play, assignment, timestamp/canvas, profile isolation, PWA, private-service and public-site assertions remain enforced.

Required additional evidence includes complete workout/recovery structural content, distinct steps/diagrams, direct detail routing, real local completion and next activity, pending-assignment priority, portrait-friendly entry, accessible advanced controls, consistent navigation, storage denial, invalid route/error behavior and monochrome responsive visuals.

## Verification ledger

| Evidence | Final result |
| --- | --- |
| ESLint / TypeScript / production build | Passed |
| Component and domain tests | 167 passed across 35 files; automated tests do not establish coaching approval |
| Isolated PostgreSQL migration/policy checks | Passed in an ephemeral network-isolated PostgreSQL container with synthetic fixtures; no hosted migration applied |
| Complete browser matrix and accessibility | Full four-viewport run: 316 passed, 12 failed. The failures were three issues repeated across four projects: offline registration after relocating install UI, legacy activity-ledger background, and family-label contrast. Fixed all three; all 12 affected cases passed on rerun. No assertions disabled, retries or skips. Final hosted full-suite status is reported separately. |
| Desktop/mobile actual Home, workout, recovery, simulator and film screenshots | Final captures are delivered outside tracked source at `/workspace/artifacts/qb-lab-athlete-redesign/`; `evidence.json` records the exact commit and route/viewports. Desktop/mobile implementation captures were inspected; final captures must be inspected before delivery. |
| Exact feature-branch SHA / clean tree / remote tracking / draft PR #3 head | Normal feature-branch publication only; exact SHA, remote and PR head verification are recorded with delivery. No main/Phase 0 branch updates. |
| Exact new Vercel Preview URL/status | Verify the new feature commit through provider/GitHub deployment metadata, then record its immutable URL in delivery. An older Ready Preview is not evidence for this redesign; direct Preview HTTP access may be restricted by the environment. |
| Dependency audit / hosted CI | Current full and production npm audits both pass with zero findings; an independent full audit against explicit `https://registry.npmjs.org` also passes. The prior `braces` advisory was withdrawn upstream on 2026-10-23; dependencies are unchanged. Hosted CI still requires verification against the final exact commit. See [current security status](QB-LAB-ATHLETE-SECURITY-STATUS.md). |

## Remaining release gates

Coach Tae must review the 24 drill definitions, matching diagrams, drop/throwing cues, draft sample sequence and pathway instruction. Recovery positioning/dosage and age suitability require qualified review. No automated suite approves football or exercise instruction.

Dedicated QB LAB staging project/authentication, guardian verification and verifiable consent, server-side account integration, private media quarantine/processing/access, withdrawal/deletion/retention, rate limits, hosted isolation/restore and operational monitoring are not approved or operational. The existing billing foundations remain disabled. See [Owner integration checklist](QB-LAB-OWNER-INTEGRATION-CHECKLIST.md) and [Coach approval register](QB-LAB-COACH-APPROVAL.md).

Earlier full audits accurately reported five high development findings through `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`. On 2026-10-23, [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) was **withdrawn upstream**; GitHub states it was withdrawn “because it's not a practically exploitable vulnerability.” Current full and production audits return zero findings, corroborated by an independent full audit against the official npm registry. `braces` remains 3.0.3 and the dependency chain/package lock are unchanged: this is an advisory-status change, not a dependency patch or an audit bypass. Keep the full check enforced and verify hosted CI separately. A dependency audit does not establish that account, privacy, application or infrastructure security is complete. Evidence and exact commands are in [current security status](QB-LAB-ATHLETE-SECURITY-STATUS.md).

Final delivery includes visual/functional evidence and clearly reports any publishing or hosted-CI blocker. Even after a verified Preview, the product remains an explicitly synthetic coach/engineering review experience, not a real athlete beta, public launch or certified child-privacy service. Keep PR #3 draft; do not merge or deploy production.

## Specific remaining limitations

- No approved athlete age/experience profile or coaching curriculum exists. The sample profiles are both age 12; the library does not invent individualized dose or age-specific recommendations.
- Coach Tae must especially confirm under-center/shotgun drop patterns, the draft right-handed crossover examples and mirrored left-handed language. Diagrams show body-center direction, never universal foot placement.
- Recognition completion comes from the real lesson. A partially attempted IQ rep is not persisted as a resumable in-progress rep; workouts/recovery record starts and completion.
- History is bounded to the existing 200 activity events; sufficiently old records can age out. This is not a durable account training log.
- Optional browser narration has lifecycle tests but no real-device speech certification. Real landscape lock/install behavior remains browser/OS dependent.
- Installation controls remain in Profile; shared nonvisual registration preserves Home offline support. Public cache version advances to v2 so previously cached offline colors are replaced. Private response/page caching rules are unchanged.

## Changed files

The following paths changed from `68cb63e`; public coaching page sources, dependency files, pure engine/football models, database migrations and server authorization implementations are unchanged.

- `app/qb-lab/application.css`
- `app/qb-lab/athlete.css`
- `app/qb-lab/layout.tsx`
- `app/qb-lab/recovery/[slug]/page.tsx`
- `app/qb-lab/recovery/page.tsx`
- `app/qb-lab/simulator/engine/layout.tsx`
- `app/qb-lab/simulator/engine/page.tsx`
- `app/qb-lab/simulator/layout.tsx`
- `app/qb-lab/simulator/page.tsx`
- `app/qb-lab/simulator/spacing/layout.tsx`
- `app/qb-lab/simulator/spacing/page.tsx`
- `app/qb-lab/workouts/[slug]/page.tsx`
- `app/qb-lab/workouts/page.tsx`
- `docs/QB-LAB-ATHLETE-EXPERIENCE-REDESIGN.md`
- `docs/QB-LAB-ATHLETE-REDESIGN-AUDIT.md`
- `docs/QB-LAB-ATHLETE-SECURITY-STATUS.md`
- `docs/QB-LAB-PLATFORM-PULL-REQUEST.md`
- `modules/qb-lab/AppIcon.tsx`
- `modules/qb-lab/DemoProfile.tsx`
- `modules/qb-lab/DemoSession.tsx`
- `modules/qb-lab/FilmReview.tsx`
- `modules/qb-lab/FootballIQ.tsx`
- `modules/qb-lab/HomeDashboard.tsx`
- `modules/qb-lab/LabShell.tsx`
- `modules/qb-lab/PwaInstall.tsx`
- `modules/qb-lab/live-engine/EngineLab.tsx`
- `modules/qb-lab/platform/Progress.tsx`
- `modules/qb-lab/training/AthleteUI.tsx`
- `modules/qb-lab/training/InstructionDetail.tsx`
- `modules/qb-lab/training/RecoveryLibrary.tsx`
- `modules/qb-lab/training/SimulatorHome.tsx`
- `modules/qb-lab/training/WorkoutLibrary.tsx`
- `modules/qb-lab/training/daily.ts`
- `modules/qb-lab/training/progress.ts`
- `modules/qb-lab/training/recovery.ts`
- `modules/qb-lab/training/types.ts`
- `modules/qb-lab/training/workouts.ts`
- `public/qb-lab/manifest.webmanifest`
- `public/qb-lab/offline.css`
- `public/qb-lab/offline.html`
- `public/qb-lab/sw.js`
- `tests/components/adjustment.test.tsx`
- `tests/components/athlete-secondary.test.tsx`
- `tests/components/instruction-detail.test.tsx`
- `tests/components/lab.test.tsx`
- `tests/components/live-engine.test.tsx`
- `tests/components/product-integrity.test.tsx`
- `tests/components/simulator-entry.test.tsx`
- `tests/domain/recovery-library.test.ts`
- `tests/domain/training-progress.test.ts`
- `tests/domain/workout-library.test.ts`
- `tests/e2e/athlete-secondary.spec.ts`
- `tests/e2e/beta.spec.ts`
- `tests/e2e/coach-workspace.spec.ts`
- `tests/e2e/daily-training.spec.ts`
- `tests/e2e/dashboard.spec.ts`
- `tests/e2e/disclosures.ts`
- `tests/e2e/fixtures.ts`
- `tests/e2e/lab.spec.ts`
- `tests/e2e/live-engine.spec.ts`
- `tests/e2e/platform.spec.ts`
- `tests/e2e/playbook-integrity.spec.ts`
- `tests/e2e/privacy-foundation.spec.ts`
- `tests/e2e/product-integrity.spec.ts`
- `tests/e2e/recognition.spec.ts`
- `tests/e2e/recovery-library.spec.ts`
- `tests/e2e/simulator-entry.spec.ts`
- `tests/e2e/tactical-engine.spec.ts`
- `tests/e2e/workout-library.spec.ts`
