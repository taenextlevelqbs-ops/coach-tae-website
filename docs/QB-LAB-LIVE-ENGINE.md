# Master football engine — incremental delivery 1

## What this delivery establishes

The uploaded master request explicitly says not to fake an entire football simulation in one pass and to deliver working demonstrations after each stage. This is the first engine milestone: explicit game environments, a deterministic 11v11 pass-protection/rush/pocket foundation, and a small state-based ball/outcome model to make the rep playable. It is not completion of all thirteen phases or a qualified coaching certification.

Open `/qb-lab/simulator` and choose **Enter live pocket**, or go directly to `/qb-lab/simulator/engine`. The approved home, public coaching website and existing Recognition Lab, spacing simulator, Playbook Studio, workouts, film/family/coach demos remain available. No existing saved play is rewritten. No private services are activated.

## Working demonstrations

1. **Tackle, learn:** default 4-3, even front, Cover 2 from a two-high shell. Choose a possible coverage, snap, step 0.2 seconds, watch engagements, climb/slide/drop using touch or arrow/WASD controls, choose a target, then continue stepping until the ball resolves. Review timestamped events and save the completed rep. Learn mode starts paused; Practice/Challenge advance continuously. Challenge currently adds live urgency, not a distinct scored/age-progressive curriculum.
2. **Protection adjustment:** set six rushers with man protection and no help. The ledger identifies an unaccounted threat. Reset and choose RB help: six rushers can be assigned to six blockers. This does not guarantee successful protection; geometric engagements, attributes, sheds and pursuit determine the eventual result. Help receivers are removed from available passing targets.
3. **Passing competition, not flag:** select non-contact passing 7v7. Set six/seven offensive participants, eligible limit, event clock, field dimensions and context values. Acknowledge this custom exercise. No traditional OL, protection, rush, blitz or QB run is enabled. Changing a clock to six seconds does not create a four-second outcome. Throw before expiry; an already released ball may finish its flight after the clock.
4. **Flag:** select 5v5, 7v7 or 8v8 explicitly. Set distance, delay, pass clock, field, direct-QB-run permission and no-run-zone context, and acknowledge the custom direct-pass exercise. Rusher start position and actual release delay use these values. Prohibited direct runs stop before LOS. A permitted QB run is bounded when the snap is in the configured goal-line no-run zone. Positional contact is called a flag pull, not a tackle. No NFL FLAG preset is silently applied to any format.

The new event configurations are **instructional/custom**, not validated published league presets. Their defaults illustrate editable values, not universal rules. Contact/blocking flag formats, handoffs, laterals and live continuation after a catch are rejected rather than simulated incorrectly. Downs are displayed context, not implemented drive rules; touchdown value is used only for the limited terminal event. Complete event scoring, conversions, dead-ball rules, penalties and eligibility restrictions still need a selected governing body, season/version and coach review.

## Architecture and contracts

| Module | Responsibility |
| --- | --- |
| `live-engine/formats.ts` | Distinct tackle11 / passing7 / flag5 / flag7 / flag8 contracts; explicit rules and capability validation. |
| `live-engine/roster.ts` | Adapter from shared formation/player labels and defensive assignments into yard-based world positions; seeded synthetic attributes, eligibility/format gates. Passing-event roster is separate from flag eligibility rules. |
| `live-engine/types.ts` | Pure actor, configuration, input, event, engagement, ball and outcome state. |
| `live-engine/blocking.ts` | Per-blocker assignments, declared-side threat prioritization for simplified man/half/full slide, RB/TE help, geometric engagement, control loss and recovery. |
| `live-engine/engine.ts` | Immutable fixed 1/30-second stepping, snap, route execution, reactive defensive movement, QB drop/movement, pressure/contact/clock boundaries. |
| `live-engine/physics.ts` | Acceleration-limited movement, seeded throw error, receiver-motion lead, placement offset, ball arc, catch/disruption/interception radii and terminal outcomes. |
| `live-engine/tuning.ts` | Named source-controlled time, flight, pressure, engagement, contact, catch and reaction parameters. Other synthetic rating/steering coefficients remain explicit in their owning functions; no real-athlete calibration is claimed. |
| `live-engine/coaching.ts` | Feedback from recorded events and actual outcomes; links to IQ/workout destinations. No fabricated concept mastery or universal correct progression. |
| `live-engine/report.ts` | Completed-rep projection and validation for local progress: format, seed, outcome, elapsed/release time, peak model pressure, engagements and sheds. |
| `live-engine/EngineLab.tsx`, `EngineField.tsx` | Isolated client UI, visual field, articulated 2D avatar, keyboard/touch controls, readable event ledger; football state is not owned by rendering logic. |

