# QB LAB front-end experience — review history

**Current platform:** [Integrated implementation and feature matrix](QB-LAB-PLATFORM-REVIEW.md).

**Historical redesign:** [Field notebook / film console review](QB-LAB-REDESIGN.md). The original implementation and its validation are recorded below; use the redesign record for current visuals and test results.

Branch: `feat/qb-lab-experience`. Base: latest fetched remote main, `b502819d9fa226421f793217cf325b9801cdf95c` on October 22, 2026. This branch was created directly from main; Phase 0 was not merged or cherry-picked. The Phase 0 branch remains at `2d7a2fac09331d5b72e5ee6049ef16f005235f8a`, and PR #2 is untouched.

## Experience and interactions

| Route | Implemented front-end behavior |
| --- | --- |
| `/qb-lab` | Responsive landing page using the existing Coach Tae logo/training image, brand-aligned dark/sky palette, pathway selection and working links to every preview module. |
| `/qb-lab/athlete` | Tackle/flag selection, five age groups from 8–10 through college, three experience contexts, actual in-memory demo checkboxes and reset, honest empty states for training and athlete records. |
| `/qb-lab/iq` | Three guided observations, required answer selection, explanatory feedback for correct/incorrect answers, an authored defender rotation with play/pause, keyboard slider and manual steps, restart and session completion. No player IQ/ability score. |
| `/qb-lab/film` | Native keyboard-accessible submission dialog, fixed synthetic clip and focus choices, local queue/clear state, play/pause/speed/0.1-second steps, timeline seeking, timestamped fictional comments, annotation visibility and earlier/later comparison. No file input or real upload path exists. |
| `/qb-lab/family` | Two fixed sample profiles, separate per-profile notification preferences, reset, downloadable synthetic settings JSON, clear privacy/consent empty states and navigation into the athlete preview. |

The existing homepage gets one additional QB LAB link in each desktop/mobile navigation. Existing sections, price strings, Calendly and Shopify destinations are retained. The homepage body, layout/metadata, global CSS and original assets are unchanged. Responsive checks near 981/1024/1100/1280 px found no document overflow after adding the link.

React state is in memory only. Pathway selection lives in the shared layout; other module state can reset on navigation/unmount and all state resets on reload. No cookies, localStorage, database, authentication, real notifications, personal-data forms, file picker, camera capture, public uploads, payments or private-media storage are introduced. Export contains only fixed synthetic profiles and demo preferences. “Queue” means a local demonstration state; no coach is notified. Fictional comments are explicitly not attributed to Coach Tae. Comparison shows different moments, not improvement.

## Architecture and dependencies

Thin App Router pages render separate client modules under `modules/qb-lab`. `LabShell` owns navigation and the shared pathway context. `Field` is a bounded SVG teaching diagram; `demo.ts` supplies explicit synthetic content. Client/server boundaries use the existing Next.js/Tailwind architecture, with scoped QB LAB CSS and no new service SDKs. New routes carry noindex metadata, which is an indexing instruction, not access control. They contain no private data.

Main still pins vulnerable Next 16.3.3 and its older lockfile, so this independent branch applies compatible Next/eslint-config-next **16.3.8** updates and refreshes transitive patches. React/React DOM remain **19.2.8**. This does not alter the separate Phase 0 branch. Test packages: Playwright **1.64.1**, axe adapter **4.14.0**, Vitest **5.0.5**, Testing Library React **16.3.3**, user-event **14.6.8**, jest-dom **7.0.1**, jsdom **30.1.3**. Node types **24.19.2** match the tested Node **24.19.0** runtime. Node/npm requirements are recorded in `.nvmrc` and `package.json` (npm **11.9.0**).

The first test-tool install correctly rejected incompatible Node 20 typings; matching Node 24 typings resolved that peer conflict. No force/legacy-peer-deps or unsupported dependency overrides were used. Default npm integrity/TLS verification remains enabled. Existing Dockerfile still selects Node 22 and was not validated for this branch's Node 24 test-tool contract; it is not an approved deployment path.

Complete dependency audit: **0 critical, 5 high**, all from the previously investigated unpatched development-only braces chain (`eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`). Production audit: **zero findings**. No additional findings were reported for the new test dependencies. This does not claim immunity to unknown vulnerabilities. ESLint 9 support debt and the braces advisory remain unresolved; no security check is suppressed. These results do not approve the Phase 0 PR for merging.

## Football verification and prototype limits

See [the football review record](QB-LAB-FOOTBALL-REVIEW.md) for actual source URLs, supported facts, source conflicts deliberately excluded, observation keys and the remaining coaching sign-off gate. Source access was enabled for operations.nfl.com and nflflag.com through a saved environment network draft. To retain those settings for future tasks, review/save and publish the **cloud development environment**, separately from any website deployment. No website deployment or cloud snapshot publication was performed here.

The exercise is a coverage-observation introduction, not a complete graded coverage-recognition academy. It does not invent a league-specific flag ruleset, validate a formation or guarantee a passing outcome. Full age-specific lessons, reviewed scheme-specific answer keys, true video playback/frame decoding, drawing authoring, voice feedback, real coach assignments, secure accounts, guardian verification, consent evidence, private access, media processing and deletion/retention are future integrations. None is presented as working backend functionality.

## Initial implementation verification (`7af4b1e`)

Use Node 24.19.0/npm 11.9.0 and the existing isolated checkout. No extra worktree or service credentials are required.

```sh
npm ci --cache /tmp/coach-tae-npm-cache --no-audit --no-fund
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:browser
npm audit
npm audit --omit=dev
```

