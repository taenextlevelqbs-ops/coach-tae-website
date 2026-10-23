# QB LAB launch operations — inactive until owner approval

## Release gates

Keep PR #3 draft and production unchanged. All full dependency checks must pass without suppression or a supported reviewed tooling replacement. Obtain separate QB LAB staging project/region/budget approval; complete the Phase 2 identity, guardian-consent, privacy, upload-processing and deletion gates. Billing is post-beta and disabled. Approved prices and operational data processors are pending.

Before launch record the exact reviewed commit, passing CI run, Preview evidence, schema version, staged access-isolation results, actual backup/restore evidence, rollback owner and incident contacts. No member of the public demo can authorize an administrative operation. Do not promote a Preview or merge main as part of this runbook's preparation.

## Backups and recovery acceptance

1. Inventory the managed database (including identity/consent/role records, grants/RLS/functions), storage objects/derivatives, encryption keys, configuration and processor/vendor retention. A logical SQL dump does not contain video object bytes, provider settings or a complete managed-service recovery plan.
2. Owner selects provider-managed snapshots/PITR and/or encrypted exports after reviewing cost, region, retention, recovery-point objective and recovery-time objective. Do not activate paid PITR without approval. No objective is guaranteed before measurement. Select a separate restricted destination; prohibit public access, browser roles and broad CI artifact publication.
3. Use a least-privileged export identity, protected isolated runner and reviewed `qb_lab_staging` PostgreSQL service entry. Never put a password-bearing database URL on a command line or in logs. Keep password/service files outside Git, mode 600, and the backup directory mode 700. Keep decryption identities in a separate approved secret vault; scripts take only an age **public** recipient.
4. Run `QB_LAB_BACKUP_STAGE=synthetic-staging` with `PGSERVICEFILE`, `PGPASSFILE`, `QB_LAB_BACKUP_RECIPIENT`, `QB_LAB_BACKUP_DIRECTORY` set on the protected runner, then `bash scripts/operations/backup-staging.sh`. All referenced resources are currently unconfigured. Use synthetic data only; never point this script at production during development.
5. Independently validate the ciphertext checksum, decrypt using the isolated recovery identity and restore into a new empty dedicated restore project—never into the source or production database. Review managed-provider restore requirements for identity schemas/extensions/roles. Reapply approved role grants as necessary (the logical export omits ownership/ACLs). Inspect data/schema counts and run migration/RLS/consent/access tests against the restore. Restore storage derivatives/catalog mappings separately and verify private-access denial. Record measured recovery point/time and evidence with no personal data. Encryption without a successful restore rehearsal is not a working recovery system.
6. Only after this evidence and approval install the reviewed workflow/provider automation, remote encrypted upload and retention lifecycle. Verify missing/failed backup alerts and independent restore rehearsals. Test key loss, corrupted archives, expired credentials, quota/network failure and deletion/backup-expiry alignment. Do not send database dumps to ordinary Actions artifacts or chat.

## Proposed operational dashboards (no provider created)

Use an owner-approved region/retention-controlled provider dashboard, with restricted operational access, after privacy review. No athlete-accessible metrics API or fabricated dashboard is added.

- **Application errors:** count `event=qb_lab_server_error` by time window and allowlisted route type/runtime. Verify a synthetic staging exception appears, the public website is excluded, and injected names/tokens/query strings never reach logs. A suggested alert is a sustained error-rate/count increase; choose thresholds using measured staging traffic rather than invented production baselines.
- **Availability:** server error rate/latency and dedicated non-sensitive synthetic probes. Do not probe private videos with shared public URLs. Alert destinations and on-call ownership are pending; no messages are sent by this work.
- **Private services:** aggregate denied access, processing failure/backlog, deletion/retention job age and consent-revocation failures. Implement reviewed counters without logging identities, object URLs or raw events before enabling those services.
- **Billing (post-beta):** verified webhook inbox age, reconciliation failures, duplicates, provider-state mismatch and failed deliveries. A checkout redirect is not proof of payment. Never log card/customer contact details or raw webhook payloads. Test alerting with synthetic provider events before enabling a webhook.
- **Recovery:** time since last verified encrypted archive/upload, failed jobs, restore rehearsal date/results and retention expiry. Alert on the absence of a backup as well as an explicit error. Define the acceptable gap only after agreeing the recovery objectives.

Default logging remains off; `QB_LAB_ERROR_LOGGING=redacted-console` only enables the custom sanitized server event, not complete observability. Configure provider log retention, least-privileged operator roles, access auditing, redaction and external alert delivery before claiming production monitoring. No session replay, child-behavior profiling or client PII logging.

## Incident and rollback

Disable new private writes/billing at their explicit gates before investigating. Preserve minimal approved audit evidence; never copy child data or secrets into issues. Revoke compromised sessions/credentials, review access scope and follow the approved privacy notification process. Use a previously reviewed application commit via the release process; never force-push or merge automatically. Review database forward/rollback compatibility before restoring data. A deploy rollback does not revoke issued media capabilities, undo a charge or restore a database. No production action is performed here.
