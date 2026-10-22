# QB LAB redesign — field notebook / film console

## Design concept (recorded before implementation)

The product is organized as a quarterback's working notebook. Warm off-white pages, ink-blue headings, narrow rules and a compact numbered masthead replace the old fixed sidebar and repeated dark rounded cards. Sky blue connects to the existing Coach Tae public site's accent. Amber denotes a teaching observation, never an ability score. No external font service is added: a locally hosted Barlow Condensed bold display face (Latin WOFF2, SIL Open Font License), readable sans body and monospaced time/sequence labels form the type system. The font and its license are copied from the pinned `@fontsource/barlow-condensed@5.3.0` distribution; it is a static asset, not an added package dependency.

The entrance pairs an oversized editorial statement with a functional, scrubbable field study rather than a stock marketing photo. A numbered session sequence gives the athlete an obvious next rep. Football IQ pairs a dark field with a paper answer sheet and an explicit observation sequence. Film Room is the signature dark console: clip index, large schematic, time ruler, moment bookmarks, editable fixed tags and a timestamped coaching margin. Family Hub is a calmer briefing with separate schedule, coaching and privacy states, rather than an athlete dashboard duplicate.

Evidence inspected: `app/page.tsx`, existing QB LAB modules, scoped CSS, tests and both frontend/football review documents. The public homepage uses black/sky, photographs and large rounded panels; it is preserved. The previous QB LAB uses a dark sidebar, rounded panels and a photo hero. No other portfolio repository or website was inspected, so cross-portfolio originality is not asserted. This redesign's identity is grounded in its information structure and football workflow, not a claim of uniqueness across the internet.

## Boundaries

All diagrams, profiles and coaching notes remain explicitly synthetic. Checklists reflect this tab's actual interactions, not athlete performance. The diagram progression is an observation order, not a prescribed receiver progression or coverage answer key. The prior source review remains applicable. No new league rules or scheme claims are introduced. No real accounts, media, notifications, payments, personal information or persistent storage. Public website files and booking destinations remain unchanged.

## Validation and delivery

Results, screenshot refinements and delivery status will be appended after implementation. Only the feature branch may be pushed; preview deployments are authorized by the owner's redesign request. No merge, production promotion, PR #2 edit or production configuration change is authorized.

## Implemented experience

| Area | Structural and interactive changes |
| --- | --- |
| Navigation | Numbered horizontal masthead; all five destinations visible and wrapping on narrow screens, current-page marker, keyboard skip link and route back to the original site. No hidden horizontal-only menu. |
| Home | Three-line typographic entrance; one primary session action; scrubbable observation board; numbered preparation sequence, separate tackle/flag context and an editorial module directory. |
| Command center | Current-focus / checklist / next-step ledger; real in-tab completion bar; context controls; study workspace and suggested session order. All counts reflect checkboxes, never invented athlete progress. |
| Football IQ | Dark diagram and paper answer sheet; selectable D1/D2/space observation sequence, highlighted marker and explanatory text; original verified observation keys and correct/incorrect feedback preserved. |
| Film Room | Study index, separate starting moments, bounded player, chapter ruler, timestamp coaching margin, moment tagging, duplicate detection, eight-tag limit, revisit/remove controls and moment comparison. Each study keeps its own in-memory tags while mounted; no athlete footage is used. Both studies intentionally share the authored illustration, which is disclosed in the player. |
| Family Hub | Guardian briefing, per-profile record/schedule/feedback empty states, selected-athlete next step, distinct communication desk and privacy controls. No fabricated appointments or released coaching notes. |

The UI has hover, focus, selected, disabled, validation, empty and success states. Native required-field validation remains in the submission dialog; duplicate tagging explains the correction. There is no asynchronous data service to pretend is loading or failing, so the demo does not add simulated spinners/network errors. Routes use Next’s existing navigation; service-specific loading/error states remain a backend integration task. Tagging and checklists are not saved across reload; these screens remain a frontend prototype.

## Architecture and assets

Typed study/tag/observation models live in `review-model.ts`; content remains synthetic. `FilmTimeline`, `ReadSequence`, `ReviewNotes` and `ReviewSubmission` separate the console's visual and interaction responsibilities. Scoped CSS owns color, typography, grids and reduced-motion behavior. A 22,444-byte Latin display font is hosted locally with its OFL license. No application/test dependencies, lockfile entries, server routes or production services were added or changed.

## Visual review and fixes

Before screenshots were captured from `d2e5e89` at 1440×1000 and 390×844 for all five routes. Initial redesign screenshots were captured at the same sizes and inspected. Refinements included fixing the fallback headline wrap with a local display face, replacing unsupported sequence glyphs with numerals, reducing the film field's desktop height, containing long annotations, restoring light native controls on paper screens and preserving dark controls in the review workspace. The pathway numeral was darkened after axe identified low contrast. Separate accessible labels now identify submission and tag status regions.

Screenshot artifacts are outside the repository at `/workspace/artifacts/qb-lab-redesign/`; they contain only synthetic demo content. `before-*` records the original, `after-*` the first pass and `refined-*` the second visual pass. Final screenshots and verification results follow below. The inherited duplicate midfield “50” marking was also corrected; the field now has a single midfield marker, covered by the renderer test.

## Final verification

