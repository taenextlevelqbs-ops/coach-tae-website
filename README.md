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

Keep this branch local until Vercel's skip configuration is verified for its
exact name. The Phase 0 branch exception does not establish that this branch
will be skipped. Do not merge or deploy this preview.

The current QB LAB visual direction, review workflow and redesign verification are documented in [QB LAB redesign](docs/QB-LAB-REDESIGN.md).