World coordinates are yards, positive Y downfield. Shared schematic coordinates adapt as X × configured width/100 and LOS + (70 − Y)/2. Fields are instructional, not surveyed league fields. The shared schematic adapter retains authored spacing (including wide line splits); OL splits, body scale and motion/engagement parameters are not calibrated to a reviewed protection system. Coach review and dimensional calibration are required before using this to teach specific line technique. One fixed tick resolves movement, engagements, positional pressure, release/clock and ball outcomes in documented code order. Contact/clock at that tick precedes a new throw, so an input at the expired clock cannot rescue it. Wall-clock lag slows the demonstration rather than skipping collisions. Seeded draws are stateless and keyed; the same configuration and per-tick inputs replay identically. This is not cross-platform lockstep certification.

## Rush and pocket scope

The tackle roster has five identified OL, QB and five eligible skill players from the existing shared 10/11/12 fixtures. Personnel/front/shell/coverage/rush count remain separate. A blocker interposes between an assigned rusher and QB. Anchor/pass-block versus synthetic attack ratings control engagement and shedding. Help can account for an additional rusher or double a threat; recovery permits a shed defender to advance. Interior and outside approaches threaten different spaces. An unblocked threat must still travel to the QB; a global three-second sack timer does not exist. An 18-second teaching horizon requests a new rep without inventing a sack.

Bull uses a power/strength comparison; finesse moves use shedding/finesse and outside steering. Interior, edge, crossing/twist, delayed and contain examples have distinct targets/delay. Swim/rip/spin are parameterized approach examples sharing the finesse foundation, **not** complete technique biomechanics or independently validated animation. Slide protection is a declared-side priority model, not a complete protection playbook, ID/Mike communication system or universal assignment key. Missed accounting and failed engagements are represented; designed simulated human assignment mistakes/awareness errors and full protection exchanges are not yet modeled.

Dynamic pocket behavior is the set of actual moving blockers/rushers and their engagement links, not a pre-drawn safe polygon. The QB can drop, hitch/climb, reset, slide, escape/roll out, throw under positional pressure, end a rep with a throw-away, or be reached for a sack/tackle/flag pull. Throw-away ends a teaching rep; intentional-grounding and other penalty adjudication is not implemented. Contact is a radius interaction, not validated injury/contact physics.

## Coverage and passing scope

Tackle calls reuse the shared Cover 0/1/2/3/4/6 and bounded quarters-match assignments. Man defenders pursue the observed assigned receiver; zones gain their landmarks, react to nearby routes and the observed throw after a response delay. Match's selected branch carries a receiver after observed vertical depth, otherwise retaining its quarter; it does not read a future route path to decide whether to match. Shell and called responsibilities remain independent. Non-tackle event examples currently expose Cover 0/1/2/3 with roster-capacity checks for man/deep assignments. More sophisticated event coverage needs coaching review.

Routes use distance/speed-based execution rather than a universal six-second path duration. Throw lead uses current target velocity; seeded error grows with actual movement/pressure. Ball position/height progresses over time. Defender proximity to a low ball can produce interception/deflection; catch proximity at landing produces a completion or miss. Outcomes are not assigned by the receiver button. The ball/receiver parameters are synthetic and tunable, not calibrated to real throwing velocity, ability, catch probability or film assessment. Receiver collision/jostling, releases, full route-option/sight-adjustment rules and catch continuation remain absent.

## Actual progress and data boundaries

Only a completed rep can be recorded; the record button disables after one save in that rep. No geometry score or athlete rating is generated. Engine report fields are bounded and whitelisted on import, while legacy version-1 playbooks/activities remain compatible. Additional imported fields are discarded. Stored reports are user-editable browser-local demonstration data, not trusted records, server-authorized results or verified athlete performance. Per-tick replay/event logs are inspectable during a rep but are not persisted; the bounded summary is. Existing data export/reset controls still apply.

## Master-request roadmap and explicit incomplete mechanics

| Area | This milestone | Later work, not claimed complete |
| --- | --- | --- |
| Environment separation | Distinct validated game contracts and playable limited examples | Versioned governing-body presets and full event/flag rules. |
| Tackle protection/rush | Assignments, contact engagement, sheds, pressure, sacks and QB pocket control | Calibrated biomechanics, complete slide/ID exchanges, authentic individual move animations. |
| Offensive intelligence | Shared X/H/Y/Z labels and existing 10/11/12 formation/playbook routes | 20/21 personnel, all requested formations, motion/shifts, concept catalog, hot/sight/protection curriculum, RPO. |
| Defensive fronts | Existing five groups, six authored surfaces, shared techniques/box observations | Over/under, Tite/Mint, full A/B/C/D run-fit/strength/field-boundary teaching and 7-technique review. |
| Run defense | Coverage defenders pursue an observed QB beyond LOS; simple terminal contact | Designed runs, run blocking, handoffs, backfield recognition, play action, screen reactions, complete run/pass conflict/run fits. |
| Coverage | Bounded existing calls plus reactive movement | Tampa 2, 2 Man, robber, Cover 3 match, complete route exchanges/leverage/recognition logic. |
| Ball outcomes | State-based arc/lead/error, completions, deflections, interceptions, misses | Calibrated catch/accuracy/flight model, catch continuation and detailed target-location UI. |
| Avatar | Articulated 2D stance, moving legs, drop/reset/release/follow-through states | Three-/five-step technique and shoulder/hip biomechanics, motion-capture review, rigged 3D prototype and measured performance evaluation. |
| Teaching | Learn step-through, continuous practice/challenge, observations, factual feedback and local summaries | Age-reviewed curriculum, concept/progression mastery, distinct scored challenges and engine-specific coach assignments. Existing recognition assignments remain working. |

