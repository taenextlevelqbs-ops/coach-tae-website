# Coach Tae website

Next.js App Router marketing website. Existing training prices, Calendly bookings, Shopify links and branding are preserved. QB LAB accounts, payments and video uploads are not implemented.

Read `AGENTS.md` and relevant bundled Next.js documentation before changing code. See the [QB LAB plan](docs/QB-LAB-IMPLEMENTATION-PLAN.md) and [security/configuration policy](docs/SECURITY-AND-CONFIGURATION.md).

## Local development

Use Node 24.19.0 (`nvm use` if available) and npm 11.9.0. The public site requires no application secrets.

```sh
npm ci --no-audit --no-fund
npm run dev -- --hostname 127.0.0.1
```

Use a loopback origin for local requests. Next.js development-origin protections remain enabled. Do not publish the development server. The Dockerfile is still a development recipe, not a production deployment target.

## Validation

```sh
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm test
npm audit
npm audit --omit=dev
```

Playwright owns a loopback production server on port 3100; build first. It refuses to reuse a running server, blocks external browser requests, never follows booking links and never submits real bookings. Chromium projects cover desktop (1280), tablet (768), mobile (390) and compact mobile (320). Pixel emulation is not a real Android/iOS device test. Tests cover content/prices, existing navigation destinations, booking/commerce links, hydration, keyboard/Escape behavior, layout, hero/logo delivery, navigation accessibility and HTTP headers. Axe checks are scoped to navigation, not a full-site accessibility certification.

To exercise the same suite against development mode after stopping the production test run:

```sh
npm run test:e2e:dev
```

If the cloud machine has system Chromium instead of Playwright's downloaded browser, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium` for the test command. CI installs the browser matching pinned Playwright. Use `npx playwright install --with-deps chromium` when OS libraries are missing. Never bypass download checksums or TLS verification. Failure traces/screenshots are ignored by Git; inspect reports with `npx playwright show-report`.

`npm run check` runs lint, TypeScript, build and browser tests. Audits are separate because the full audit currently reports an upstream development-tool vulnerability with no published patch. The CI audit job retains its failing status; see the [Phase 0 report](docs/PHASE-0-SECURITY-REPORT.md) for evidence and remaining decisions. No CI or npm script deploys the application.
