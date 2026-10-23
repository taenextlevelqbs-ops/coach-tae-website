# QB LAB quality pass — verified scope and release limits

This delivery executes bounded engine, training-workflow and readiness batches following the pre-change [release audit](QB-LAB-RELEASE-GAP-AUDIT.md). It does **not** complete the platform roadmap. The approved dark athlete/coach dashboards and existing public coaching pages, prices and Calendly links are preserved. Only the existing feature branch is published for Preview review; no production deployment, merge or PR #2 changes are authorized.

## Implemented behavior

- **Protection:** Remove the forced blocker loss at a pocket deadline and the artificial +1-second movement extension. The optional target is display-only. Physical results are identical with that display enabled or disabled, even with an expired target. The OL arc is independent of it.
- **Assignments:** Replace the center-first greedy line matcher that could assign LT across the formation to the right edge while RT stood idle. Bounded minimum-total-distance matching considers the available five linemen/six threats together; slide declarations retain a priority bias. Spare linemen help a nearby accounted threat. Actual reach, leverage and ratings still decide whether an engagement succeeds. This is not full protection communication or a guarantee against blitzes.
- **Engagements:** Remove the constant engagement-control disadvantage. Near-shoulder leverage affects control, bull-rush advantage displaces the actual anchor at a bounded rate, and free RB/TE helpers scan uncovered or recovering-blocker threats. A scan does not teleport the blocker or invent a pickup.
- **Passing:** Sweep the ball/defender relative planar path across the tick, intersecting the parabolic low-ball height window. This catches reachable balls that discrete endpoints missed. Same-defender control takes priority within that tick; across defenders the earliest contact wins. Catch/control/disruption radii remain simplified teaching parameters, not hand biomechanics.
- **Coverage:** Cover 4 and split Cover 6/local Cover 8 quarter responsibilities are spot-drop. Only explicitly selected Quarters match uses the incomplete observed vertical-carry branch. Spatial defenders log actual target acquisitions/releases and can react to the nearby visible ball after a delay; they do not read its future destination. Full distribution, leverage, poach, switches, communication, Cover 2 Man and Cover 3 match remain open.
- **Replay:** Record actual per-tick inputs for the current rep. Completed reps have a read-only timeline, restart/pause/play and 0.25×/0.5×/1× playback. Sparse checkpoints bound a seek to at most fourteen simulated ticks; at most 37 checkpoints exist over the 18-second horizon. Replay does not accept movement/throws or duplicate progress. Reference rep inspection cannot record athlete activity. Tape/checkpoints are session memory, not account persistence.
- **Playable references:** Six deterministic setups are selectable in the live engine. Play them yourself or inspect the exact authored input replay. [Gameplay acceptance](QB-LAB-GAMEPLAY-ACCEPTANCE.md) records actual events and distinguishes full reps from controlled snapshots. Learn offers pause/step, Practice continuous reps; Challenge is visibly an **unscored preview**, not a developed challenge curriculum.
- **Playbook:** Add independent duplication with a new ID and unchanged source. Reject malformed imported player members safely. Structural formation guards catch forward/offside starts, invalid center/QB identities, offensive roles, duplicate IDs, eligibility and declared personnel inconsistencies. Drafts remain editable; invalid formations cannot launch. Full league-numbering/motion/rules certification is not claimed. Exact starts, labels, routes and supported tactical settings still reach the live engine.
- **Training integrity:** A generic recognition walkthrough cannot complete scenario-specific assignments. It links to the matching interactive recognition lesson, whose exact scenario completion remains authoritative within the local demo. Home/adjustment lessons now respect the selected pathway, changing pathway resets adjustment answers, and Train stays active on nested engine routes. Workout count and family persistence disclosures are corrected.
- **Policy clarity:** Remove the unused competing legacy guardian-media helper. Canonical video authorization retains exact player/coach pairing and denies guardian/admin/foreign-coach playback. Real private/video services remain unavailable. Update cookie documentation; no auth/storage/billing integration or environment is activated.

## Database runner correction

The first published quality-pass head `0e14fac` had a hosted quality failure at the isolated PostgreSQL step (exit 2), despite the same local SQL suite passing. Full authenticated logs remain Forbidden. Independent reproduction with the pinned PostgreSQL image and a synthetic delayed-init script confirms a readiness defect: the image temporarily accepts Unix-socket connections during initialization, then stops that server before starting the final server. A SQL session admitted during that window was terminated with exit 2. This confirms the runner race; it does not prove the unavailable hosted log had that exact cause.