3D evaluation at this stage is an architecture decision only: Three.js/React Three Fiber could supply rigged animation, but require reviewed models/clips, mobile performance/accessibility checks and additional dependency review. No packages or untested 3D assets were added. Preserve the working 2D fallback while correctness and content review precede a measured 3D prototype. No runtime 3D benchmark is claimed.

## Football validation / owner decisions

Existing source reviews are in `QB-LAB-FOOTBALL-MODELS.md` and `QB-LAB-FOOTBALL-REVIEW.md`. They establish limited terminology/rule context; they do not approve the new engine's synthetic interaction coefficients. No new event preset is labeled governing-body validated. Coach Tae must approve techniques/assignments, player spacing, teaching language, protection conventions, progression keys, age suitability and selected league/version rules before this becomes a published curriculum.

No real minor accounts, private video uploads, payments, database changes, paid services or production deployment. Keep PR #3 draft and preserve main/PR #2. Final local validation and delivery evidence are recorded below.

## Changed-file manifest

- `README.md`
- `app/qb-lab/application.css`
- `app/qb-lab/simulator/engine/page.tsx`
- `docs/QB-LAB-FOOTBALL-MODELS.md`
- `docs/QB-LAB-LIVE-ENGINE.md`
- `docs/QB-LAB-PLATFORM-PULL-REQUEST.md`
- `modules/qb-lab/live-engine/EngineField.tsx`
- `modules/qb-lab/live-engine/EngineLab.tsx`
- `modules/qb-lab/live-engine/blocking.ts`
- `modules/qb-lab/live-engine/coaching.ts`
- `modules/qb-lab/live-engine/defaults.ts`
- `modules/qb-lab/live-engine/engine.ts`
- `modules/qb-lab/live-engine/formats.ts`
- `modules/qb-lab/live-engine/physics.ts`
- `modules/qb-lab/live-engine/report.ts`
- `modules/qb-lab/live-engine/roster.ts`
- `modules/qb-lab/live-engine/tuning.ts`
- `modules/qb-lab/live-engine/types.ts`
- `modules/qb-lab/platform/Progress.tsx`
- `modules/qb-lab/platform/store.ts`
- `modules/qb-lab/simulation/Simulator.tsx`
- `tests/components/live-engine.test.tsx`
- `tests/domain/live-engine.test.ts`
- `tests/domain/store.test.ts`
- `tests/e2e/live-engine.spec.ts`

## Local verification

- `npm run lint`: pass.
- `npm run typecheck`: pass.
- `npm test`: 52 component/domain tests pass, including repeatable stepping, format/roster/eligibility boundaries, saved-play adaptation, physical engagement, blitz accounting, positional sacks, no arbitrary sack timer, delayed rush, QB movement, no-rush passing7, actual coverage reaction/rotation, ball outcomes, report validation later-arriving double-team evidence, and actual RB engagement ahead of the QB.
- `npm run build`: pass, including the new engine route.
- `npm audit --omit=dev`: zero findings.
- `npm audit`: zero critical, five pre-existing high development findings involving braces. No dependency changes or suppressed checks.

The initial focused browser run exposed an ambiguous exact label; it was corrected with an explicit accessible name, and all 12 focused browser checks passed. A full run was deliberately interrupted to rebuild with final event-log and shared-formation boundary fixes; interrupted output is not counted as final validation. The complete regression run after the RB-anchor/mobile viewport fixes passed all 184 tests across four viewport projects, with no failures, skips or retries. A final hydration-only UI boundary then received its own 16-test browser run (including JavaScript-disabled rendering and six-rusher snap verification), after repeating lint, TypeScript, all 52 component/domain tests and production build. These runs are reported separately rather than counted as unique tests.

## Rendered review

Production-build screenshots are inspected on desktop and mobile, including actual pocket engagement/pressure events, a separate no-rush passing7 view and a bounded mobile field centered on the QB. Capture scripts verify configured actions through the now hydration-gated controls. Workspace review artifacts:

- `/workspace/artifacts/qb-lab-live-engine/pocket-desktop.png`
- `/workspace/artifacts/qb-lab-live-engine/pocket-mobile.png`
- `/workspace/artifacts/qb-lab-live-engine/field-mobile.png`
- `/workspace/artifacts/qb-lab-live-engine/passing7-desktop.png`

Publishing must verify the exact feature commit and Preview deployment. GitHub/Vercel API access was Forbidden in previous deliveries; if still blocked, retain the updated PR body file and report the manual edit, along with publicly observable checks. Neither Preview readiness nor local passing tests makes the known full dependency audit green.
