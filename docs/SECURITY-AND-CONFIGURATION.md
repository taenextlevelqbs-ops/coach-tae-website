# QB LAB configuration and contribution policy

Phase 0 prepares the public site only. Authentication, databases, private storage, accounts, billing and upload endpoints are not implemented or provisioned. The [implementation plan](QB-LAB-IMPLEMENTATION-PLAN.md) remains a proposal beyond this phase.

## Branch, PR and release workflow

1. Use the existing isolated checkout; no worktree is required. Fetch main and create a short-lived branch, e.g. `chore/qb-lab-phase-0` or `feat/qb-lab-identity`. Preserve uncommitted work. Never force-reset main.
2. Keep a PR within one approved phase/capability. Use synthetic fixtures only; review code, lockfile changes, permission boundaries and failed as well as passed checks. Open a draft PR against main using the template.
3. Run the README checks. Never force-push shared work, merge into main, activate payments or deploy production without owner approval.
4. The checked-in `Phase 0 quality` workflow pins action commits, uses read-only repository permissions, frozen npm installation, disposable local servers and no deployment commands or application secrets. It uses `pull_request`, never privileged `pull_request_target` to execute incoming code. Limit artifact retention; future traces must not contain private data, tokens or signed URLs.
5. An owner must configure a main-branch ruleset requiring PR review, resolved discussions, stale-approval dismissal, the `quality` and `dependency-audit` jobs, and protection against direct/force pushes and branch deletion. Verify exact check names after the first hosted run. **A YAML file does not activate branch protection.**
6. The full audit job intentionally fails for the unpatched development dependency finding. No blanket exception is added. An owner may decide on a narrow, time-limited exception after reviewing exposure; that decision is not made by this PR. Do not drop the check for a green badge.
7. Before pushing, verify the hosting production branch and approval protections. Feature branches must only produce protected previews with isolated config and synthetic data, if preview generation is enabled at all. Local Git commands cannot enforce third-party hosting settings.
8. An eventual release needs staging acceptance, real mobile-browser checks, production-header verification, booking checks and an approved rollback rehearsal. Retain a known-good deployment/commit; hosting rollback and production deployment require approval. Neither is performed here.

## Runtime and dependency controls

`.nvmrc` pins Node 24.19.0; `engines.node` selects Node 24 and `packageManager` records npm 11.9.0. Align hosting and CI to the same major; hosting settings are not changed by the repository. Commit the lockfile and use `npm ci`. Preserve TLS, artifact integrity and checksum verification.

Prefer compatible patches, with matching Next.js and eslint-config-next versions. Inspect the lockfile and run full/production audits plus the actual build/browser tests. Do not apply `npm audit fix --force` blindly: the currently suggested config downgrade does not safely fix this project. Untrusted development tooling still requires containment: no application credentials in CI, timeouts and no user-supplied glob patterns in lint config.

The existing Dockerfile remains a **development recipe**, not an approved production image. It still selects Node 22 and is not aligned with the new host/CI pin; Docker execution was not validated in this phase. `.dockerignore` now excludes `.git`, env files, dependencies, generated output and test artifacts from the build context. If Docker is needed, separately review and test runtime alignment and a multistage, frozen-install, non-root production build. Do not deploy the current development-server image.

## Future configuration classification

The public application currently requires no application secrets. Do not provision services or insert dummy credentials to populate fields. The following are proposed contracts, not variables read by Phase 0 code. Implement a provider-specific server-validated schema only after the corresponding capability is authorized.

