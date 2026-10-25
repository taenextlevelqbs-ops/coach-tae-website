# QB LAB integrated platform — implementation review

This records the underlying platform implementation. [Personal quarterback development](QB-LAB-PERSONAL-EXPERIENCE.md) supersedes its visual direction, dependency versions and latest validation/delivery results.

## Scope and release boundary

This implementation extends `feat/qb-lab-experience` from `8f91b72` for draft PR #3. It is a substantial, connected **local prototype plus a locally tested private-service foundation**, not a finished production platform. No main merge, production change, real athlete registration, private video ingestion, paid service provisioning or payment activation is performed. Phase 0/PR #2 remains separate and unchanged.

The public website, booking destinations, training prices and SEO remain unchanged. No new npm dependency or lockfile change is needed. Existing branding assets are reused; all new diagrams and movement frames are authored SVG, not team assets. No Crestlane Digital source or other portfolio site was available/inspected; engineering quality is assessed through these tests and architecture, not an unsupported claim of equivalence.

## Truthful feature matrix

| Module | Implemented and verified | Prototype only / blocked / not implemented |
| --- | --- | --- |
| The Lab / Command Center | Application entrance with no numbered navigation, tool launcher, real persisted-event counts, open assignments, direct activity links and local playbook counts. | Synthetic profiles; no authenticated personalization, connected calendar or real coach feed. Original in-tab observation checklist remains separate from persisted history. |
| 2D QB Simulator | Coordinate field, bounded keyboard/touch QB movement, six deterministic tackle/5v5/7v7 spacing/rotation scenarios, pre-snap inspection, snap/pause/restart, speed, manual timeline, target selection, bounded two-check rubric, recorded decisions and custom saved-play playback. | **Prototype only.** Geometry is executable/tested, not a validated football recommendation. No ball flight, catches, collision, pass rush, blocking, eligibility, coverage classifier, realistic physics or athlete rating. Full coaching review is pending. |
| Playbook Studio | Spread/compact rosters, 11v11/5v5/7v7, pointer dragging, keyboard marker movement, numeric alternatives, route tapping and point editing/removal, labels, undo/redo, bounded save/load/delete/import/export, matching simulator integration. | **Prototype only.** No authenticated cloud sharing, real-time collaboration, league legality validation or concept publishing approval. The QB is user-controlled in the simulator, not a drawn receiving target. |
| Football IQ | Existing three source-backed observation prompts, feedback, selectable diagram focus, simulator launch and actual completion events. | Full coverage, blitz, progression, situational and two-minute curricula **not implemented**. Geometry scores do not certify a coaching answer key. |
| Workouts | Five guided introductory activities, age/experience/pathway/focus filters, steps, suggested discussion time, equipment/safety notes, one completion per guided run, assignment completion and reload persistence. | **Prototype content requiring review.** Not a complete conditioning, accuracy, throwing, shoulder-health, strength or recovery program; no medical/rehabilitation prescriptions. |
| Mechanics Studio | Moving five-phase 2D figure, setup/pocket studies, play/pause/replay, manual slider/phase choice, front/side schematic variants, setup ghost comparison and actual inspection completion. | **Prototype only.** No validated mechanics instruction, motion capture, joint measurement, realistic rig, biomechanics assessment or 3D. |
| Progress Center | Actual self-reported activity/decision history, profile-labeled events, local goals, counts, JSON restore/export and confirmed reset. | Browser-local, untrusted and bounded; no longitudinal athlete-improvement or coach-verified performance claims. |
| Family Hub | Fixed demo A/B, separate assignments and local event summaries, direct profile-specific guided activity launch, existing per-profile communication preferences/export. | Guardian-authorized real information, legal consent, scheduling, real messages and billing **blocked by unprovisioned backend/integration**. Preferences are not consent. |
| Coach Admin | Explicitly public **coach sandbox**: fixed directory, age/pathway-filtered assignments, deduplication, status/revocation and illustrated review link. | Real protected operations, review queue, coach authentication, curriculum publication and organization management **not implemented**. A demo role is never a server permission. |
| Film Room | Illustrated player, timestamp notes/tags/comparison and a correction action connected to actual local assignments/workouts. | Real uploads, private playback, coach-written reviews, processing, voice/drawing tools and released feedback **not implemented/disabled**. |
| Auth / database / consent | Session-verifier interface, tested private-resource policy kernel, candidate PostgreSQL migration with ten RLS-protected tables and local isolation tests. All real-data API operations fail closed. | Managed auth/session cookies, verified-adult/guardian onboarding, provider integration, live consent evidence and hosted RLS verification **blocked and unimplemented**. No fake login or account creation. |
| Private media | Tested authorization/retention/release predicates, bounded metadata preflight, quarantine/release/deleted schema and fail-closed route. | Actual private buckets, signed capabilities, magic-byte/decode/malware processing, upload quotas, transcode, deletion workers/backups and storage tests **not implemented**. Metadata checks alone are not secure upload validation. |
| Premium services | Existing public Calendly booking unchanged; entitlement policy and candidate provider-event uniqueness boundary. | Plans/prices, checkout, memberships, payment webhooks, invoices and premium fulfillment **not implemented/disabled** pending approval/configuration. |
| Future 3D | Pure domain models, deterministic timeline/evaluator and separate React/SVG renderer create an adapter boundary. | 3D renderer, assets, rig, animation validation and physics **not implemented**. |

