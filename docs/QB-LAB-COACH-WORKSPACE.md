# Coach command workspace: implementation and backend scaffold

> Follow-up: the athlete home now shares the dark application frame. References below to the light athlete home describe the original coach-only delivery and are superseded by `QB-LAB-ATHLETE-DARK.md`.


## Delivered interface

Open `/qb-lab/coach`. The athlete home, public coaching website and existing film/simulator/playbook tools are preserved. The new isolated coach console uses deep slate `#0f172a`, elevated navy cards, white/cool-gray text, green `#22c55e` actions and gold keyboard focus/annotation accents. Green buttons use dark text for contrast. Layouts reflow to phone widths; animation is restrained and respects reduced-motion preferences.

Four keyboard-navigable tabs provide:

- **Dashboard:** two fixed synthetic roster profiles, actual local review-queue count, session-plan count and recorded browser activity. An interactive monthly calendar schedules demo sessions and updates the feed/metrics. Calendar starts in the explicitly labeled October 2026 demonstration period; planned times use Eastern time. Activity charts filter real recorded events over 7/30 days as of page opening. Empty activity stays empty; no fabricated performance, skill rating, season statistics or inferred improvement is displayed.
- **Roster:** fixed Alex/Jordan demo cards; configurable offensive depth charts for tackle11, non-contact passing7, flag5/7/8. Moving a player clears their former slot in that format. Drag-and-drop has mobile/keyboard selection alternatives. Three per-athlete planning sliders control footwork, recognition and mechanics emphasis. These are coach-set preferences, not assessed athletic attributes. Vacant positions remain vacant. Position templates are not league eligibility or legal-formation certification.
- **Playbook:** bounded, atomic six-column script parsing; down/distance/concept/situation filters; matching saved-play selection. A script entry links to an actual saved formation/route object and opens that exact play in the live engine through a bounded `play` query parameter. Tags do not manufacture route concepts or infer correct progressions. Passing-event 7v7 play import is not silently mapped to flag7; that adapter remains future work. Missing browser-local plays cannot be transferred to another user's browser by sharing the URL.
- **Film Vault:** separate coach/athlete demonstration faces, a large child-friendly drop area, synthetic submissions, per-demo-player history, queue review, illustration speed/timeline controls, pointer/keyboard annotations and timestamped fixed-vocabulary feedback. Reviewing an item updates its status and dashboard queue. No real file content or filename is read, previewed, retained or uploaded by the drop handler; it only displays a fixed explanation. No browser object URLs are created. Synthetic submission IDs/pairings contain no real athlete information.

The existing age/pathway-filtered assignment desk remains on Dashboard, including actual local completion history, coach-assigned recognition presets and duplicate-assignment protection. Editing new plans does not activate accounts, send notifications or modify real athlete records.

## Module map

| Module | Purpose |
| --- | --- |
| `modules/qb-lab/coach/CoachWorkspace.tsx` | Four-tab shell and session state; hydration disables interactive declarations until ready. |
| `Overview.tsx` | Calendar, schedule feed, actual local metrics/activity chart, preserved assignments. |
| `Roster.tsx` | Athlete cards, drag/drop and selection-based depth placement, coaching emphasis controls. |
| `Strategy.tsx` | Script parsing UI, filters, saved-play association and simulator link. |
| `FilmVault.tsx` | File-free kid-facing demonstration, synthetic queue and illustrated coach-review canvas. |
| `ProtectedVideoPlayer.tsx` | Future native HTML video template with speed controls and protected caption endpoint; deliberately unconnected to demo media. |
| `model.ts` | Bounded parser, format/position definitions, pure move validation and synthetic data contracts. |
| `server/qb-lab/video/policy.ts` | Pure server policy scaffold for exact pair ownership, consent, retention, quarantine and upload metadata. |
| `server/qb-lab/video/contracts.ts` | Unimplemented session/repository/storage/processor adapter interfaces. No provider is provisioned. |
| `server/qb-lab/unavailable.ts` | Shared fail-closed HTTP response, without reading/retaining/forwarding request bodies. |

The existing browser-local versioned store owns saved plays and assignment/activity history. New roster plans, script tags, scheduling and synthetic review state deliberately live only in the mounted Coach Workspace and reset on reload/navigation away. They survive tab changes through parent state. Unsaved review annotations should be saved before leaving the Film tab. There is no trusted backend persistence or multi-user synchronization.

## Play script grammar

```text
Name | format | down | distance | concept | situation
Spacing study | tackle | 1 | Medium | Spacing | Open field
Red-zone study | flag5 | 3 | Short | Custom | Red zone
```