| Configuration | Classification/location | Required future validation |
| --- | --- | --- |
| Canonical app URL and stage | Non-secret server configuration | HTTPS except local development; exact redirect origins. Stage strings do not grant permissions. |
| Auth issuer, client ID and callback origins | Provider metadata, server-only unless selected SDK explicitly requires public metadata | Separate identity applications per environment; exact callback allowlist; no production callback into previews. |
| Auth client secret and session/signing keys | Secret manager/hosting settings, server-only | Provider-recommended entropy, rotation, secure cookies, staff MFA and safe recovery; no logging values. |
| `DATABASE_URL`, migration credentials | Secret, scoped server/worker access | Separate DBs/roles per environment; TLS verification, pooling, least privilege and tenant/RLS boundaries. Migration credentials never enter browser config. |
| Storage endpoint/bucket/region | Server metadata | Exact trusted destinations; private ACL, denied public listing/access; environment separation and quarantine/approved prefixes. |
| Storage credentials/signing authority | Secret, scoped server/worker IAM | Prefer short-lived workload credentials. Authorize consent/ownership before issuing bounded expiring upload/playback capabilities; no browser service keys. |
| Media/email webhook secrets and email API credentials | Secret, dedicated server/worker scope | Authenticate callbacks, timestamp/replay protection, idempotency, safe staging email destinations and redacted signatures. |
| Payment configuration | Not introduced | Requires later commercial/provider approval; no checkout or keys needed in Phase 0. |

Use ignored `.env.local` only for authorized local setup. Never place secrets in `NEXT_PUBLIC_*`, `next.config.ts` `env`, tracked JSON, fixtures, URLs, screenshots, build logs or client imports. Public variables are bundled at build time; a server-side rotation does not repair a leaked browser bundle. Add a sanitized example only when actual provider variable names are known. Inspect variable names/presence, never dump the environment. Use the platform's supported HTTPS Git credentials without extracting them.

When a future module is enabled, fail closed on missing/invalid configuration and return sanitized errors. Never fall back to an empty admin key or public bucket. Feature flags remain server-owned/off by default and never substitute for authentication, consent, resource authorization or entitlements. No dormant QB LAB routes or flags are added in Phase 0.

## Gates before accounts and film

- Approve provider, region, budget, privacy terms and verified parental consent method. Keep legal adulthood separate from college/age-band placement; use verified guardian relationships and parent-visible communication.
- Isolate local, staging and production identity tenants, DBs, storage, signing keys, queues, callbacks and email. Protect previews; never import a production athlete database for tests.
- Centralize deny-by-default authorization for lists, individual resources, playback grants and exports; test cross-family/coach/tenant identifiers. Use database constraints and row policies as defense in depth.
- Keep originals, derivatives, thumbnails and voice private. Validate content/codec/size, process in a quota-limited isolated worker and test resumable uploads. Neither `public/` nor Git may hold athlete film.
- Approve retention/deletion/backup expiry, revocation, export, incident ownership and recovery objectives; verify with synthetic data. Signed URL lifetime bounds revocation speed; use a revocable gateway if immediate revocation is required.
- Revoke exposed credentials at the provider, contain access, assess artifacts/history and document the incident. Deleting a file is not credential revocation.

## HTTP policy and development access

`next.config.ts` adds nosniff, clickjacking denial, referrer policy and camera/microphone/geolocation denial for the public marketing site; disables the framework branding header; and enforces a **partial** CSP (`base-uri`, `object-src`, `frame-ancestors`). Navigation to Calendly/Shopify is unaffected. No HSTS preload/subdomain policy is added without verifying domain/hosting impact.

There is no script/default source policy yet: the static Next.js page requires inline hydration scripts. Strict CSP needs a tested nonce/dynamic-rendering or supported hash strategy, report collection and hosting verification. This partial policy is not full XSS protection. Do not call an `unsafe-inline` policy strict. Future consented in-app capture may need route-specific camera/microphone permissions; current denial is intentional.

Start local development with `npm run dev -- --hostname 127.0.0.1`. Next.js permits localhost and its startup hostname by default. A remote tunnel requires a reviewed specific hostname in `allowedDevOrigins`, never `*`; this setting is unrelated to production auth/CORS. Tests bind their own server on `127.0.0.1:3100` and refuse to reuse another process.

## Decisions requiring an owner

Review remaining audit findings and ESLint ecosystem support; enable actual branch/hosting protections; approve provider/region/budget, consent/retention policy, release ownership and rollback; separately authorize the next phase. None of those settings becomes active merely because this policy is committed.