On this cloud machine the existing system Chromium can be used with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser`. The runner owns loopback port 3150, refuses to reuse a server, and blocks external browser requests. It never follows booking destinations or submits real data. Run a build first. Component tests use Vitest/jsdom and Testing Library; they are distinct from production-server browser tests.

Initial browser failures identified ambiguous implicit select labels and a focused skip-link overlap with the brand link. These were fixed with explicit control names and non-overlapping focused layout, not by disabling assertions or axe rules. Targeted checks then passed. Final validation and manual visual review are recorded below; automated WCAG checks do not substitute for assistive-technology and real-device review.

| Final check | Actual result |
| --- | --- |
| Lint | Passed, including application and test/config source. |
| TypeScript | Passed: Next route generation and `tsc --noEmit`. |
| Component tests | **6 passed**, 0 failed/skipped; Vitest/jsdom/Testing Library. |
| Production build | Passed compile, TypeScript and static generation of all 11 generated pages; existing routes plus the five QB LAB routes. |
| Browser tests | **60 passed**, 0 failed/skipped, 1.6 minutes; 15 cases across 1280/768/390/320 px viewport projects. Real production server, zero retries, two workers. |
| Accessibility | All five new screens passed the configured WCAG 2 A/AA, 2.1 AA and 2.2 AA axe checks at all four widths, including focused skip navigation. Dialog Escape/focus return and keyboard timeline behavior were exercised. |
| Existing-site regression | All nine Calendly anchors, price strings, the five original section destinations and the new QB LAB entry passed in every browser project. No booking provider was visited. |
| Security | Complete npm audit exits 1 with 0 critical/5 high from the known braces chain; production audit exits 0 with zero findings. No audit suppression. |
| Manual review | Desktop/mobile landing and film/family screenshots inspected; existing homepage sampled at 981/1024/1100/1280 px without document overflow. |

A later combined five-page accessibility run hit a 30-second aggregate test budget under variable machine load (27 passed/1 timed out). Route checks and accessibility scans were split into independent tests so each route has its own result and existing timeout. No assertion, axe rule or screen was removed, and no timeout was raised. The final 60-case run above passed after that test-structure correction. These are Chromium results; real Safari/iOS/Android, screen-reader and production performance certification remain unperformed. The HTML browser report and failure artifacts are generated/ignored, not committed.

## Delivery authorization history

The initial implementation was kept local until the owner confirmed the new branch's Vercel skip configuration. It was then published; PR #3 was created by the owner. The owner subsequently authorized an empty preview-trigger commit (`d2e5e89`) and now explicitly authorizes pushing this redesign and triggering a **Preview**. That later authorization supersedes the initial local-only guard. Production deployment, main merges and PR #2 changes remain prohibited. GitHub API/Vercel access has been blocked in this environment; current verification and recovery steps belong in the redesign record.

## Changed-file manifest

The complete manifest follows; each entry is relative to the repository root. Build outputs, traces, screenshots and node_modules are not committed. Review screenshots are kept outside the checkout under `/workspace/artifacts/qb-lab/`.

| File | Purpose |
| --- | --- |
| `.gitignore` | Exclude generated browser artifacts. |
| `.nvmrc` | Pin tested Node runtime. |
| `README.md` | Add local prototype and validation instructions. |
| `package.json` | Compatible runtime patch, test tools, scripts and runtime requirements. |
| `package-lock.json` | Resolved, integrity-protected dependency graph. |
| `eslint.config.mjs` | Exclude generated third-party report bundles while linting application/tests. |
| `app/SiteNav.tsx` | Add QB LAB entry without changing existing destinations. |
| `app/qb-lab/layout.tsx` | Shared shell, scoped styling and demo metadata. |
| `app/qb-lab/page.tsx` | Landing route. |
| `app/qb-lab/lab.css` | Responsive visual system and keyboard/motion affordances. |
| `app/qb-lab/athlete/page.tsx` | Athlete route/metadata. |
| `app/qb-lab/iq/page.tsx` | Football IQ route/metadata. |
| `app/qb-lab/film/page.tsx` | Film-room route/metadata. |
| `app/qb-lab/family/page.tsx` | Family route/metadata. |
| `modules/qb-lab/LabShell.tsx` | Navigation and pathway context. |
| `modules/qb-lab/Landing.tsx` | Landing experience and pathway preview. |
| `modules/qb-lab/Athlete.tsx` | Context selection and session checklist. |
| `modules/qb-lab/FootballIQ.tsx` | Observation/feedback and illustration controls. |
| `modules/qb-lab/FilmReview.tsx` | Synthetic review workflow and comparison. |
| `modules/qb-lab/Family.tsx` | Synthetic family preferences/export. |
| `modules/qb-lab/Field.tsx` | Accessible authored field renderer. |
| `modules/qb-lab/demo.ts` | Explicit demonstration content. |
| `playwright.config.ts` | Four viewport projects, local production server, failure artifacts. |
| `vitest.config.mts` | Native-compatible component test configuration. |
| `tests/setup.ts` | Component-test cleanup, matchers and pathname mock. |
| `tests/components/lab.test.tsx` | Component interaction/roster/state coverage. |
| `tests/e2e/lab.spec.ts` | Browser workflows, privacy constraints, homepage regression and axe checks. |
| `docs/QB-LAB-FOOTBALL-REVIEW.md` | Source verification and content publication limits. |
| `docs/QB-LAB-FRONTEND-REVIEW.md` | This implementation, validation and review record. |
