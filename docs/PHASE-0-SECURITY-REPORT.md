# Phase 0 — security and foundation report

Date: October 22, 2026. Scope: local controlled implementation based on `b502819d9fa226421f793217cf325b9801cdf95c`. Branch: `chore/qb-lab-phase-0`. This report supersedes the baseline audit's dependency and local navigation observations; it does not replace the broader QB LAB plan or authorize the next phase.

## Actual changes

- Upgraded Next.js and matching ESLint configuration from **16.3.3 to 16.3.8**; refreshed compatible transitive dependencies in the lockfile without force-fixes or overrides. React and React DOM stay **19.2.8**. Next.js 16.3.8 accepts React 19 and Node ≥20.9; local/CI runtime is pinned to Node **24.19.0**, npm **11.9.0**.
- Added exact development dependencies **`@playwright/test` 1.64.1** and **`@axe-core/playwright` 4.14.0**, production/development test commands, route type generation/TypeScript checks, and production-build browser regression projects at four widths.
- Added baseline response headers and partial CSP, and removed the framework branding header. No script/style allowlist was imposed that would break hydration. Camera/microphone/geolocation access is denied for the current public site; future capture requires separate reviewed route policy.
- Improved the existing mobile navigation label's white opacity from 0.42 to 0.60 after axe reported insufficient contrast (4.04:1 at the tablet sample). Existing brand palette, layout, page copy, prices, booking and commerce destinations remain intact. No navigation logic rewrite was needed.
- Added read-only/non-deploying CI with pinned action commits, full and production audits, build/type/lint/browser checks, failure artifacts and timeouts. Generated browser reports/results are excluded from Git, ESLint and Docker context. Excluding generated third-party report bundles does not exclude application source or tests from lint.
- Added Node/npm metadata, PR template and [configuration/contribution policy](SECURITY-AND-CONFIGURATION.md). The existing Dockerfile is still development-only; `.dockerignore` now excludes credentials and generated/local files. No production container was built or approved.
- Corrected the existing cloud environment's saved `start_skill` draft to use matching loopback hostnames and recognize the Phase 0 test/audit commands. Installation, repository membership, network and credential settings were preserved. Draft persistence was confirmed; no cloud snapshot publication or website deployment occurred. To retain it for future tasks, review/save the development-environment draft and publish that cloud environment separately from any website deployment.
- Retained the previously created [master implementation plan](QB-LAB-IMPLEMENTATION-PLAN.md) as a historical baseline. Accounts, database/storage provisioning, payments and Film Review implementation have not begun.

## Investigation and vendor guidance

Vendor/advisory pages and registry metadata were checked on the report date. `https://nextjs.org/support-policy` was blocked by the environment proxy; no assertion about all vendor support tiers is based on that unavailable page. The exact 16.3 patch was selected to minimize compatibility changes; the registry also offered 16.4.2, whose ESLint plugin still depends on the same affected fast-glob chain and does not solve the remaining issue. No canary or prerelease was selected.

