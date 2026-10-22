#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
container_name="qblab-security-test-$$"
image="postgres@sha256:eee6c6e1b0894fa4fe0075eb054af9fd1cf39a35321c2d4110626cfe506411fb"
# Ephemeral, synthetic, no network and no published port. No paid/remote database.
docker run --detach --rm --network none --name "$container_name" -e POSTGRES_HOST_AUTH_METHOD=trust "$image" >/dev/null
trap 'docker rm --force "$container_name" >/dev/null 2>&1 || true' EXIT
for attempt in {1..30}; do
 if docker exec "$container_name" pg_isready -U postgres >/dev/null 2>&1; then break; fi
 sleep 1
done
for sql_file in tests/database/auth-fixture.sql db/migrations/001_qb_lab_candidate.sql tests/database/isolation.sql; do
 docker exec --interactive "$container_name" psql --username postgres --set ON_ERROR_STOP=1 < "$sql_file"
done
