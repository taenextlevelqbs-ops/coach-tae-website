# Tactical engine: spatial field, fronts and split coverage

Current behavior correction (2026-10-23): the quality pass removes all timer-driven protection outcomes and separates spot-drop quarters from match. Historical validation below describes the earlier delivery; see QB-LAB-QUALITY-PASS.md and QB-LAB-GAMEPLAY-ACCEPTANCE.md for current evidence.

## Delivered teaching workflows

Use `/qb-lab/playbook` to select a tackle play, choose left/middle/right ball hash, declare formation strength, optionally choose an 85% boundary break-depth adjustment, edit routes and save locally. The canvas and selected-player yard readout use the same projection as the live engine; pointer edits use its inverse. Load that exact saved play at `/qb-lab/simulator/engine`. Configure Over/Under, coverage, split half side, a 10/11/12-yard match trigger and the optional high-school pocket teaching preset. Make a coverage hypothesis before snapping; Learn starts paused and Step advances 0.2 seconds. Learn displays authored spatial windows; these are revealed teaching responsibilities, not evidence that a pre-snap shell guarantees coverage.

For a non-contact 7v7 demonstration select that environment, select Cover 2, review the event width/length/pass clock, explicitly acknowledge its custom rules, make a hypothesis and snap. Seven defenders have two deep halves and five underneath pockets. No rusher, blocking, blitz or physical QB contact is activated. Flag formats remain separate configurable pathways; no high-school hash rule or passing-event contact rule is imposed on them.

Everything remains synthetic/browser-local. The approved athlete dashboard, public coaching website, booking links and private-service lockouts are preserved. No account, private upload, billing, cloud infrastructure or production changes are included.

## Exact field math and compatible authoring

- High-school width is **160 feet / 3 = 53⅓ yards**, not the rounded 53.3/53.33 used as an exact simulation value.
- Hash inset is **(53 + 4/12) feet / 3 = 17 7/9 yards**. Left ball x is that inset; right x is width minus inset; middle x is width/2. Left hash has a left boundary/right field side, and vice versa. Middle has no shorter side. Formation strength is a separate declared concept and need not equal the field side.
- Existing editor files remain normalized for compatibility: x 0–100 spans the width, editor y=70 is LOS, and two vertical editor units equal one yard. Physical world y = LOS + (70−editor y)/2; LOS-relative depth is world y−LOS. Rendering can stretch the schematic for phone readability; world distances are still yards, not pixels.
- Wide alignment/route x is mapped independently on either side of the ball so boundary and field space change with the hash. OL/C/QB/RB/DL starting offsets remain rigid relative to the ball rather than compressing protection splits. The optional boundary adjustment scales positive route depth, so the route reaches its break earlier at the same movement speed. Default depth is unchanged. This is a selected coaching adjustment, not a claim that all boundary routes always break at a fixed percentage.
- `tactics` stores hash, declared strength and boundaryBreakScale (bounded 0.75–1) with the play. Import validation rejects invalid values, and sanitized import/export retains only allowed metadata. Compact/spread/personnel edits retain the tactical settings. Legacy plays without metadata continue to work.
- A hash-tagged tackle play requires the 160-foot field; projected starting positions outside the field are rejected. This is structural validation, not certification of all numbering, formation, motion or governing-body rules.

`football/geometry.ts` supplies the shared forward/inverse transforms, exact constants and spatial zone contracts. Live-engine actors, playbook canvas and defensive builders consume these contracts. The earlier recognition/spacing tools remain schematic; this work does not claim a complete rewrite of all historical illustration physics or a new serialized yard-coordinate file format.

## Defensive fronts and terminology

Over and Under are distinct front selections. Their interior positions derive from the actual center/guard locations and the declared strong side. The authored Over example uses a strong-side outside-guard 3-technique and weak-side center shade 1; Under reverses that interior emphasis (weak 3, strong 1). These are examples, not the only Over/Under family. Personnel remains independent of the shown surface and rush assignment.

**An inside shade of the guard is 2i, not 1.** A 1-technique shades the center. The existing technique lesson retains this distinction. X/H/Y/Z remain configurable receiver labels; no route or fixed position is inferred solely from a letter. Coach Tae must review technique spacing, strength declarations, linebacker adjustments and run-fit teaching before treating these examples as a complete defensive system.

## Advisory protection timing display

The optional synthetic timing target is display-only. It never changes blocker recovery, engagements, pursuit, pressure, contact or outcomes. There is no movement time extension. The tackle OL arc works independently of this display. Default timing values remain illustrative rather than measured high-school protection standards.

Current protection uses geometric assignments/engagements, lateral leverage, bounded bull-drive displacement, actual control sheds and RB/TE scan toward uncovered or recovering-blocker threats. A helper must physically reach engagement range. Man/slide priority remains simplified, and coordinated stunt exchanges/full protection communication are incomplete. Neither four rushers nor a blitz guarantees a particular protection duration.

## Spatial coverage behavior