The runner now waits for `127.0.0.1` TCP readiness and uses that same container-loopback transport for psql. The init server has TCP disabled, so it cannot satisfy this check. The image pin, `--network none`, absence of published ports, all migrations/assertions and cleanup remain unchanged. Fresh full SQL checks pass. A second delayed-init run observed Unix readiness at 3 seconds, refused TCP until the final server at 11 seconds, then passed all seven SQL files/three migrations. CI captures synthetic database output in the failure artifact with `pipefail`; no failure is masked. Final hosted status is checked on the follow-up exact commit.

## Football evidence and remaining realism limits

The six seeded reference reps run from validated configuration through actual fixed-step inputs with no mid-rep state editing. Tests assert all four rushers engage before the clean-pocket completion, real RB engagement for six-threat protection, unaccounted pursuit/contact, route-window acquisitions/releases, vertical-match depth, actual ball catch geometry, feedback consistency and exact replay equality.

Edge escape versus interior penetration and the isolated passing-7 zone exchange use explicitly authored starting snapshots. They prove conditional geometry, **not** complete naturally generated edge-win/interior-stunt concepts. Cover 2 flood and Cover 3 stretch references verify the implemented bounded responsibilities; they do not establish a complete reviewed coverage check or best-target answer. See the twelve-requested-scenario evidence table in the acceptance report.

Still partial/missing: complete formation and named-route libraries, authored option reads and motion, discrete three-/five-step drops, coordinated stunts/slide exchanges/run fits, full match families, behind-QB camera, age-progressive challenge scoring, situational curriculum, girls flag lessons and reviewed conditioning plans. Existing spacing/recognition illustrations are separate schematic tools; they do not inherit the live engine's ball/protection physics. No athlete ability or improvement is inferred from synthetic outcomes.

**3D feasibility:** keep the deterministic engine independent of its renderer. A later rigged Three.js/React Three Fiber adapter needs licensed assets/animations, camera/touch design, synchronized field projection, device GPU/battery budgets and validation against the same event fixtures. Current 2D correctness has higher value than a decorative 3D model. No 3D dependency, rig, native app or professional physics claim is introduced.

## Verification

On the final source: ESLint, TypeScript, production build and **142 component/domain tests pass**. This includes twelve gameplay acceptance tests, protection/swept-flight and coverage-event checks, replay identity, safe imports, assignment integrity and private-service isolation. Isolated PostgreSQL migrations and RLS/persistence/billing checks pass using synthetic auth fixtures. No hosted provider/JWT/storage integration is connected.

The complete browser matrix passes **264/264 tests** across desktop, tablet, mobile and compact viewports, with zero retries/skips (9.8 minutes). Ten affected desktop flows also passed after correcting ambiguous test selectors in an interrupted preliminary run. Automated axe checks cover the application, replay and existing flows; public navigation/prices/Calendly, keyboard/touch input, safe imports, exact saved plays, local persistence and private-service lockouts remain covered. Browser assertions establish interface behavior and regressions, not football coaching accuracy.

Desktop/mobile gameplay, replay, the actual dark athlete home and preserved coach workspace are captured from a clean checkout of the final delivery commit using its local production build. Artifacts and an exact-commit manifest are provided in `/workspace/artifacts/qb-lab-quality-pass/`; remote Preview status is verified independently. Physical-device and remote-render visual certification are not implied.

Performance review: reuse the staged roster/configuration until configuration changes; keep replay logic outside rendering and bound its memory/seek work; fixed 30 Hz ticks never skip collision steps because of wall-clock lag. Intervals, orientation/blur listeners and replay playback clean up on exit. This is a code/functional audit, not physical-phone CPU/GPU, battery or browser-engine certification. SVG player/field drawing and whole immutable per-tick state still require profiling on actual target devices before an athlete beta. No new runtime dependency was introduced.

## Security, CI and release decision

Fresh full npm audit: **five HIGH development findings, zero critical**. Production audit: **zero findings**. Chain: `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`. Registry `braces` latest remains 3.0.3, affected by [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). Current supported Next ESLint configuration still introduces it. The suggested downgrade to Next ESLint config 14 is incompatible with this supported stack and was not applied. No override, audit suppression or check bypass is used. A clean production audit does not resolve this development/CI risk.

