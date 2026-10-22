# Shared football recognition models and lessons

## Delivered scope

This extends the existing QB LAB prototype on `feat/qb-lab-experience`. The approved athlete dashboard and application shell remain unchanged. A scoped dark teaching workspace is shared by Football IQ and Simulator 2.0; existing observation lessons, spacing practice, playbook editing, film demonstration, workouts, mechanics, family/coach flows and real browser-local activity history remain available.

### Offense and configurable terminology

`simulation/model.ts` owns the formation factory used by Playbook Studio, simulator scenarios, the new recognition workspace and the foundational IQ/film diagrams. X/H/Y/Z are default eligible-player labels. They are identifiers, not fixed positions, routes or read-order commands. Playbook’s existing label controls now include a bounded custom system label. Saved plays can be selected directly in the recognition workspace; labels and routes are preserved. Internal R1…R9 IDs remain stable to retain existing saved-play compatibility; new default display labels use football terminology.

| Format | Offensive fixture |
| --- | --- |
| 11v11 tackle | Five identified OL (LT/LG/C/RG/RT), QB, RB, X/H/Y/Z. 10 personnel: 1 RB/0 TE/4 WR; 11: 1 RB/1 TE/3 WR; 12: 1 RB/2 TE/2 WR. The same label can represent a different role in another personnel package. |
| 5v5 flag | QB plus four eligible labels X/H/Y/Z; Y is the center in this authored formation. |
| 7v7 flag | QB, eligible center and X/H/Y/Z/RB. |
| 8v8 flag | QB, eligible center and X/H/Y/Z/RB plus an additional eligible E. |

Authored tackle fixtures identify seven players on the LOS, five OL and uncovered eligible ends. Structural validation detects a covered eligible, duplicate labels, missing center/QB, wrong roster count and ineligible receiving routes. It does not certify jersey numbering, motion, substitutions, rulebook-specific eligibility or a complete legal play. Custom playbook drawings remain reviewable sketches. No universal flag eligibility rule is inferred from these example rosters.

### Defensive personnel, surfaces and pressure

| Group | DL | LB | DB |
| --- | --- | --- | --- |
| 3-4 | 3 | 4 | 4 |
| 4-3 | 4 | 3 | 4 |
| 4-2-5 | 4 | 2 | 5 |
| 3-3-5 | 3 | 3 | 5 |
| 5-2 | 5 | 2 | 4 |

Personnel identity, front/surface, safety shell, coverage and pressure are separate structured inputs. A walked-up LB can join a four- or five-player surface without changing the roster’s personnel identity. A DL can drop. No personnel grouping is assigned a universal rush count. The workspace supports 2–6 assigned rushers; Cover 1 is capped at five for this five-receiver fixture to retain five man responsibilities and a deep helper. The pure model applies the same constraint as the UI.

Odd/even, three-/four-man surfaces, Bear (center and both guards covered in the authored look) and overload examples are selectable. Equivalent odd/three-man and even/four-man descriptions are accepted for these specific fixtures. DL techniques are computed relative to the selected formation’s center, guards, tackles and attached TE. Displaced/tied landmarks are marked for review; 6/9 are not invented from a nonexistent attached TE. A/B/C gap labels and the technique glossary describe alignment landmarks, not guaranteed run fits. Mike/Will/Sam/Jack, edge, nickel, strength declarations, Bear terminology, box definitions and technique conventions remain system-dependent.

The observable box count uses an explicitly disclosed schematic region (X 30–70, Y 42–70). It is not presented as a universal box definition. Wide/walked-up markers are possible pressure indicators until post-snap assignments are revealed.

### Coverage responsibilities

All listed personnel groups can use every listed coverage. Starting 0-/1-/2-high shells do not establish the called coverage.

