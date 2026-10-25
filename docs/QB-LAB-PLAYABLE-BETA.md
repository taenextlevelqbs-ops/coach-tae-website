# Playable beta: mechanics, pre-snap decisions and mobile installation

This extends the existing 30 Hz deterministic live engine at `/qb-lab/simulator/engine`. It is a synthetic teaching beta, not real athlete assessment, a complete football game, or completion of the separate authenticated athlete/family platform phase. The approved dark athlete home, public coaching website and existing tools remain intact.

## Pocket and blocking

Each blocker/rusher retains its individual seeded synthetic ratings. The new line-matchup setting changes blocker pass-block and anchor ratings by ±0.15, clamped to 0–1. Existing geometric engagement, shedding, recovery, RB/TE help and actual proximity-based sacks still apply.

Blitz tempo is independently configurable at 0, 0.12 or 0.25. It adds `2 × tempo` yards/second to the rusher's desired maximum movement speed and adds tempo to the engagement attack advantage. Acceleration and geometric contact remain authoritative. Rusher count, personnel, coverage and alignment remain independent; a blitz is never an automatic sack.

`assessment.ts` estimates the shortest remaining threat window from current distance, allowed rush delay, actual protection assignments and relative matchup ratings. Assigned blockers add a bounded hold estimate; unassigned rushers do not. No rush returns no estimate. This number is an advisory forecast that can change as the pocket moves, not a countdown that ends a rep. The selected event's real configured passing clock remains separate.

### Backend calculation

`POST /api/qb-lab/simulator/pocket` performs an actual server-side, stateless calculation using the same engine. It accepts only a bounded standard tackle fixture:

- `rushers`: integer 2–6, default 4.
- `matchup`: balanced / offense-edge / defense-edge.
- `blitzTempo`: finite 0–0.25.
- `help`: none / RB / TE / RB+TE.
- `ticks`: integer 0–120, default 0.

JSON bodies are streamed with a 2 KB limit; unknown fields, identity data, malformed settings and cross-origin browser requests are rejected. Host comparison accounts for Next's internal proxy URL. Responses use `Cache-Control: no-store`. The endpoint has no database, credentials, media, player IDs or writes. The UI's **Estimate pocket window** action calls it and names the result as a standard fixture, not the exact saved formation. Live play remains local and continues if the estimate service is unavailable.

This is not a server-authoritative session or anti-cheat system. Before public multi-user gameplay, add authenticated session contracts and hosting-level rate limits; do not reuse this public calculator as authorization or trusted progress evidence.

## Coverage and throws

Man defenders retain observed receiver tracking. Cover 2 and Cover 3 zone defenders now react to observed nearby routes within bounded horizontal/depth areas rather than only a four-yard circular trigger. Deep defenders retain their landmark floor instead of chasing short routes out of their responsibility. The engine does not inspect a future route to choose a reaction. Existing post-throw reactions and introductory match behavior remain; full match/exchange logic is still outside this milestone.

The synthetic completion estimate starts at 0.90 and subtracts pressure (0.32 × model pressure), QB speed (0.045 per yd/s), very early release, excessive pocket depth, longer range and tight observed receiver separation. It is bounded at 5–95%. These are source-controlled teaching coefficients, not calibrated real-world probabilities or athlete ratings. They require Coach Tae review.

The estimate changes the seeded throw dispersion: error scale is `0.2 + (1 - estimate) × 4`. QB position, current target velocity/lead, manual placement and timing still affect the actual ball. Catch/interception/deflection geometry decides the result; choosing a receiver or seeing a high estimate does not guarantee a completion. The release event describes the estimate; it does not invent an athlete completion percentage.

## IQ and Playbook Studio

The new **Clue. Confirm. Adjust.** lesson has three reviewed decisions: two-high uncertainty, motion clues, and a pathway-specific pressure adjustment. Tackle discusses protection/help and system-dependent quick answers; flag requires the selected league's actual rush/timing/QB-run rules. Existing recognition drills, front/personnel observations, flag rules and animations remain available.

Only a completed lesson records a browser-local activity for the selected synthetic profile. Its validated `review` record stores the actual correct count out of three separately from the old two-point geometry checks. Partial lessons do not record completion. Profile filtering, export/import validation and Progress Center preserve this distinction.

Each saved Studio play now has **Run live rep** linking its exact ID into the live engine. Labels, starts, roles and routes come from the shared play object, including after reload. Changes to the saved play version remount the initial scenario. A missing/deleted ID shows an explicit error instead of silently substituting a formation. Unsupported or unreviewed legacy roles fail configuration validation and remain usable in the original tools. Playbook's tackle/flag5/flag7/flag8 formats map to their matching live fixtures; non-contact passing7 still uses its separately configured authored event roster rather than reinterpreting tackle protection rules.

## PWA and privacy boundaries

The QB LAB-only manifest has standalone display, 192/512 PNG icons, dark theme colors and start URL `/qb-lab`. The main application manifest does **not** force landscape. The install control supports the browser install event and provides iOS/manual menu instructions. HTTPS or localhost is required. No push subscription or notification collection is introduced.

The worker at `/qb-lab/sw.js` registers with scope `/qb-lab`; an explicit `Service-Worker-Allowed` header includes the exact home URL as well as descendants. It has no-store update headers and a self-only CSP. The public coaching homepage is outside its scope.

The versioned cache contains only the public offline guide/CSS/icons/manifest and hashed Next static assets. Runtime asset storage is trimmed, and old QB LAB cache versions are removed on activation. API responses, application-route HTML, RSC/query requests, authorization-bearing requests and media are not cached. No offline athlete record or upload queue exists. Updates do not force-reload an active rep.

