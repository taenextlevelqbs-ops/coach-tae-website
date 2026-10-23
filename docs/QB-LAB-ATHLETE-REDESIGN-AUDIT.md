# Athlete experience redesign — baseline audit and plan

Audited baseline: `68cb63e`, `feat/qb-lab-experience`, 2026-10-23. This audit records the existing implementation before the requested athlete-experience changes. It is not a completed visual verification or coaching approval. Public coaching pages, PR #2 and production are outside scope; PR #3 remains draft.

## Actual route and component inventory

| Route | Baseline renderer | Finding / change required |
| --- | --- | --- |
| `/qb-lab` | `HomeDashboard.tsx` | Six destinations, Cover 2 sample assignment, Jordan default and old greeting. Replace actual renderer with Alex demo greeting, Today's Training, exactly Workouts/Recovery/QB Simulator/Film Room, one draft coach note. Pending compatible local assignments retain priority over the sample drill. |
| All QB LAB pages | `LabShell.tsx`, `lab.css`, `application.css` | Current Home/Train/Plays/Profile navigation and a second profile picker. Styles layer early light rules, navy/green overrides and blue/gold technical surfaces. Use shared black/charcoal/white components and Home/Train/Simulator/Profile navigation; maintain keyboard focus, profile choice and demo disclosure. Public website styles must not change. |
| `/qb-lab/workouts` | `platform/Workouts.tsx` | Six introductory local walkthroughs with selected-step workflow; not a 24-drill library. Add compact category landing and individual structured drill routes. Preserve existing `?activity=...&profile=...` links and their exact local assignment-completion semantics. |
| `/qb-lab/workouts/[slug]` | Missing | Add actual drill details: distinct purpose/steps, metadata, meaningful diagram when applicable, draft tip, completion and local persistence disclosure. All unapproved technique/dose content remains draft; no invented coaching endorsement. |
| `/qb-lab/recovery`, `/qb-lab/recovery/[slug]` | Missing | Add separate compact categories and exercise details with clear positioning, steps, common mistakes and safety limits. No rehabilitation, healing or injury-prevention claims; pain means stop and involve a guardian/qualified professional. |
| `/qb-lab/simulator` | `simulation/Simulator.tsx` | Legacy playable spacing/recognition and technical choices appear immediately. Replace entrance with three clear Learn/Practice/Challenge modes; Challenge stays preview. Preserve legacy spacing/recognition under a reachable secondary route, actual deep-linked plays and the existing engine. |
| `/qb-lab/simulator/engine` | `live-engine/EngineLab.tsx` | All technical fieldsets visible at once. Keep engine logic, seeds, protection, coverage, input/replay and rules unchanged; move configuration behind closed Advanced Settings. Keep essential guided snap/read controls apparent. |
| `/qb-lab/iq` | `FootballIQ.tsx`, `RecognitionLab.tsx`, `AdjustmentLesson.tsx` | Observation, adjustment and detailed recognition are valuable; detailed recognition dominates beginner content. Retain lessons and exact `?lesson=...#recognition` assignment links; collapse advanced recognition unless a deep link explicitly requests it. |
| `/qb-lab/film` | `FilmReview.tsx`, review components | Full synthetic illustration/submission/review tooling is exposed immediately. Provide clear personal Film Room entry and an explicit sample-feedback disclosure; keep existing timeline, canvas, annotation, submission demonstration and private-service lockouts. |
| `/qb-lab/athlete`, `/session` | `Athlete.tsx`, `DemoSession.tsx` | Existing connected activity/legacy session pages. Retain deep links and pending assignments; simplify presentation and surface next activity without adding top-level navigation. |
| `/qb-lab/playbook` | `platform/Playbook.tsx` | Actual local editing, validation, duplication/import/export and exact engine launch work. Keep accessible inside Train/simulator/profile as appropriate, rather than a fifth home card or extra top-level tab. |
| `/qb-lab/mechanics` | `platform/Mechanics.tsx` | Working 2D phased mechanics tool, explicitly schematic. Preserve and link from training; do not call it a validated motion assessment or real instructional video. |
| `/qb-lab/profile`, `/progress`, `/family` | `DemoProfile.tsx`, platform progress, `Family.tsx` | Synthetic selection and actual browser-local history/assignments are useful. Match shared theme, retain detailed history deeper in Profile and state storage boundaries accurately. No real guardian consent or synchronization. |
| `/qb-lab/coach` | `coach/CoachWorkspace.tsx` | Four-tab synthetic coach planning/roster/strategy/film workspace. Preserve its controls and per-demo relationships; align surface colors without replacing it with the athlete home. |
| `/qb-lab/access`, `/api/qb-lab/*` | Gated account/private service adapters | No approved dedicated project/auth/storage/consent provider. Preserve disabled account/video/billing boundaries and verified server policies. No environment activation or hosted migration is part of this redesign. |

