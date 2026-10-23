#!/usr/bin/env bash
# Synthetic staging only. Never run against production; no service/database is provisioned by this script.
set -euo pipefail
umask 077
[[ "${QB_LAB_BACKUP_STAGE:-}" == "synthetic-staging" ]] || { echo 'Backup is disabled.' >&2; exit 1; }
[[ -f "${PGSERVICEFILE:-}" && -f "${PGPASSFILE:-}" ]] || { echo 'Reviewed staging service/password files are required.' >&2; exit 1; }
[[ "${QB_LAB_BACKUP_RECIPIENT:-}" =~ ^age1[a-z0-9]{58}$ ]] || { echo 'An age public recipient is required.' >&2; exit 1; }
[[ -d "${QB_LAB_BACKUP_DIRECTORY:-}" && ! -L "$QB_LAB_BACKUP_DIRECTORY" ]] || { echo 'A private backup directory is required.' >&2; exit 1; }
[[ "$(stat -c '%a' "$PGPASSFILE")" == '600' ]] || { echo 'Password file must have mode 600.' >&2; exit 1; }
[[ "$(stat -c '%a' "$QB_LAB_BACKUP_DIRECTORY")" == '700' ]] || { echo 'Backup directory must have mode 700.' >&2; exit 1; }
command -v pg_dump >/dev/null
command -v age >/dev/null
output=$(mktemp "$QB_LAB_BACKUP_DIRECTORY/qb-staging-$(date -u +%Y%m%dT%H%M%SZ)-XXXXXX.age")
complete=false
trap 'if [[ "$complete" != true ]]; then rm -f -- "$output" "$output.sha256"; fi' EXIT
trap 'exit 1' HUP INT TERM
# No password/connection URL on argv; service file must define only the approved qb_lab_staging service.
# Plaintext stays in the pipe, never on disk. A failed dump/encrypt removes the partial file.
pg_dump --dbname=service=qb_lab_staging --format=custom --no-owner --no-acl | age --encrypt --recipient "$QB_LAB_BACKUP_RECIPIENT" > "$output"
[[ -s "$output" ]]
sha256sum "$output" > "$output.sha256"
complete=true
printf 'Encrypted staging backup completed. Restore verification is still required.\n'