| Call | Authored responsibilities |
| --- | --- |
| Cover 0 | Man assignments on the eligible receivers, no deep helper; extra underneath players can help/observe. |
| Cover 1 | Man assignments plus a deep-middle helper; sufficient defenders are reserved for all five eligible receivers. |
| Cover 2 | Two deep halves and remaining underneath windows. |
| Cover 3 | Three deep thirds and remaining underneath windows. |
| Cover 4 | Four deep quarters and remaining underneath windows; distinct from the match example. |
| Cover 6 | Left-side quarter/quarter and right-side half in this authored split-field example. The split is not automatically assigned by formation strength. |
| Quarters match | A selected vertical-carry/retain-help branch, using receiver distribution and an authored depth landmark. Not a complete match system, Palms curriculum, universal exchange rule or coverage classifier. |

Deep responsibilities prioritize the appropriate DB roles. Corners and remaining man defenders match receivers by their actual initial distribution rather than universal X/H/Y/Z positions. Man and triggered match movement follows the authored receiver path; zone defenders move to their landmarks. Rushers move toward the QB practice area. The chosen college-level defender key is explained in feedback. Underneath defenders’ run/pass conflict is discussed, but a full run-fit, play-action, blocking or protection engine is not implemented.

## Flag pathways and rule enforcement

The requested examples are implemented independently from tackle personnel/coverage terminology:

- 5v5: one rush / three underneath / one deep; two rush / one middle / two deep.
- 7v7: two rush / three underneath / two deep.
- 8v8: three rush / two middle / three deep.

These are instructional alignments, not universal defensive standards. A flag recognition rep cannot start with unconfigured or invalid rules. The 5v5 NFL FLAG introductory summary exposes a seven-yard rush line, immediate designated rush, seven-second pass clock, no direct QB run, no blocking and no contact. The rush line is rendered at the same configured scale used for rusher placement; rush delay affects actual path sampling. The selected clock disables late throws. A prohibited direct QB run is bounded behind the LOS; a custom ruleset that permits running can move the QB across it, where forward-pass controls are disabled.

7v7 and 8v8 never silently inherit NFL FLAG 5v5 rules. A custom teaching configuration requires explicit distance, delay, clock, QB-run, blocking/contact choices and acknowledgment against the governing league’s rules. This is a local teaching configuration, not certified ruleset publication or a replacement for the full rulebook. Blocking/contact flags are disclosed; collision, handoffs/laterals, flag pulling, rusher declarations, no-run zones, eligibility exceptions and full penalties are not simulated. In particular, NFL FLAG handoff/lateral clock/rush exceptions are not modeled because this exercise is a direct-pass rep.

The retained open spacing-practice mode is explicitly a geometry exercise without league rules. It does not claim legal flag outcomes. Rules-aware teaching and enforcement occur in the shared recognition workspace.

## Connected teaching workflow

Every configured rep provides the offensive formation and eligible labels, pre-snap defense, personnel/front observations, a possible-coverage hypothesis, snap/play/pause/step/timeline controls, keyboard/touch QB movement, target decisions and post-snap feedback/responsibility ledger. A short ball-flight illustration shows the selected target. Nearest-defender spacing and pressure proximity explain the schematic result, not guaranteed completions, interceptions, sacks, yardage or player ability. A coverage hypothesis is not scored as confirmed knowledge from the starting shell.

Youth guidance emphasizes counts and permits starting with personnel and coverage observations. Developing/high-school reps add the front; college reps also require a post-snap conflict key. These are instructional levels, not automated athlete classifications or a complete age-specific curriculum.

Completed reps record actual lesson events for the selected synthetic athlete. Resetting permits another real interaction; no background activity, fake rating or invented completion is generated. Local storage remains capped and validated.

`football/presets.ts` provides shared tackle and flag lesson IDs for coach assignments. Coach Admin selects a pathway-compatible preset. The assignment queue and home next-step link open `/qb-lab/iq?lesson=…#recognition`, using that same structured configuration. Completing a rep with the matching called structure completes only that athlete’s matching local assignment; changing the structure does not count as completing the assigned preset. Flag presets still require an explicitly selected ruleset. This is synthetic browser-local workflow, not authenticated coach access.

## Source review and required Coach Tae decisions

Source pages accessed October 22, 2026:

