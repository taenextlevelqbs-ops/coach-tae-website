# Approved athlete dashboard replacement

## What was actually replaced

The old `/qb-lab` route rendered `Landing.tsx`, with an editorial introduction, illustrated next-step panel, coaching empty state, progress strip and tool directory. `LabShell.tsx` rendered the previous sidebar and mobile disclosure; a large appended CSS block overrode the notebook styles. That composition did not match the requested reference.

This change **deletes Landing.tsx**, replaces the shell markup, and removes the previous appended personal-application CSS block. `/qb-lab` now renders `HomeDashboard.tsx`. The new `application.css` owns an independent `.qb-application` shell and dashboard; the home is never wrapped in the legacy `.qb-lab` workspace styles. The existing working tools retain their scoped controls inside the new shell.

## Exact default home

- Good afternoon, Jordan.
- Your QB Lab · Flag football · Age 12.
- Your next session: “Let's work on reading Cover 2.”, the specified sample assignment, 10 minutes and Start training.
- Six compact destinations: Football IQ / Read the defense; Workouts / Train anywhere; Film Room / Review your reps; Playbook / Learn your plays; QB Simulator / Practice decisions; Progress / See your growth.
- The specified sample note from Coach Tae.
- Home / Train / Plays / Profile: compact desktop top navigation and persistent mobile bottom navigation.

Jordan is fixed synthetic demo B; Alex is fixed synthetic demo A. Both use the 11–13 age group, matching the displayed age 12. Family/coach/workout demo B's age group is aligned with that fixture. The profile selector updates greeting, pathway, sample note, assignment recommendations and profile-scoped history selection. Selection and exploratory pathway are saved in sessionStorage using only fixed enums; malformed input is ignored and blocked storage falls back to memory. No real names, registrations or personal records are collected.

Existing completed local work may replace the sample next-session copy with a relevant recommendation for the selected demo profile. This is based on actual recorded browser interactions, never invented ability scores. IQ, simulator and mechanics records now carry the selected demo identity. Existing explicit family/workout profile URLs remain supported. Local demo profile separation is not authentication or an authorization boundary.

## Functional navigation and curriculum boundaries

Start training opens `/qb-lab/session`, with working links to the existing Football IQ exercise and short footwork walkthrough. The dashboard's Cover 2 assignment and coaching note are prominently marked sample data. The session explains that the available lesson teaches visible deep defenders and the difference between a two-high shell and confirmed coverage; a full coaching-reviewed Cover 2 curriculum is not published. No new league-specific flag rule or coverage answer key is invented to satisfy the display copy.

Train opens the existing Command Center. Plays opens the working Playbook Studio. Profile opens a real demo-profile screen with Progress Center, Family Hub, coach demonstration, privacy/account status, mechanics and workout destinations. All six home cards route to existing working screens. Real authentication, athlete footage, private uploads, payments, scheduling and messaging remain unavailable.

## Visual verification

Local production screenshots were inspected at 1440×900 desktop, 390×844 phone and 320×740 compact phone. The composition was compared directly with the requested copy and hierarchy. All six destinations, the greeting, next-session card, sample coach note and navigation fit the first viewport at these sizes. The 320px coach note ends at y=661.25; the bottom navigation starts at y=678. At 390px, the note ends at y=706 and navigation begins at y=782. Desktop note ends at y=733.05 within the 900px viewport.

The first scan identified low-contrast secondary text. Colors were darkened and the full automated accessibility checks were rerun without disabling rules. The compact layout was tightened, and title wrapping was balanced. No oversized illustration, feature showcase, notebook cover, sidebar, section numbering or marketing footer renders on the new home.

Screenshots outside Git:

- `/workspace/artifacts/qb-lab-dashboard/desktop-viewport.png`
- `/workspace/artifacts/qb-lab-dashboard/mobile-viewport.png`
- `/workspace/artifacts/qb-lab-dashboard/compact-viewport.png`

