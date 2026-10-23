# Athlete redesign — current dependency security status

Checked 2026-10-23 on `feat/qb-lab-experience`. **Full npm audit: zero findings, exit 0. Production-only audit: zero findings, exit 0.** An independent full audit using an explicit official-registry URL also returns zero findings, exit 0. All severity counts, including high and critical, are zero in these current reports.

## Why this differs from the earlier five high findings

GitHub now labels [GHSA-vfj7-8cjw-p6xm / CVE-2026-93687](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) **Withdrawn**, dated **October 23, 2026**. Its explanation states:

> This advisory has been withdrawn because it's not a practically exploitable vulnerability. This link is maintained to preserve external references.

The advisory page still lists the historical affected range `<= 3.0.3` and patched versions `None`. The latest published `braces` version remains 3.0.3. No supported package patch was applied and no version override, audit suppression, incompatible downgrade or disabled check was introduced.

Installed development dependency chain is unchanged:

```text
eslint-config-next@16.4.2
└─ @next/eslint-plugin-next@16.4.2
   └─ fast-glob@3.3.1
      └─ micromatch@4.0.8
         └─ braces@3.0.3
```

The earlier five high findings were the actual prior audit result for this chain, including propagated package findings. They were not five independent newly patched defects. The current zero result follows the upstream advisory withdrawal; it must not be described as a code or dependency fix. Historical reports remain evidence of their original observation time rather than the current registry result.

## Reproduction and evidence

Commands run from the repository root:

```bash
npm config get registry
npm --cache /tmp/qb-npm-cache audit --json
npm --cache /tmp/qb-npm-cache audit --omit=dev --json
npm --registry=https://registry.npmjs.org --cache /tmp/qb-npm-cache audit --json
npm --registry=https://registry.npmjs.org --cache /tmp/qb-npm-cache view braces version dist-tags --json
npm ls braces micromatch fast-glob @next/eslint-plugin-next eslint-config-next
git diff -- package.json package-lock.json
```

The configured registry is already `https://registry.npmjs.org/`. Explicit-registry verification rules out a different configured registry as the explanation. The package/package-lock diff is empty for this redesign. Local evidence files, outside tracked source:

- `/tmp/qb-redesign-audit.json` — current full audit, zero findings.
- `/tmp/qb-redesign-prod-audit.json` — current production-only audit, zero findings.
- `/tmp/qb-redesign-official-audit.json` — independent explicit-official-registry full audit, zero findings.
- `/tmp/qb-redesign-braces-advisory.html` and `.txt` — captured public upstream withdrawal statement.
- `/tmp/qb-redesign-braces-metadata.json` — official registry version/tag/publication metadata.

Keep CI's complete and production audit steps enforced. Older failed hosted runs remain historical failures; current hosted status must be verified against the exact final commit after publication. A clean local audit alone does not establish a passing hosted run or authorize a merge.

## Unchanged private-service and launch boundaries

No secret value was read, printed or committed for this investigation. No dependency, environment, provider, account, storage bucket, consent process, database migration, payment or production deployment was activated.

Dedicated QB LAB staging infrastructure, verified identities/guardian relationships and consent, private-video processing/access/deletion, hosted isolation/restore and operational safeguards remain unapproved or incomplete. The application continues to use synthetic profiles and browser-local training history. A zero dependency audit does not establish full application security, coaching approval, COPPA certification, real athlete beta readiness or public-launch readiness. PR #3 remains draft; PR #2 and Phase 0 documents are unchanged.