| Issue | Evidence and applicability | Installed result |
| --- | --- | --- |
| Next.js ImageResponse RCE | [Vendor advisory GHSA-vcvr-r3jv-pc5j](https://github.com/vercel/next.js/security/advisories/GHSA-vcvr-r3jv-pc5j) lists ≥16.2.0 <16.3.6 and patch 16.3.6. Requires attacker-controlled SVG values in Node ImageResponse; no ImageResponse route exists here. Absence of a current call site was not used to avoid patching. | Next 16.3.8; no longer reported by current npm audit. [16.3.8 release](https://github.com/vercel/next.js/releases/tag/v16.3.8) was inspected. |
| Next.js image optimization SSRF, cache/draft/metadata/development advisories | [Vendor SSRF advisory](https://github.com/vercel/next.js/security/advisories/GHSA-cjq9-62q9-8jv4) describes an attacker-controlled allowlisted remote image URL; no `images.remotePatterns` is configured. That page still used `16.3.?` placeholders when inspected, while the registry audit ranges specified fixes at 16.3.8. The complete baseline audit records the other individual advisory URLs/ranges. No exploit attempts were made against production. | Next 16.3.8 is outside the reported ranges; production audit reports zero current findings. This does not establish absence of unknown vulnerabilities or deployed parity. |
| sharp/librsvg | [GHSA-wq5f-xc86-pv6w](https://github.com/advisories/GHSA-wq5f-xc86-pv6w) recommends sharp 0.35.5/prebuilt librsvg 2.63.2; [vendor release](https://github.com/lovell/sharp/releases/tag/v0.35.5) inspected. Existing optimized JPEGs still exercise image delivery. | sharp 0.35.4 → **0.35.5**, within Next's supported optional range; runtime `sharp.versions` confirms **rsvg 2.63.2** and libvips 8.18.7. No manual native binary/checksum replacement. No longer reported. |
| source-map-js denial of service | [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) lists fixed 1.2.2 for indexed source-map offset validation. User-supplied source maps are not accepted by this site, but the build/runtime dependency remains worth patching. | **1.2.1 → 1.2.2** in PostCSS/Tailwind/Next dependency resolution. No longer reported. |
| brace-expansion denial-of-service variants | Baseline audit records GHSA-q2hr-2g5m-vwhr, GHSA-qhr7-859c-m2p7 and GHSA-6j4f-fj2g-mc7p. All supported dependency ranges were refreshed, including typescript-eslint. | **1.1.18 → 1.1.21** and **5.0.9 → 5.0.12**; typescript-eslint 8.68.0 → 8.72.0. No longer reported. |
| braces stack exhaustion — unresolved | [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) lists affected ≤3.0.3 and **no patched version**. Registry latest remains 3.0.3. Chain: eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces. Current 16.4.2 plugin metadata still uses fast-glob 3.3.1. | braces **3.0.3 remains**. Five high entries reflect this one root advisory and its ancestors. npm suggests downgrading eslint-config-next to 14.2.35; rejected because it does not preserve the aligned Next 16 integration. No exception or suppression applied. |

ESLint **9.39.5** is retained because the current React/import/JSX accessibility plugins declare peer support through ESLint 9, while the registry warns that ESLint 9 is out of support. Forcing ESLint 10 would exceed those peer contracts; an ecosystem-compatible lint migration remains an owner-reviewed maintenance decision. No known ESLint-core advisory appears in this audit, but an unsupported tool is still a maintenance risk.

## Audit evidence

Raw reports are committed under `docs/security/`; they contain public package/advisory metadata, not environment values. These are affected package-entry counts (including propagated severity), not counts of distinct proven exploitable site bugs.

| Audit | Critical | High | Other | Command exit |
| --- | ---: | ---: | ---: | ---: |
| [Complete baseline](security/npm-audit-before.json) | 1 | 18 | 0 | 1 |
| [Complete after upgrade/frozen reinstall](security/npm-audit-after.json) | 0 | 5 | 0 | 1 |
| [Production after upgrade/frozen reinstall](security/npm-audit-production.json) | 0 | 0 | 0 | 0 |

No `--force`, signature/TLS bypass, checksum replacement or fake advisory allowlist was used. A fresh `npm ci` from the updated lockfile succeeded. Re-run audits before merging/releasing because advisory feeds change. The committed CI deliberately keeps the full-audit job failing while the development finding remains; quality/test success is separate from full security clearance. Risk acceptance, if any, must be narrow, documented, owned and time-limited, with upstream monitoring. No such exception has been approved here.

## Validation and mobile investigation

The regression suite runs the actual Next.js server and uses no component mocks or fake booking services. External browser requests are blocked, and tests assert exact link targets without opening Calendly, Shopify or submitting data. Navigation tests click all five sections and check their starts remain below the sticky header. Browser tests verify disclosure state, keyboard Enter/Tab/Escape and focus restoration, script loading, actual image delivery, price strings and response headers. Navigation-only axe tests exercise the open mobile menu; full-site contrast/zoom/screen-reader validation remains separate.

The baseline audit saw HTTP 403 for development JavaScript with a server started on `0.0.0.0` and browser origin `127.0.0.1`. The installed Next.js guide/source confirms default allowlisting of localhost and startup hostname, plus checks of Origin/Referer for dev assets. Direct curl without an Origin can succeed while a browser request fails. The new test server binds to `127.0.0.1` and uses the same origin, preserving protections rather than broadening `allowedDevOrigins`. Development tests explicitly require an allowed-origin asset request to return 200 and an untrusted-origin request to return 403. Production/local behavior does not prove deployed mobile behavior.

A separate controlled reproduction started the patched development server on `0.0.0.0:3101` and requested the same existing JavaScript asset with different Origin headers: **no Origin → 200; `http://127.0.0.1:3101` → 403; `http://localhost:3101` → 200; `http://0.0.0.0:3101` → 200**. This reproduces the origin mismatch responsible for the earlier symptom. The reproduction server and test servers were stopped afterward. No wildcard origin exception or navigation-logic workaround was added.

Initial test work exposed an ambiguous test selector (DMV Attack versus Shop DMV Attack), which was corrected to the exact anchor destination. It also exposed generated report JS entering ESLint's scan; report output is now explicitly ignored. Neither issue was papered over by disabling assertions. The real contrast issue was fixed in the application CSS.

| Final local check | Result |
| --- | --- |
| Frozen install from updated lockfile | Passed; 371 packages installed. ESLint support warning retained/documented. |
| `npm run lint` | Passed, including application and test/config source. |
| `npm run typecheck` | Passed (`next typegen` then `tsc --noEmit`). |
| `NEXT_TELEMETRY_DISABLED=1 npm run build` | Passed: compile, TypeScript and 6/6 generated pages; existing route inventory preserved. |
| Production Playwright | **28 passed, 0 failed, 0 skipped**, 1.7 minutes; seven scenarios across desktop/tablet/mobile/compact. |
| Development Playwright | **32 passed, 0 failed, 0 skipped**, 2.3 minutes; the same scenarios plus an origin-rejection test in each project. |
| Browser/runtime | System Chromium **154.0.8037.57**, Node **24.19.0**, npm **11.9.0**; no real iOS/Android or other browser engine tested. CI is configured to install its pinned Playwright browser; hosted CI has not run here. |
| Navigation accessibility | Navigation-scoped axe checks passed at all four widths after the label contrast fix; not full-site WCAG certification. |
| Workflow/diff integrity | YAML parsed with expected jobs/read-only permissions; `git diff --check` passed. Home page, SiteNav logic, layout/metadata and public assets are byte-for-byte unchanged from the baseline. |

The final test runs use the configured zero local retries. No failing test was reclassified as skipped/expected-failure, and no paid or private-data test service was used.

## External controls and remaining decisions

- No production deployment, merge, payment activation, real athlete account, private video upload, paid service or provider provisioning occurred. No production data was used.
- Git read access works through the platform HTTPS proxy. GitHub API repository access through the installed CLI returned `Forbidden`; raw credential values were not inspected. PR creation, branch rules and hosting approval settings are not established by local validation. PR publication status is recorded in the final work report.
- Owner must resolve/accept the remaining development advisory, decide the ESLint support migration, configure actual branch protection and verify Vercel production-branch/approval/preview settings. Without hosting verification, an automatic production deployment must not be assumed impossible just because this branch is named as a feature branch.
- No protected hosted staging or production rollback rehearsal has been performed. Public-site/hosting parity, actual TLS/security headers, production metrics, real iOS/Android media/browser behavior and complete accessibility/security assessment remain unverified. Chromium responsive emulation is a useful regression layer, not device certification.
- The development Dockerfile still selects Node 22, whereas this phase pins the host/CI to Node 24. Its runtime is not aligned or production-validated; if Docker is needed, review and test that workflow separately before use.
- Strict script CSP, hosting HSTS policy, production container support if needed, provider/region/budget choice, guardian consent/privacy counsel, retention/deletion/backups and incident/release ownership need review before later phases.

Phase 0 implementation stops here. Do not start Film Review or accounts without the owner's separate approval.