## Connected local workflows

- Build/edit a play → save in browser → choose the matching tackle/flag roster in Simulator → select “My play” → make a geometry decision → see the real recorded event in Progress Center after reload.
- Coach sandbox or illustrated Film Room → assign a fixed correction → Command Center/Family Hub → open the exact activity/profile → walk the steps → record completion → matching profile's assignment becomes complete. Completing demo B does not complete A's matching assignment.
- Football IQ observations / Mechanics phase inspection → record an actual interaction event → Progress Center history and counts update. These events never claim physical practice or improved ability.

## Simulation and football validity

The pure engine samples piecewise-linear authored paths deterministically. The six-second window and 1.5-second observation delay are **toy exercise parameters, not flag league rules**. One geometry point is awarded when the nearest drawn defender is at least 12 schematic units from the selected route at the chosen time; another when the route point is ahead of the controlled QB. Outside the decision window, missing targets score zero. The visible rubric and feedback disclose the threshold. The QB practice area is X 30–70 / Y 74–94; saved starts are constrained to it. No real passing outcome is predicted.

Tackle uses eleven players; flag uses distinct five/seven player rosters and a separate context. Flag explicitly includes girls flag; gender is not used to invent a rulebook or impose different physical assumptions. Exact league/body/season rules, eligibility and coach-approved answer keys still need selection and review. The [existing source review](QB-LAB-FOOTBALL-REVIEW.md) supports the observation introduction; no new claim that the synthetic simulator is endorsed or fully coach validated is made. Workouts and mechanics need qualified movement/content review before physical instructional use.

## Local persistence and privacy

`platform/store.ts` validates a versioned JSON schema, bounds file input to 250 KB, limits plays/routes/activities/assignments, rejects invalid coordinates, duplicate IDs, unsupported rosters/scores and unknown assignment content, and reconstructs only allowed fields. Imported SVG/HTML/scripts are never executed; SVG is rendered from typed coordinate data and React-escaped labels. This is not a secure vault: use synthetic play names and no personal/medical information. Imported events remain untrusted, not coach verified.

Persistence uses `useSyncExternalStore` with a stable empty server snapshot for hydration. The play repository abstraction can later be replaced by a genuinely authenticated server adapter. Browser write failures are reported; the UI must not claim a durable save when only in-memory state exists. History retains the most recent 200 events; playbooks have a 20-play cap and routes eight points. Export before clearing or relying on browser data. Local state has no server backup, cross-device sync, trusted clock, tamper resistance or multi-tab concurrency guarantee. Private services never trust it. Pathway selection, original Film Room tags and original communication preferences remain in memory unless specifically recorded through the new workflow.

## Private foundation and tested migration

