# Athlete homepage: dark application replacement

The actual `/qb-lab` route renders `HomeDashboard` directly inside `LabShell`, outside `.app-tool-workspace`. Its original card rules and mobile navigation explicitly selected light surfaces. Dark styling on coach/IQ/simulator could not affect this route.

`LabShell` now marks the homepage with `app-athlete-home`. The shared frame applies the existing coach navy palette to this route, including the header, profile selector, fixed mobile navigation, footer and keyboard skip link. Original homepage card styles now use dark surfaces and readable secondary text. Green is reserved for the primary training action, session marker, selected navigation and compact instructional icons. Pastel category assignments were removed from `HomeDashboard`; the page retains its simple composition and working six destinations.

Synthetic profile selection, local activity-driven next session, sample-assignment labels, coaching note and privacy disclosure are preserved. No public coaching page, package, lockfile, API, authentication, upload or storage behavior changes. All real private services remain disabled.

## Verification

- Lint, TypeScript, production build and all 60 component/domain tests pass.
- Browser coverage checks actual `/qb-lab` dark background/card/navigation colors and green action on direct load and reload, at desktop, tablet, mobile and compact widths. Existing tests exercise all six destination links, keyboard skip navigation, personalization and first-viewport composition.
- Automated WCAG A/AA checks include contrast on the rendered home. These checks supplement visual inspection and do not certify complete accessibility.
- Full dependency audit: five existing high development findings involving braces, zero critical. Production dependency audit: zero findings. No new dependencies or audit suppression.

Focused dashboard browser suite: 24 passed across four viewport projects. Production-rendered screenshots of `/qb-lab` were captured and visually inspected at 1280×900, 768×1024, 390×844 and 320×740. All show the navy canvas, dark cards, green action, greeting, six tools and coaching note; phones have persistent bottom navigation. No light card or mobile-navigation override remains. Full browser regression: 208 passed across four viewport projects, with no skips or retries, using one worker. An initial two-worker run timed out and was interrupted; the complete serial run used the same assertions and timeouts without suppressing checks. Exact-commit Preview verification is recorded with the delivery. Screenshot artifacts are outside the application source tree at `/workspace/artifacts/qb-lab-athlete-dark/`.

## Boundaries

This is a synthetic browser-local prototype, not an authenticated athlete account. No real athlete data, media uploads, guardian consent, payments or public profiles are enabled. Production and PR #2 remain untouched; PR #3 must remain draft. Hosted CI status is reported separately from local validation.

## Changed files

- `modules/qb-lab/HomeDashboard.tsx`: consistent instructional destination icons.
- `modules/qb-lab/LabShell.tsx`: explicit athlete-home route theme.
- `app/qb-lab/application.css`: actual home surfaces and shared dark frame.
- `tests/e2e/dashboard.spec.ts`: direct/reloaded home dark-surface, responsive and accessibility regression.
- `tests/e2e/coach-workspace.spec.ts`: replace the superseded light-home expectation.
- This report, `QB-LAB-PLATFORM-PULL-REQUEST.md`, `QB-LAB-DASHBOARD-REPLACEMENT.md` and `QB-LAB-COACH-WORKSPACE.md`: current design and review documentation.
