#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
container_name="qblab-security-test-$$"
image="postgres@sha256:eee6c6e1b0894fa4fe0075eb054af9fd1cf39a35321c2d4110626cfe506411fb"
# Ephemeral, synthetic, no network and no published port. No paid/remote database.
docker run --detach --rm --network none --name "$container_name" -e POSTGRES_HOST_AUTH_METHOD=trust "$image" >/dev/null
trap 'docker rm --force "$container_name" >/dev/null 2>&1 || true' EXIT
ready=false
for attempt in {1..30}; do
 # The image's temporary init server accepts Unix sockets, then stops. Only the
 # final server listens on TCP; loopback stays inside this network-none container.
 if docker exec "$container_name" pg_isready -U postgres -h 127.0.0.1 >/dev/null 2>&1; then ready=true; break; fi
 sleep 1
done
if [[ "$ready" != true ]]; then
 docker logs "$container_name" >&2
 echo "Ephemeral PostgreSQL did not become ready." >&2
 exit 1
fi
for sql_file in tests/database/auth-fixture.sql db/migrations/001_qb_lab_candidate.sql tests/database/isolation.sql db/migrations/002_qb_lab_persistence.sql tests/database/persistence.sql db/migrations/003_qb_lab_billing_inbox.sql tests/database/billing.sql; do
 echo "Checking $sql_file"
 docker exec --interactive "$container_name" psql --host 127.0.0.1 --username postgres --set ON_ERROR_STOP=1 < "$sql_file"
done
