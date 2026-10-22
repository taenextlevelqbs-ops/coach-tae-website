# Phase 0: patch website dependencies and add security regression checks

The baseline site had vulnerable runtime/build dependencies and no automated regression suite. Upgrade Next.js and eslint-config-next to 16.3.8, refresh compatible transitive patches, and add Playwright coverage of the real production/development servers at desktop, tablet and mobile widths. Preserve the existing page, branding, prices and all booking destinations.

Changes include security response headers with a deliberately partial CSP, a navigation label contrast fix, Node/npm metadata, generated-artifact exclusions, read-only non-deploying CI, a PR template and future account/database/private-media configuration policy. The master plan is included as the previously prepared baseline; no later platform phase is implemented.

Validation: frozen installation, lint, route type generation/TypeScript and production build passed. Production browser suite: **28 passed**. Development browser suite: **32 passed**, including allowed/untrusted origin checks. Chromium emulation covers 320/390/768/1280 px widths; real iOS/Android and hosted staging are not certified.

Security: complete audit improved from **1 critical/18 high to 0 critical/5 high**; production audit reports **zero findings**. Five development package entries trace to unpatched braces GHSA-vfj7-8cjw-p6xm. No force-fix, downgrade or suppression was applied; the complete CI audit job intentionally remains failing. ESLint 9 ecosystem support is a separate documented maintenance risk. See [the Phase 0 report](PHASE-0-SECURITY-REPORT.md) for raw audit evidence, applicability, vendor guidance and limitations.

Merge and production deployment require owner approval. The owner must configure actual branch/hosting protections and resolve or explicitly review outstanding security debt. Nothing was deployed, merged, charged, provisioned, or tested with real athlete data. Stop after Phase 0; Film Review requires separate authorization.