## Implementation order and ownership boundaries

1. Shared monochrome application components and actual Home/LabShell replacement. Four primary cards only; Today links to the intended sample drill or compatible pending assignment. Notification/profile controls must have truthful behavior, not decorative buttons.
2. Structured distinct workout data, categories and dynamic details. Keep draft content/doses explicit and implement meaningful local completion. Optional speech cannot replace text or require a video.
3. Recovery categories/details using the same components and independent safety guidance. No unapproved age-specific prescription or claim of professional review.
4. Simulator entry plus advanced disclosure, preserved legacy/engine/playbook/replay paths. Simplified Film Room with opt-in sample feedback and no live upload implication.
5. Consistency across all nested athlete routes and coach surface; adapt existing regression tests to changed navigation/disclosures while retaining their functional assertions. Run unit/domain, lint, types, isolated SQL, build and full browser/accessibility/responsive checks after source is stable.
6. Visually inspect actual `/qb-lab`, drill/recovery, simulator and film on desktop/mobile. Capture the final exact commit, verify new Preview head and report limitations. Passing tests alone do not establish that the rendered redesign matches the requested composition.

## Preservation contracts

- Do not change public Coach Tae navigation, pricing, Calendly anchors, SEO or production deployment configuration.
- Preserve the fixed-step deterministic football engine and its bounded realism disclosures, blocking/coverage/ball behavior, six reference reps, exact input replay, touch/keyboard controls and landscape handling. No football-engine rewrite is required by this design task.
- Preserve independent tackle, non-contact passing 7v7 and flag rules. Do not infer rush/clock/contact rules from card labels or athlete age.
- Preserve existing saved-play IDs, routes, labels, tactical metadata, local import validation and exact Playbook-to-engine launch. Missing/invalid plays must continue to report errors rather than silently substituting a sample.
- Preserve historical activity and assignment formats. Only actual matching local workflows can complete a specific assignment. Demo history is not a verified performance score or account-synced progress.
- Preserve Film Room sample canvas/timestamps/speed/seek and coach demo workflow behind clear sample disclosures. No file collection, real upload, public storage fallback or private-account authority may be introduced.
- Preserve all existing test assertions about real behavior; adapt routes/selectors to deliberate entry/disclosure changes, without deleting/skipping regressions to accommodate failures.
- Keep all unreviewed football and recovery instructions/doses labeled draft. Tests check structural content and UI behavior; they do not approve safe technique for a particular child.

## Required evidence and known blockers

Required new evidence: exactly four home cards and correct targets, correct Today drill/assignment priority, all 24 workout and 10 recovery records with distinct instructions/safety, actual local completion, advanced controls and existing scenarios/playbooks/replays intact, no horizontal overflow, consistent four-item mobile navigation, accessibility, public-site regression and disabled private services.

The existing five high development findings in the `braces` dependency chain remain a separate security/merge blocker unless a supported patch is verified. Dedicated staging infrastructure, authentication, guardian verification/consent, private media processing/deletion and real coaching review remain unapproved. A Preview with local training completion is a controlled synthetic demonstration, not a real athlete beta, medical product, native application or completed multi-user platform.
