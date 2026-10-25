This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## QB LAB local front-end preview

The independent `feat/qb-lab-experience` branch adds the `/qb-lab` landing page,
athlete studio, observation exercise, synthetic film room and family hub. Read
[the front-end review](docs/QB-LAB-FRONTEND-REVIEW.md) for the full changed-file
manifest, interactions, source verification, security limits and backend work
that is not implemented.

Use Node 24.19.0/npm 11.9.0. Run `npm ci --cache /tmp/coach-tae-npm-cache`, then
`npm run dev -- --hostname 127.0.0.1` for local development. Validation commands
are `npm run lint`, `npm run typecheck`, `npm test` (component tests),
`npm run build`, and `npm run test:browser` (build first and install Playwright's
Chromium, or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` in cloud).

All athlete profiles, feedback and field animations are synthetic. No real
authentication, file uploads, payments, notifications, athlete statistics or
personal information storage exists in this preview. The full npm audit still
reports the known development-only braces chain; it is not suppressed.

The owner has authorized normal pushes to `feat/qb-lab-experience` and Vercel
Preview builds for review. Verify the latest commit and Preview environment in
PR #3/Vercel before sharing a deployment URL. Do not merge into main, promote
to production or modify the separate Phase 0 branch/PR #2. See the redesign
review for the current access blockers and verification record.

The current dashboard replacement and visual verification are documented in [Approved athlete dashboard](docs/QB-LAB-DASHBOARD-REPLACEMENT.md). The [personal development review](docs/QB-LAB-PERSONAL-EXPERIENCE.md) records the preceding implementation. The [earlier redesign record](docs/QB-LAB-REDESIGN.md) is historical.

## Integrated QB LAB platform

The current feature scope is documented in [the platform review and feature matrix](docs/QB-LAB-PLATFORM-REVIEW.md). Start at `/qb-lab`; use `/qb-lab/simulator`, `/qb-lab/playbook`, `/qb-lab/workouts`, `/qb-lab/mechanics`, `/qb-lab/progress` and `/qb-lab/coach` for connected local practice. Browser persistence contains synthetic prototype state, not authenticated athlete records. Real accounts/uploads/payments are disabled.

Run the local PostgreSQL migration and isolation checks with `bash scripts/test-qb-lab-database.sh` (Docker required; ephemeral network-isolated container, pinned image, no published port). The auth schema in the test fixture is synthetic and is not a real session verifier. See `server/qb-lab/README.md` before any provider integration.

The shared terminology, defensive recognition, configurable flag formats/rules and coach-assigned lessons are documented in [Football models and lesson review](docs/QB-LAB-FOOTBALL-MODELS.md). Use `/qb-lab/simulator#recognition` or `/qb-lab/iq#recognition` for the new dark teaching workspace.

The first live-pocket engine milestone is available at `/qb-lab/simulator/engine`: separate game environments, positional protection/rush, QB controls and actual local event summaries. See [engine scope and working demonstrations](docs/QB-LAB-LIVE-ENGINE.md) before interpreting its synthetic outcomes.

Coach Workspace: `/qb-lab/coach` provides four dark-theme tabs for calendar/activity, roster depth planning, tagged scripts and synthetic film review. See [coach modules and backend routing](docs/QB-LAB-COACH-WORKSPACE.md). Real video/account operations remain disabled; the child-video pipeline is a reviewed-integration boundary, not a live upload service.