See [server boundary/prerequisites](../server/qb-lab/README.md), [candidate migration](../db/migrations/001_qb_lab_candidate.sql) and [database test script](../scripts/test-qb-lab-database.sh). Ten candidate tables cover adult accounts, athletes, verified guardian links, consent evidence references, explicit coach grants, film metadata, feedback, tasks, entitlements and audit. Direct anonymous/authenticated writes are revoked; private reads use explicit ownership, consent and coach scope. Feedback uses a composite athlete/film foreign key. Administrator labels grant no implicit child-data access.

The migration was actually applied in an ephemeral local PostgreSQL container with **no network and no published ports**, using a pinned image digest. Synthetic `auth.users` / `auth.uid()` fixtures replace the future managed identity integration; they are not a JWT verifier and are not part of the migration. Tests cover adult/guardian/coach isolation, released versus quarantined/deleted media, consent revocation, denial of anonymous data access and client role mutation, and rejection of cross-athlete feedback joins. The container is removed after testing. No hosted database or production migration was run.

`/api/qb-lab/private/*` returns 503/no-store for GET/POST/PUT/PATCH/DELETE without reading or forwarding request bodies, even with forged client roles. Adding environment variables cannot turn it on. A managed provider session verifier, HttpOnly/Secure/SameSite cookie handling, CSRF/origin checks, invitation/recovery/rate limiting, verified consent process, private quarantine/storage processing and deletion/retention workers remain external implementation gates. The process has no configured Supabase URL/service key, payment-provider secret or Vercel API token; only presence was checked, never credential values. Owner-approved provider/region/budget and privacy/coaching decisions remain necessary.

## Quality and release controls

The new PR workflow has read-only permissions, pinned actions, lint/type/unit/database/build/browser checks and a separate complete/production dependency audit. It does not deploy or use privileged secrets. The full audit intentionally stays failing while the known braces advisory remains; no suppression, overrides or downgrade. Existing Phase 0 workflow/branch/PR #2 is not changed.

The known development chain remains `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`: **zero critical / five high**, production **zero findings**. Dependency manifests are unchanged. Existing ESLint support debt and unvalidated Node 22 Dockerfile versus tested Node 24 tooling remain. CI results cannot be inferred from local success.

## Validation evidence

- Lint and TypeScript passed; component/domain suite **23 passed**, zero failures/skips.
- Production build passed all 18 generated entries, including 12 QB LAB screens, the fail-closed private route and query-aware activity launch.
- Final post-refinement browser suite **132 passed**, zero failures/skips, 3.7 minutes. Four viewport projects: 1280, 768, 390 and 320 px; Chromium, zero retries, two workers.
- All 12 QB LAB screens passed the configured WCAG 2 A/AA, 2.1 AA and 2.2 AA axe checks. The mechanics comparison state was additionally scanned after its pressed-button contrast correction. Automated checks are not real-device/screen-reader certification.
- Browser workflows verified keyboard/touch movement, timing/decision history, play save/reload/custom simulation, invalid import rejection, numeric and drag/draw route editing, guided activity/assignment completion, profile A/B isolation, storage denial and forged-role private API denial.
- Existing homepage navigation, mobile menu, all nine Calendly anchors, price strings and page title/SEO regression checks passed at all four widths. Booking providers were not visited.
- PostgreSQL **17.11** migration/isolation checks passed using the pinned image in `scripts/test-qb-lab-database.sh`, including cross-athlete feedback foreign-key rejection. No hosted DB migration occurred.
- Workflow YAML parsed with read-only permissions, no pull_request_target and no deployment command. A changed-file credential-pattern scan found no matching private-key/live-key patterns; this heuristic is not a security audit certification.
- Full npm audit: zero critical / five high development findings; production audit: zero. Dependency manifests unchanged; no suppressions or incompatible overrides.

The first 120-case browser pass had 116 successes and four failures from one ambiguous status selector (coordinate output versus decision feedback). Named feedback resolved it. A subsequent 128-case run passed, then drag/draw coverage increased the suite to 132, which passed. No assertion was disabled or reclassified as skipped/expected failure.

## Screenshot review