An already-open local engine can continue without network access. Opening/reloading a page offline shows the cached mental-rep guide; this is **not full offline simulator navigation**. The limitation is shown in the installation help. Real-device installation and update behavior still require iOS/Android owner QA; headless Chromium cannot certify those OS flows.

## Landscape-only simulator

The simulator layout alone gates portrait play on viewports up to 1100 px. Other pages—including the athlete home, IQ, family and coach—remain usable in portrait. CSS enforces the gate before hydration; after hydration, hidden gameplay is inert. Turning back to portrait pauses live/spacing playback and clears held live movement. Turning landscape again preserves the rep and requires resuming it.

**Enter landscape play** requests fullscreen and the Screen Orientation API on a user gesture. Unsupported browsers receive manual rotation instructions; Safari cannot be promised programmatic locking. Leaving the simulator unlocks orientation and exits fullscreen if this component requested it. Short landscape screens have a wider schematic canvas, upright labels and a persistent passing toolbar during live reps. Starting a phone rep brings the field into view. The full-field overview no longer clips inside a nested scroll area; enlarge/pan controls remain available for closer inspection. Screen proportions are schematic; the engine still calculates distances and contact in yards.

## Validation and release boundaries

Lint, TypeScript, production build and 76 component/domain tests pass. Tests cover causality of matchup/tempo, deterministic server calculations, malformed/oversized/cross-origin input, proxy host handling, observed Cover 2/3 route reactions, pressure/movement/timing penalties, actual release dispersion and validated per-profile lesson completion.

Browser regression adds real orientation/pausing, server estimation, saved-play reload/missing IDs, actual IQ-to-progress flow and service-worker-controlled offline navigation/cache exclusions. Existing gameplay tests now simulate device rotation when entering a simulator; dedicated tests independently verify that portrait play is actually gated. No retry, timeout or security checks were suppressed.

Full regression run: 227 passed and one existing compact coach keyboard/slider test timed out after 30 seconds. That exact case passed an isolated rerun in 3.4 seconds with unchanged assertions and timeout. After final mobile field/toolbar refinements, all 36 simulator/beta browser tests passed across four viewport projects with no retries. The initial full-run timeout remains a test-stability concern; a clean one-run 228/228 result is not claimed.

Production-rendered desktop (1280×900), tablet (1024×768), phone landscape (844×390), phone portrait, preserved athlete home, IQ lesson and offline-guide screenshots were captured and visually inspected. Artifacts are at `/workspace/artifacts/qb-lab-playable-beta/`. The phone field and passing choices are visible together. Real-device OS installation/orientation behavior still needs manual QA. For ongoing PWA update testing, install from the stable branch Preview alias; an immutable commit Preview is useful for review but is not an ongoing update channel.

Fresh production dependency audit: zero findings. Full audit: five existing high development findings involving braces, zero critical. No checks were bypassed. Package and lockfile changes: none. Existing full dependency-audit findings remain a separate release risk; hosted checks must be reported independently from local passing validation.

No real minor accounts, uploads, private storage, payments, production deployment, main merge or PR #2 modification is included. Keep PR #3 draft. Coach review is required for teaching coefficients, situational wording and all system-dependent football examples before wider athlete use.

## Changed files

- `app/api/qb-lab/simulator/pocket/route.ts`
- `app/qb-lab/application.css`
- `app/qb-lab/layout.tsx`
- `app/qb-lab/simulator/layout.tsx`
- `docs/QB-LAB-PLATFORM-PULL-REQUEST.md`
- `docs/QB-LAB-PLAYABLE-BETA.md`
- `modules/qb-lab/FootballIQ.tsx`
- `modules/qb-lab/LabShell.tsx`
- `modules/qb-lab/LandscapeSimulator.tsx`
- `modules/qb-lab/PwaInstall.tsx`
- `modules/qb-lab/football/AdjustmentLesson.tsx`
- `modules/qb-lab/live-engine/EngineField.tsx`
- `modules/qb-lab/live-engine/EngineLab.tsx`
- `modules/qb-lab/live-engine/PocketCheck.tsx`
- `modules/qb-lab/live-engine/assessment.ts`
- `modules/qb-lab/live-engine/blocking.ts`
- `modules/qb-lab/live-engine/engine.ts`
- `modules/qb-lab/live-engine/physics.ts`
- `modules/qb-lab/live-engine/roster.ts`
- `modules/qb-lab/live-engine/types.ts`
- `modules/qb-lab/platform/Playbook.tsx`
- `modules/qb-lab/platform/Progress.tsx`
- `modules/qb-lab/platform/store.ts`
- `modules/qb-lab/simulation/Simulator.tsx`
- `next.config.ts`
- `public/qb-lab/icon-192.png`
- `public/qb-lab/icon-512.png`
- `public/qb-lab/manifest.webmanifest`
- `public/qb-lab/offline.css`
- `public/qb-lab/offline.html`
- `public/qb-lab/sw.js`
- `tests/components/adjustment.test.tsx`
- `tests/domain/beta-engine.test.ts`
- `tests/domain/store.test.ts`
- `tests/domain/worker-policy.test.ts`
- `tests/e2e/beta.spec.ts`
- `tests/e2e/coach-workspace.spec.ts`
- `tests/e2e/dashboard.spec.ts`
- `tests/e2e/fixtures.ts`
- `tests/e2e/lab.spec.ts`
- `tests/e2e/live-engine.spec.ts`
- `tests/e2e/platform.spec.ts`
- `tests/e2e/recognition.spec.ts`
- `vitest.config.mts`