Matching `*-final.png` files contain full-page captures. Screenshot scripts block external requests, as the regression suite does, so an external network request cannot stall local capture. These are local production renders; remote Preview smoke evidence is separately reported at publication.

## Validation and security

Final local verification: lint, TypeScript, 27 component/domain tests and production build passed. The full 156-test browser run had 154 passes and two desktop startup timeouts (one beforeEach timeout and one page/scan timeout). The two unchanged tests both passed on `--last-failed` recheck in 8.9 seconds, with no timeout increases, retry-policy changes, disabled assertions or accessibility-rule suppression. Across the runs all 156 browser checks are verified. Logs: `/tmp/qblab-dashboard-final-browser.log` and `/tmp/qblab-dashboard-timeout-recheck.log`. The added dashboard suite covers first-viewport composition, all six destination links, profile/session accessibility and Jordan/Alex activity isolation across four viewport projects. No dependency versions, lockfile, private API handlers, database migrations, deployment settings or public coaching source files are changed. Production dependency audit reports zero findings; full audit still reports the five known high development findings involving braces, zero critical. No suppression or unsupported override is used.

Real Safari/mobile hardware, human screen-reader review and qualified coaching curriculum sign-off remain outstanding. The existing private foundation remains fail-closed. No merge, production deployment or PR #2 edit is authorized by this change; the delivery target is existing draft PR #3 and a non-production Vercel Preview.

## Identity and data continuity

Fresh entry at `/qb-lab` selects Jordan (demo B, flag, age 12). A direct entry to an existing tool retains its historical demo A default unless a prior selection exists in this tab. Explicit selections survive navigation and reload. Personalization is a synthetic browser demonstration, not a login. Playbooks, goals and full export/reset remain shared local prototype tools; the displayed activity history and assignment queue follow the selected demo athlete. Existing family/coach sample selectors are demonstration management controls, not proof of guardianship or coach privileges.

## Changed-file manifest

- `README.md`
- `app/qb-lab/application.css`
- `app/qb-lab/lab.css`
- `app/qb-lab/layout.tsx`
- `app/qb-lab/page.tsx`
- `app/qb-lab/profile/page.tsx`
- `app/qb-lab/session/page.tsx`
- `app/qb-lab/workouts/page.tsx`
- `docs/QB-LAB-DASHBOARD-REPLACEMENT.md`
- `docs/QB-LAB-PERSONAL-EXPERIENCE.md`
- `docs/QB-LAB-PLATFORM-PULL-REQUEST.md`
- `modules/qb-lab/AppIcon.tsx`
- `modules/qb-lab/Athlete.tsx`
- `modules/qb-lab/DemoProfile.tsx`
- `modules/qb-lab/DemoSession.tsx`
- `modules/qb-lab/Family.tsx`
- `modules/qb-lab/FootballIQ.tsx`
- `modules/qb-lab/HomeDashboard.tsx`
- `modules/qb-lab/LabShell.tsx`
- `modules/qb-lab/Landing.tsx`
- `modules/qb-lab/ReviewNotes.tsx`
- `modules/qb-lab/demo-profile-store.ts`
- `modules/qb-lab/platform/ActivityDesk.tsx`
- `modules/qb-lab/platform/Coach.tsx`
- `modules/qb-lab/platform/Mechanics.tsx`
- `modules/qb-lab/platform/Progress.tsx`
- `modules/qb-lab/platform/Workouts.tsx`
- `modules/qb-lab/platform/next-step.ts`
- `modules/qb-lab/simulation/Simulator.tsx`
- `tests/components/lab.test.tsx`
- `tests/e2e/dashboard.spec.ts`
- `tests/e2e/lab.spec.ts`

The final production build generated 20 entries, including new `/qb-lab/profile` and `/qb-lab/session` routes. Existing public-site regressions verified the unchanged prices, navigation and nine Calendly links. The earlier exploratory browser run exposed the mobile navigation contrast issue and was stopped after identifying the cause; the corrected final run above retained the full checks.