`deepZones` supplies non-overlapping horizontal bounds. Deep Cover 2 halves begin at 15 yards; quarters have a selected vertical trigger of 10–12 yards. Man calls retain their existing assignments. Zone defenders react to current observed receiver positions inside their assigned area, log acquisitions/releases and return to a landmark when that area empties. After a response delay they can break toward the nearby visible ball, without inspecting its future landing point. They do not inspect a receiver's future route to acquire a target.

- **Cover 4:** four spot-drop quarters; no permanent automatic man carry. **Quarters match:** explicitly selected limited vertical-match exercise in which a defender can claim a receiver that actually reaches its quarter beyond the trigger and carry that receiver across a later boundary. This is one match branch, not a universal rule for all Cover 4 (spot-drop quarters and other pattern-match rules differ). Multiple verticals, switches, brackets, poach and complete match-system checks remain outside this example.
- **Cover 6:** default **left half / right quarters** in this implementation, matching this task's requested demonstration. The half side is explicitly configurable rather than implied universally by the name. Deep defenders use appropriate safety/corner identities; the remaining corner is underneath. The quarter side uses spot-drop here, not a silently selected match system.
- **Cover 8:** an explicitly local/system-dependent inverse-split label. Default half coverage goes to the field side of a hash spot; at middle it falls back to declared strength. Quarters protect the other side. An explicit half-side override wins. “Field” and “strong” are not assumed synonymous, and Cover 8 is not taught as a universal naming standard.
- **Passing 7v7 Cover 2:** two deep safeties and five underneath horizontal ownership pockets named Left Flat, Left Hook-to-Curl, Middle Hole, Right Hook-to-Curl, Right Flat. When a receiver crosses a horizontal boundary, the old defender returns to its landmark and the next defender reacts. Shared boundaries are half-open, so one receiver is not simultaneously owned by two adjacent underneath windows. Deep/underneath vertical overlap or help does not make a man assignment.

Live-engine geometric catch/interception/pressure calculations remain in use; this is a bounded teaching simulation, not validated biomechanics or a complete league rulebook. The specified field dimensions are implemented mathematically; coaching durations, local coverage names, match triggers, front fits and boundary adjustments require Coach Tae's content approval. No independent NFHS-rulebook or coach certification is claimed by passing tests.

## Verification and review

Lint, TypeScript, production build and **107 component/domain tests** pass. New tests cover exact dimensional arithmetic, inverse transforms, import retention/rejection, actual hash alignment, Over/Under shades, split-zone widths/boundaries, observed-only vertical acquisition/carry, 7v7 personnel/zone exchanges/no rush, the earlier bounded deadline and extension behavior. That behavior has since been removed; current tests prove identical physical events with the advisory display enabled or disabled. The new desktop browser workflow passes with automated accessibility checks. The complete browser suite passed 240 tests across all four viewports (zero retries/skips). After the final center-at-ball validation guard, lint/typecheck/unit/build passed again and all 16 affected playbook/import/tactical browser flows passed on the final source. The full 240-case run precedes that final guard; it is not represented as a second complete run.

The security audit remains five existing high development findings involving braces, zero critical; production audit zero findings. No dependencies changed or checks were suppressed. Production/private services remain disabled and PR #3 must stay draft. Deployment/CI status must be verified against the resulting exact commit; local success alone does not establish hosted readiness.


Desktop and landscape-phone screenshots from the final local production build were visually inspected: exact hash markers, split coverage windows, the left-hash QB alignment and the earlier stepped teaching countdown are visible (superseded by the current display-only target). The mobile playbook capture shows the 17.78-yard center readout and projected routes. No horizontal page overflow was found in the captured engine viewports. Artifacts (outside tracked source): `/workspace/artifacts/qb-lab-tactical-engine/pocket-desktop.png`, `pocket-mobile-landscape.png`, `field-desktop.png`, `field-mobile-landscape.png`, `playbook-mobile.png`. These are local renders; remote Preview/CI status is checked after publishing.

## Changed files
- `docs/QB-LAB-PLATFORM-PULL-REQUEST.md`
- `docs/QB-LAB-TACTICAL-ENGINE.md`
- `modules/qb-lab/football/content.ts`
- `modules/qb-lab/football/geometry.ts`
- `modules/qb-lab/live-engine/EngineField.tsx`
- `modules/qb-lab/live-engine/EngineLab.tsx`
- `modules/qb-lab/live-engine/blocking.ts`
- `modules/qb-lab/live-engine/engine.ts`
- `modules/qb-lab/live-engine/formats.ts`
- `modules/qb-lab/live-engine/roster.ts`
- `modules/qb-lab/live-engine/spatial.ts`
- `modules/qb-lab/live-engine/tactical-pocket.ts`
- `modules/qb-lab/live-engine/types.ts`
- `modules/qb-lab/platform/Playbook.tsx`
- `modules/qb-lab/platform/store.ts`
- `modules/qb-lab/simulation/SimField.tsx`
- `modules/qb-lab/simulation/model.ts`
- `tests/domain/tactical-engine.test.ts`
- `tests/e2e/tactical-engine.spec.ts`