- [NFL FLAG rules](https://nflflag.com/flag-football-rules): directly checked seven-yard rush line, immediate designated-rusher conditions, seven-second direct-pass clock, no direct QB run and no blocking/contact summary. The source describes handoff/lateral exceptions, which are excluded explicitly from this direct-pass exercise.
- [NFL Football Operations glossary](https://operations.nfl.com/learn-the-game/nfl-basics/terms-glossary/): terminology/eligible-player context. This glossary is not a validation of the authored fronts, route paths or coverage branches.

Required owner/coaching review: system-specific receiver and defensive naming, strength/field-boundary conventions, exact front/technique terminology, gap/run-fit responsibilities, coverage leverage and exchanges, progression/decision keys, pressure/protection timing, match-coverage branches and league/version-specific flag configurations. No source endorses the application and no qualified coach sign-off is claimed. An authenticated content-review/publishing workflow remains future work. The UI marks the new content as requiring coach review.

## Verification and boundaries

Verified locally: lint, Next/TypeScript validation, production build and 34 component/domain tests pass. The complete browser suite passed all 172 tests across desktop, tablet, mobile and compact phone projects, without retries or skips. After the final field-magnification refinement, lint, TypeScript, build, 34 unit/component tests and all 16 focused recognition browser tests passed again. Browser coverage includes keyboard field panning, actual completed activity, custom labels, assignment/profile isolation and axe accessibility assertions. Football matrix coverage checks 630 tackle combinations as well as flag rosters, rules and movement constraints. No dependency/lockfile changes, public coaching source edits, auth activation, real athlete accounts, private video ingestion, payments, paid-service provisioning or production deployment are included. The approved home and shell source files are unchanged. Full dependency audit: zero critical / five existing high development findings. Production audit: zero findings. Checks are not suppressed.

The existing hosted quality workflow previously failed in the isolated PostgreSQL step (exit 2); its full logs were blocked by GitHub API access. Database files and that workflow are unchanged by this football enhancement. Hosted results and exact Preview commit are checked at publication. PR #3 must stay draft; main and PR #2 remain untouched.

## Rendered review artifacts

Desktop and mobile screenshots were captured from the final production build and inspected visually. The dark teaching workspace shows the full tackle roster, independent controls and observation workflow; mobile field magnification supports touch/keyboard panning without changing the approved home or persistent navigation. Screenshots are workspace review artifacts, not public athlete data:

- `/workspace/artifacts/qb-lab-football/tackle-desktop.png`
- `/workspace/artifacts/qb-lab-football/tackle-mobile.png`
- `/workspace/artifacts/qb-lab-football/field-mobile.png` (magnified field)

## Changed-file manifest

- `README.md`
- `app/qb-lab/application.css`
- `app/qb-lab/iq/page.tsx`
- `docs/QB-LAB-FOOTBALL-MODELS.md`
- `docs/QB-LAB-FOOTBALL-REVIEW.md`
- `docs/QB-LAB-PLATFORM-PULL-REQUEST.md`
- `modules/qb-lab/Field.tsx`
- `modules/qb-lab/FootballIQ.tsx`
- `modules/qb-lab/football/RecognitionLab.tsx`
- `modules/qb-lab/football/content.ts`
- `modules/qb-lab/football/presets.ts`
- `modules/qb-lab/platform/ActivityDesk.tsx`
- `modules/qb-lab/platform/Coach.tsx`
- `modules/qb-lab/platform/Playbook.tsx`
- `modules/qb-lab/platform/Workouts.tsx`
- `modules/qb-lab/platform/catalog.ts`
- `modules/qb-lab/platform/next-step.ts`
- `modules/qb-lab/platform/store.ts`
- `modules/qb-lab/simulation/SimField.tsx`
- `modules/qb-lab/simulation/Simulator.tsx`
- `modules/qb-lab/simulation/engine.ts`
- `modules/qb-lab/simulation/model.ts`
- `modules/qb-lab/simulation/scenarios.ts`
- `tests/components/lab.test.tsx`
- `tests/components/recognition.test.tsx`
- `tests/domain/football.test.ts`
- `tests/e2e/platform.spec.ts`
- `tests/e2e/recognition.spec.ts`