Captured 36 desktop/mobile/tablet PNGs under `/workspace/artifacts/qb-lab-platform/` (all 12 screens at 1440×1000, 390×844 and 768×1024), exercised with real synthetic local events rather than invented counters. Initial inspection identified a low-contrast pressed mechanics control, crowded formation markers and a narrow mobile scenario selector. Fixes add a scoped pressed-state palette, distinct default positions and full-width mobile toolbar fields. The refreshed captures were inspected; diagrams remain schematic, not legal formations or measured movement. Original public-site files and assets remain unchanged. Screenshots and browser reports stay outside tracked source.

## Preview and review delivery

Only `feat/qb-lab-experience` is authorized for normal pushing. No merge, production promotion or PR #2 change is performed. PR #3 must remain a draft. API access previously returned Forbidden and the Vercel dashboard failed at the environment proxy with HTTP 403; no Vercel token is configured. A push is not proof of a started/Ready Preview. Actual post-push status and the latest commit are reported in the final response.

If API access remains blocked, open PR #3, paste `docs/QB-LAB-PLATFORM-PULL-REQUEST.md` as the description, keep it a draft, and use the newest Vercel Details check to confirm the matching branch/SHA, **Preview** environment and **Ready** status. No deployment URL is guessed. For real-data functionality, complete the concrete prerequisites in `server/qb-lab/README.md` and obtain privacy/content/pricing approvals; current feature flags cannot bypass the disabled API.


The final mobile toolbar refinement was rebuilt and the entire 132-case suite passed again. Refreshed desktop/mobile/tablet captures completed with no horizontal overflow. Test containers and screenshot servers were stopped after use.

## Changed-file manifest

- `.github/workflows/qb-lab-platform.yml`
- `README.md`
- `app/api/qb-lab/private/[...operation]/route.ts`
- `app/qb-lab/access/page.tsx`
- `app/qb-lab/coach/page.tsx`
- `app/qb-lab/lab.css`
- `app/qb-lab/mechanics/page.tsx`
- `app/qb-lab/playbook/page.tsx`
- `app/qb-lab/progress/page.tsx`
- `app/qb-lab/simulator/page.tsx`
- `app/qb-lab/workouts/page.tsx`
- `db/migrations/001_qb_lab_candidate.sql`
- `docs/QB-LAB-FRONTEND-REVIEW.md`
- `docs/QB-LAB-PLATFORM-PULL-REQUEST.md`
- `docs/QB-LAB-PLATFORM-REVIEW.md`
- `docs/QB-LAB-REDESIGN.md`
- `modules/qb-lab/Athlete.tsx`
- `modules/qb-lab/Family.tsx`
- `modules/qb-lab/FootballIQ.tsx`
- `modules/qb-lab/LabShell.tsx`
- `modules/qb-lab/Landing.tsx`
- `modules/qb-lab/ReviewNotes.tsx`
- `modules/qb-lab/platform/Access.tsx`
- `modules/qb-lab/platform/ActivityDesk.tsx`
- `modules/qb-lab/platform/Coach.tsx`
- `modules/qb-lab/platform/Mechanics.tsx`
- `modules/qb-lab/platform/Playbook.tsx`
- `modules/qb-lab/platform/Progress.tsx`
- `modules/qb-lab/platform/Workouts.tsx`
- `modules/qb-lab/platform/catalog.ts`
- `modules/qb-lab/platform/store.ts`
- `modules/qb-lab/simulation/SimField.tsx`
- `modules/qb-lab/simulation/Simulator.tsx`
- `modules/qb-lab/simulation/engine.ts`
- `modules/qb-lab/simulation/model.ts`
- `modules/qb-lab/simulation/scenarios.ts`
- `scripts/test-qb-lab-database.sh`
- `server/qb-lab/README.md`
- `server/qb-lab/authorization.ts`
- `tests/database/auth-fixture.sql`
- `tests/database/isolation.sql`
- `tests/domain/engine.test.ts`
- `tests/domain/security.test.ts`
- `tests/domain/store.test.ts`
- `tests/e2e/platform.spec.ts`
- `vitest.config.mts`