| Check | Actual result |
| --- | --- |
| Lint | Passed. |
| TypeScript | Passed `next typegen` and `tsc --noEmit`. |
| Component tests | **8 passed**, zero failures/skips; roster distinctions, single midfield marker, checklist/context/reset, observation feedback, timeline/compare, family isolation, tag deduplication/revisit/removal, per-study isolation/restoration and observation focus. |
| Production build | Passed all 11 generated pages, with the original public routes and five QB LAB routes preserved. |
| Browser tests | **68 passed**, zero failures/skips, 2.1 minutes, zero retries. Chromium at 1280, 768, 390 and 320 px; production server with external browser requests blocked. |
| Accessibility and keyboard | All five routes passed configured WCAG 2 A/AA, 2.1 AA and 2.2 AA axe checks across all four projects; skip focus, dialog Escape/focus return, native range keyboard controls and keyboard tag activation exercised. |
| Public-site regression | Original section navigation/mobile menu, all nine Calendly anchors and existing $60/$85/$240 prices passed in all four projects. No booking-provider request was made. |
| Visual/responsive checks | Before/after desktop/mobile capture and iterative inspection; final captures also include 1366×768 laptop, 1920×1080 large monitor and 768×1024 tablet. All five routes fit each tested width without document overflow. Final film comparison/tagging states captured at desktop/mobile. |
| Dependency audit | Full audit: **0 critical / 5 high**. Production audit: **0 findings**. No dependency or lockfile changes and no audit suppression. |
| Source isolation | `app/page.tsx`, `app/SiteNav.tsx`, `app/layout.tsx`, `app/globals.css`, `package.json` and `package-lock.json` unchanged from `d2e5e89`. Existing images unchanged. |

The initial redesign browser run had 60 passes and eight failures: the low-contrast pathway index and ambiguous submission status affected all four sizes. Both causes were fixed without weakening assertions, removing axe rules or changing timeouts/retries. A new component test also exposed a study-button accessible-name discrepancy; explicit names fixed it. The corrected run passed 68 tests, and the final run after the midfield correction passed all 68 again. This is local validation, not a claim that remote CI has passed.

The remaining high findings are the previously documented development chain: `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`. No supported remedy is introduced by this visual redesign. Existing ESLint support debt and the unvalidated Node 22 Dockerfile versus tested Node 24 toolchain remain. Full audit still exits nonzero. No dependency finding is suppressed.

Real Safari/iOS/Android, screen-reader sessions, production performance measurement and a qualified coach's curriculum sign-off remain unperformed. This is an introductory observation demo, not a complete coverage curriculum or an evaluation of a real athlete. Accounts, verified guardianship, consent evidence, media storage, scheduling integration and secure coach access remain future work.

## Review artifacts

Final PNGs use `final-{home,athlete,iq,film,family}-{desktop,mobile,laptop,large,tablet}.png`; additional comparison/tag screenshots are `final-film-review-state-{desktop,mobile}.png`. They live under `/workspace/artifacts/qb-lab-redesign/`, outside the repository. The original 1440px/390px images are named `before-*`. No generated browser reports or screenshots are added to Git.

## Delivery and manual recovery

Work stays on `feat/qb-lab-experience`, updating existing draft PR #3 by a normal push. Main remains `b502819`; the Phase 0 branch remains `2d7a2f`, and PR #2 is not modified. No merge, production promotion, deployment configuration edit or service provisioning is performed. The owner's current request authorizes Preview triggering by pushing this feature branch.

GitHub GraphQL PR inspection returns `Forbidden`; Vercel dashboard access fails at the environment proxy with HTTP 403 on the CONNECT tunnel. No connected Vercel tool is available. These failures prevent confirming the remote draft/CI state or a **Ready** Preview URL; they do not establish a repository-permission diagnosis. Do not treat the branch push as evidence that a Preview started or is ready.

Shortest recovery: open [PR #3](https://github.com/taenextlevelqbs-ops/coach-tae-website/pull/3), check that it remains a draft, and open the latest **Vercel → Details** check for this branch's newest commit. In Vercel, confirm environment **Preview**, matching branch/SHA and status **Ready**, then use its deployment URL. If skipped, inspect the Ignored Build Step result for this branch; no production setting was changed here.

## Redesign changed-file manifest

- `app/qb-lab/lab.css`: complete scoped notebook/console design system.
- `modules/qb-lab/LabShell.tsx`: masthead, responsive navigation and demo boundaries.
- `modules/qb-lab/Landing.tsx`: new editorial entrance, interactive study and directory.
- `modules/qb-lab/Athlete.tsx`: command-center ledger and suggested session order.
- `modules/qb-lab/FootballIQ.tsx`: classroom layout and observation-focus controls.
- `modules/qb-lab/Field.tsx`: focus markers, restrained palette, contained annotation and single midfield marking.
- `modules/qb-lab/FilmReview.tsx`: review-console orchestration and per-study state.
- `modules/qb-lab/FilmTimeline.tsx`: ruler, chapter seeking and tagged moments.
- `modules/qb-lab/ReadSequence.tsx`: reusable accessible observation-order controls.
- `modules/qb-lab/ReviewNotes.tsx`: timestamp notes and bounded tag notebook.
- `modules/qb-lab/ReviewSubmission.tsx`: local-only required-acknowledgement dialog.
- `modules/qb-lab/review-model.ts`: typed synthetic study/tag/observation vocabulary.
- `modules/qb-lab/Family.tsx`: guardian briefing and distinct communication context.
- `public/fonts/qb-lab/barlow-condensed-latin-700.woff2`: self-hosted display font.
- `public/fonts/qb-lab/OFL.txt`: original font copyright and SIL license.
- `tests/components/lab.test.tsx`: meaningful new interaction/field checks.
- `tests/e2e/lab.spec.ts`: browser coverage for tagging, navigation and the interactive cover; named status assertions.
- `docs/QB-LAB-REDESIGN.md`: concept, evidence, verification and review record.
- `docs/QB-LAB-FRONTEND-REVIEW.md`: preserve original review history, link current work and correct superseded delivery guard.
- `README.md`: link current review instructions.