Maximum 16 KB and 24 nonempty lines, bounded names, validated enums and whole-number downs 1–4. All lines validate before replacing the current script. Supported formats: `tackle`, `flag5`, `flag7`, `flag8`. Distances: Short/Medium/Long. Situations: Open field/Red zone/Third down/Two minute. Concepts: Custom/Stick/Smash/Mesh/Flood/Four verticals/Spacing. Concept words are organizational labels; attached routes still require coach review. All four filters combine, and only a matching-format saved play enables the simulator link.

## Backend routing available now

Both catch-all routes return **503 `PRIVATE_SERVICES_UNAVAILABLE`** for GET, POST, PUT, PATCH and DELETE. The response uses `Cache-Control: no-store`, `nosniff` and same-origin resource policy. Neither route inspects client IDs/roles, accepts real uploads, issues storage URLs or creates database rows. Forged role headers do not enable a service. Existing `/api/qb-lab/private/*` fail-closed behavior is unchanged.

| Future endpoint contract | Intended responsibility after integration | Current behavior |
| --- | --- | --- |
| `GET /api/qb-lab/coach/overview` | Authorized coach aggregation over actual records | 503 |
| `GET /api/qb-lab/coach/roster` | Assigned-athlete directory with field minimization | 503 |
| `PUT /api/qb-lab/coach/depth-chart` | Validate format, player relationship and placement transaction | 503 |
| `POST /api/qb-lab/coach/scripts` | Validated tactical script and owned-play association | 503 |
| `POST /api/qb-lab/video/intents` | Verified player session + guardian consent + server-derived coach pairing; quarantined upload capability | 503 |
| `POST /api/qb-lab/video/complete` | Verify uploaded object belongs to intent, then enqueue inspection | 503 |
| `GET /api/qb-lab/video/:id/playback` | Authenticated stream proxy; reauthorize exact pair, current coach relationship, consent, retention and ready state | 503 |
| `GET /api/qb-lab/video/:id/captions` | Same authorization as video; no public transcript endpoint | 503 |
| `POST /api/qb-lab/video/:id/feedback` | Authorized assigned coach, bounded timestamp/annotation validation | 503 |
| `DELETE /api/qb-lab/video/:id` | Verified privacy/deletion procedure with storage/derivative cleanup | 503 |

Route handlers intentionally do not simulate authentication or use browser-selected roles. Before enabling them, implement real session verification, per-operation authorization, CSRF/origin checks, quotas/rate limits, transactional ownership checks, authenticated processing callbacks and database/storage isolation tests. Use appropriate 401/403/404/422 responses only within the reviewed enabled service; current 503 exposes no record-existence information.

## Private video access architecture

`visibility` is server-controlled and fixed to **Private**. The future upload intent derives `playerUserId`, `athleteId` and `coachUserId` from verified server records; caller-supplied ownership, target-coach and visibility values are not inputs to the intent builder. Metadata validation allows bounded MP4/MOV declarations up to 100 MiB, but MIME/extension assertions never replace actual byte/signature validation.

A ready, unexpired video is readable only by its exact uploading player or the currently assigned exact coach. Other athletes, team members, coaches, administrators and guardian browsing roles receive no playback grant from this policy. The record must still match the current athlete/coach relationship; transferring a coach removes the old coach's policy access. Quarantine, deletion, revoked/expired consent and retention expiry deny playback.

These pure-policy arguments are **trusted repository/session outputs**, not accepted request JSON. TypeScript types and URL validation do not authenticate anyone. The current public demonstration's coach/athlete view switch grants no real media access because no real media exists and all routes are disabled.

Future pipeline:

1. Verify the authenticated player and the athlete relationship. For minors, verify the required current guardian consent and notice records before collection. Never use an arbitrary client checkbox as parental verification.
2. Create an opaque, server-owned intent/object key with fixed private pairing, content limits and expiration. Upload only into a nonpublic quarantine namespace using a tightly scoped short-lived capability. Do not retain original filenames unnecessarily.
3. Inspect actual length/type, scan, strip location/device metadata and transcode. Authenticate and make processing callbacks idempotent. Mark ready only after all required checks pass.
4. Serve media and captions through authenticated application endpoints that recheck authorization. Keep provider playback URLs/privileged credentials server-side. A signed URL alone is a bearer capability and needs explicit revocation/TTL review; do not present it as equivalent to per-request identity enforcement.
5. Scope feedback/annotations to the same video/coach relationship, validate timestamps and coordinates, and keep an access audit without recording sensitive URLs or unnecessary child data.
6. Apply owner-approved retention, deletion and consent-withdrawal workflows to originals, derivatives, captions, queued jobs and backups. Recheck consent before issuing/serving access. Parent privacy rights and legally required record access/deletion need a separate verified process; they are not silently implemented as a blanket guardian media-browsing permission.

