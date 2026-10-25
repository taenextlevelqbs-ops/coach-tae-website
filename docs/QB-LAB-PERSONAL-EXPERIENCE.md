# Personal quarterback development experience

The home dashboard and shell in this record are superseded by [Approved athlete dashboard replacement](QB-LAB-DASHBOARD-REPLACEMENT.md).

This review supersedes the field-notebook visual direction in `QB-LAB-REDESIGN.md`. QB LAB is an athlete’s development space: Coach Tae is with you wherever you train. The public coaching website is preserved.

## Product changes

The Lab opens directly into a synthetic athlete’s next step, rather than a marketing entrance. A compact greeting, tackle/flag switch and one primary action precede coaching feedback, recorded work and quick access to the training tools. Sage, white, restrained type sizes and open spacing replace the oversized editorial headings. A desktop sidebar and a keyboard-operable mobile disclosure provide the same application destinations. Numbered navigation, decorative study indices and chapter/observation numbering are removed; functional timestamps, football identifiers and actual progress counts remain.

Command Center preserves its learning-context controls, checklist, assignment queue and field study. It adds truthful schedule/message empty states and links to family planning and goals. Family Hub and Film Room retain their distinct working layouts under the shared application design. The simulator, playbook authoring/import/export, animated mechanics trainer, guided workouts, film tagging/corrections, profile-specific coach assignments, family oversight and progress export/reset remain functional.

## Connected learning

`platform/next-step.ts` derives a suggestion from actual browser-local interactions for demo athlete A:

- An open, pathway-compatible assignment takes priority.
- No matching lesson history leads to Football IQ.
- An incorrect observation leads to the observation walkthrough until a later completion is recorded.
- Completed study leads to scenario practice, then illustrated film correction.

The lesson stores a bounded `-revisit` reference when any observation needs another look. It does not produce an athlete rating. Existing local records remain valid; no storage migration is necessary. Film corrections already create local workout assignments; completing a matching workout updates the assignment and history. Coach/guardian profile A/B isolation remains demo organization, never authorization. Local history is device/browser specific, self-reported and user-editable. The 200-event retention limit still applies.

No personal athlete names, real accounts, uploads, payments, coach messages or appointments are created. Greeting and identity remain explicitly synthetic. Real personalized feedback and communications have honest empty states. Age/context choices are preview controls rather than an assessment or a published age-specific curriculum. Flag league rules and scheme-specific decision keys still require qualified coaching review. No new football rules or biomechanics claims are introduced.

## Security update

A fresh audit found two newly reported Next.js advisories against inherited 16.3.8: [GHSA-2464-fhr4-w9xw](https://github.com/advisories/GHSA-2464-fhr4-w9xw) (critical image optimization advisory) and [GHSA-p3m5-59mp-jv5r](https://github.com/advisories/GHSA-p3m5-59mp-jv5r) (high Server Actions denial of service). Both GitHub advisory pages list 16.4.1 as patched. The registry confirms 16.4.1 supports Node >=20.9 and the installed React 19 versions. Next.js and its matching ESLint configuration are updated from 16.3.8 to exactly 16.4.1; the lockfile records supported transitive updates. No overrides, audit suppression or production configuration changes are used.

After the update, the full audit reports **0 critical / 5 high**, all the existing development-only `braces` chain. Production audit reports **zero findings**. The existing CI full-audit job is expected to remain failing on those findings; no check is bypassed. The update changes the shared framework dependency, so existing public-site browser regressions are part of validation even though the public source files remain unchanged.

## Validation and delivery

Final results and publication evidence are recorded below after checks complete. Browser checks use system Chromium via `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`; the first attempt could not launch the default bundled browser. This is not a Safari, native-device or screen-reader certification. Screenshots live outside Git at `/workspace/artifacts/qb-lab-personal/`.

Only `feat/qb-lab-experience` is authorized for a normal push and non-production Preview. No merge, production deployment/promotion, Phase 0 branch change or PR #2 edit is included. GitHub API and Vercel access are checked again at publication; a push alone is not proof of a Ready Preview.

## Verification record

- Lint and TypeScript: passed on the final source.
- Component/domain tests: 27 passed, zero failures/skips. Includes next-step selection, missed-observation follow-up, profile/pathway separation and honest home states.
- Production build: passed on Next.js 16.4.1; 18 generated entries, original public route and private fail-closed route preserved.
- Complete browser suite: 136 passed, zero failures/skips/retries, four responsive projects (1280, 768, 390 and 320 pixels). Includes all 12 QB LAB screens, configured WCAG 2 A/AA, 2.1 AA and 2.2 AA axe checks, keyboard/touch controls, cross-module persistence and original public navigation/prices/nine Calendly links.
- Visual refinements after that run: replace an unsupported arrow glyph and remove decorative chapter/observation indices. Final focused verification: **48 passed**, zero failures/skips/retries, on the rebuilt final source across all four responsive projects. Log: `/tmp/qblab-personal-final-browser.log`.
- Fresh full dependency audit: 0 critical / 5 high. Fresh production audit: 0 findings. Logs are `/tmp/qblab-personal-final-audit.json` and `/tmp/qblab-personal-final-prod-audit.json`.
- Public source isolation: `app/page.tsx`, `app/SiteNav.tsx`, `app/layout.tsx` and `app/globals.css` unchanged. Shared framework dependency receives the supported security update; public functionality regression-tested.
- No changes to database migrations, private authorization policies, API handlers, deployment configuration or production services. Existing database isolation checks were not repeated because those files are unchanged; the earlier platform review retains their historical evidence.
- Device/browser limits: Chromium emulation and automated axe checks only; real Safari/mobile hardware and human screen-reader review remain outstanding. Coaching sign-off remains outstanding.

## Changed files

- `README.md`
- `app/qb-lab/lab.css`
- `docs/QB-LAB-PERSONAL-EXPERIENCE.md`
- `docs/QB-LAB-PLATFORM-PULL-REQUEST.md`
- `docs/QB-LAB-PLATFORM-REVIEW.md`
- `docs/QB-LAB-REDESIGN.md`
- `modules/qb-lab/Athlete.tsx`
- `modules/qb-lab/Family.tsx`
- `modules/qb-lab/FilmReview.tsx`
- `modules/qb-lab/FilmTimeline.tsx`
- `modules/qb-lab/FootballIQ.tsx`
- `modules/qb-lab/LabShell.tsx`
- `modules/qb-lab/Landing.tsx`
- `modules/qb-lab/ReadSequence.tsx`
- `modules/qb-lab/platform/next-step.ts`
- `package-lock.json`
- `package.json`
- `tests/components/lab.test.tsx`
- `tests/domain/next-step.test.ts`
- `tests/e2e/lab.spec.ts`

Visual review: 34 screenshots outside Git cover all 12 destinations at desktop/mobile, with additional tablet/320px captures of home, Command Center, IQ, Film Room and expanded mobile navigation. The home, command, film and compact-navigation captures were inspected; the unsupported glyph was replaced before final verification.
