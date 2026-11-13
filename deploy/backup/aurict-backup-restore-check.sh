#!/usr/bin/env bash
# Restore the newest (or a given) aurict dump into a throwaway Postgres 17 with no network, check
# that the core tables came back, and record success for the monitoring server. Runs monthly.
set -euo pipefail
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups/aurict}"
dump="${1:-$(find "$BACKUP_DIR/db" -maxdepth 1 -name 'aurict-*.dump' | sort | tail -1)}"
[ -f "$dump" ] || { echo "no dump found" >&2; exit 1; }
name="aurict-restore-check-$$"
trap 'docker rm -f "$name" >/dev/null 2>&1 || true' EXIT
docker run -d --name "$name" --network none -e POSTGRES_PASSWORD="$(head -c 18 /dev/urandom | base64)" \
  -e POSTGRES_DB=aurict postgres:17-alpine >/dev/null
until docker exec "$name" psql -U postgres -d aurict -Atqc 'select 1' >/dev/null 2>&1; do sleep 1; done
start="$(date +%s)"
docker exec -i "$name" pg_restore -U postgres -d aurict --no-owner --no-privileges --exit-on-error < "$dump"
q() { docker exec "$name" psql -U postgres -d aurict -Atqc "$1"; }
for table in users devices refresh_tokens audit_logs; do
  [ "$(q "select to_regclass('public.$table') is not null")" = t ] || { echo "missing table $table" >&2; exit 1; }
done
echo "dump:     $dump ($(du -h "$dump" | cut -f1))"
echo "restored: $(( $(date +%s) - start ))s"
echo "users:    $(q 'select count(*) from users')"
echo "tables:   $(q "select count(*) from information_schema.tables where table_schema = 'public'")"
date -u +%s > "$BACKUP_DIR/restore.last-ok"