Baseline `bd1ad5c` hosted quality passed; full dependency audit failed at the audit step (exit 1). Authenticated full logs/API are Forbidden; public annotations and independent local audit substantiate that finding. Final hosted status is checked against the final exact commit after publishing; local success never establishes hosted success.

**Release decision:** suitable only for an explicitly synthetic, supervised engineering/coach review after Preview verification. Not ready for a real athlete beta or public launch. Every coaching approval remains DRAFT in [Coach approval](QB-LAB-COACH-APPROVAL.md). No dedicated staging project, auth/guardian verification, consent provider, private video pipeline, hosted backups/restore, monitoring or durable billing reconciliation is approved/operational. [Owner integration checklist](QB-LAB-OWNER-INTEGRATION-CHECKLIST.md) lists identifiers, decisions, implementation and test gates. Real accounts, child information, personal uploads and payments stay disabled.

## Next bounded batches

1. Coach-reviewed full-play edge-win/climb and interior-penetration fixtures, calibrated protection splits, coordinated assignments/exchanges and explicit drop timing.
2. One complete authored coverage/concept progression at a time, with defender-by-defender responsibilities, route library, option rules, approved answer keys and gameplay evidence.
3. Persist protection/progressions/tags with exact playbook launches; add reviewed passing-event authoring and distinct flag/girls scenarios without claiming universal rules.
4. Age-appropriate training progression and coach workflows; only connect real multi-user data after the independent infrastructure/privacy gates pass.

These items remain unfinished. Their absence must not be concealed behind deployment status or passing tests.

## Changed files in this quality pass

Compared with baseline `bd1ad5c` (includes the pre-change audit commit):

- `.github/workflows/qb-lab-platform.yml`
- `docs/QB-LAB-COACH-APPROVAL.md`
- `docs/QB-LAB-GAMEPLAY-ACCEPTANCE.md`
- `docs/QB-LAB-OWNER-INTEGRATION-CHECKLIST.md`
- `docs/QB-LAB-PHASE-2-FOUNDATION.md`
- `docs/QB-LAB-PLATFORM-PULL-REQUEST.md`
- `docs/QB-LAB-QUALITY-PASS.md`
- `docs/QB-LAB-RELEASE-GAP-AUDIT.md`
- `docs/QB-LAB-TACTICAL-ENGINE.md`
- `modules/qb-lab/Family.tsx`
- `modules/qb-lab/HomeDashboard.tsx`
- `modules/qb-lab/LabShell.tsx`
- `modules/qb-lab/football/AdjustmentLesson.tsx`
- `modules/qb-lab/football/content.ts`
- `modules/qb-lab/football/geometry.ts`
- `modules/qb-lab/live-engine/EngineLab.tsx`
- `modules/qb-lab/live-engine/EngineReplay.tsx`
- `modules/qb-lab/live-engine/acceptance.ts`
- `modules/qb-lab/live-engine/blocking.ts`
- `modules/qb-lab/live-engine/engine.ts`
- `modules/qb-lab/live-engine/physics.ts`
- `modules/qb-lab/live-engine/replay.ts`
- `modules/qb-lab/live-engine/spatial.ts`
- `modules/qb-lab/live-engine/tactical-pocket.ts`
- `modules/qb-lab/live-engine/types.ts`
- `modules/qb-lab/platform/Playbook.tsx`
- `modules/qb-lab/platform/Workouts.tsx`
- `modules/qb-lab/platform/store.ts`
- `scripts/test-qb-lab-database.sh`
- `server/qb-lab/README.md`
- `server/qb-lab/authorization.ts`
- `tests/components/product-integrity.test.tsx`
- `tests/domain/assignment-integrity.test.ts`
- `tests/domain/coach-workspace.test.ts`
- `tests/domain/coverage-events.test.ts`
- `tests/domain/gameplay-acceptance.test.ts`
- `tests/domain/playbook-integrity.test.ts`
- `tests/domain/protection-events.test.ts`
- `tests/domain/replay.test.ts`
- `tests/domain/security.test.ts`
- `tests/domain/tactical-engine.test.ts`
- `tests/e2e/live-engine.spec.ts`
- `tests/e2e/playbook-integrity.spec.ts`
- `tests/e2e/product-integrity.spec.ts`
- `tests/e2e/replay.spec.ts`
- `tests/e2e/tactical-engine.spec.ts`