The native `ProtectedVideoPlayer` template accepts only same-origin `/api/qb-lab/video/:id/playback` and matching-ID captions paths. It offers HTML media controls and playback speed selection, with no public fallback. Its `nodownload` hint is not a security control. The template is not mounted with an authorized media source in this demonstration; Film Vault uses the existing synthetic field illustration instead.

## COPPA and configuration readiness

This delivery is **not a claim of COPPA certification or completed legal compliance**. It collects no real child videos and activates no child accounts. Enabling collection requires reviewed direct parental notice, a suitable verifiable-parental-consent method, privacy policy, data minimization, parental review/deletion rights, retention/security practices, provider agreements and jurisdiction/age handling. The server policy currently requires verified consent for all minors, a deliberately conservative boundary. No client-side age claim or view toggle establishes consent.

Future configuration must be environment-specific and server-only: session verification credentials, database credentials, private object-store bucket/access, worker secrets and callback signing keys. Never put privileged values in `NEXT_PUBLIC_*`, source control or browser bundles. Keep production and Preview storage/users separate; use synthetic data for integration tests. No paid services, providers, secrets or databases are provisioned by this change.

## Verification and review evidence

Lint, TypeScript validation, production build and all 60 component/domain tests pass. The final complete browser run passed 204 tests across desktop, tablet, mobile and compact-phone projects, with zero skips, retries or failures. Coverage includes all four tabs, keyboard navigation, per-athlete preferences, format-safe placement, script-to-exact-simulator launch, synthetic submission/feedback, dropped-file refusal, no upload requests, forged-role HTTP denial, automated axe accessibility and returning to the approved light athlete shell. Known development dependency findings remain unsuppressed. No package/lockfile changes, public coaching page edits, athlete-home redesign, production deployment, main merge or PR #2 modification is included.

An earlier full run had 202 passes and two existing tablet-flow timeouts during concurrent screenshot capture. The film/family test sources, assertions and timeouts were not changed. The final complete run was performed without concurrent capture and passed all 204. Screenshot capture then ran separately.

Fresh dependency audit: zero critical, five pre-existing high development findings involving braces. Production audit: zero findings. No dependencies, lockfile or quality/audit checks were changed.

Desktop/mobile screenshots were captured from the final local production build and visually inspected. The coach-only header/navigation and full console are dark; the athlete shell returns to its approved light appearance. Fixed-position elements can distort tall stitched element captures; the shared mobile submission image is an actual viewport capture. Synthetic schedule/submission/feedback values shown in the captures came from real UI interactions during capture, not invented athlete performance.

Review artifacts:

- `/workspace/artifacts/qb-lab-coach/overview-desktop.png`
- `/workspace/artifacts/qb-lab-coach/overview-mobile.png`
- `/workspace/artifacts/qb-lab-coach/roster-desktop.png`
- `/workspace/artifacts/qb-lab-coach/playbook-desktop.png`
- `/workspace/artifacts/qb-lab-coach/film-desktop.png`
- `/workspace/artifacts/qb-lab-coach/submission-mobile.png`

## Changed-file manifest

- `README.md`
- `app/api/qb-lab/coach/[...operation]/route.ts`
- `app/api/qb-lab/video/[...operation]/route.ts`
- `app/qb-lab/application.css`
- `app/qb-lab/coach/page.tsx`
- `app/qb-lab/simulator/engine/page.tsx`
- `docs/QB-LAB-COACH-WORKSPACE.md`
- `docs/QB-LAB-PLATFORM-PULL-REQUEST.md`
- `modules/qb-lab/coach/CoachWorkspace.tsx`
- `modules/qb-lab/coach/FilmVault.tsx`
- `modules/qb-lab/coach/Overview.tsx`
- `modules/qb-lab/coach/ProtectedVideoPlayer.tsx`
- `modules/qb-lab/coach/Roster.tsx`
- `modules/qb-lab/coach/Strategy.tsx`
- `modules/qb-lab/coach/model.ts`
- `modules/qb-lab/live-engine/EngineLab.tsx`
- `modules/qb-lab/platform/Coach.tsx`
- `server/qb-lab/unavailable.ts`
- `server/qb-lab/video/contracts.ts`
- `server/qb-lab/video/policy.ts`
- `tests/components/coach-workspace.test.tsx`
- `tests/domain/coach-workspace.test.ts`
- `tests/e2e/coach-workspace.spec.ts`
