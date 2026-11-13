#!/usr/bin/env bash
# Pull a backup of the aurict database from its server. Runs on the backup machine, never on the
# server; the server's key for this machine only allows `pg_dump` (deploy/aurict/bin/aurict-backup-serve).
# Keeps 14 daily dumps plus the first dump of each of the last 6 months.
# Config: BACKUP_DIR/backup.env (mode 600): BACKUP_SOURCE (ssh destination), BACKUP_KEY (that key),
# optionally NTFY_URL and NTFY_TOKEN (a message is posted there on failure).
set -euo pipefail
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups/aurict}"
# shellcheck source=/dev/null
source "$BACKUP_DIR/backup.env"
: "${BACKUP_SOURCE:?set in backup.env}" "${BACKUP_KEY:?set in backup.env}"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
dir="$BACKUP_DIR/db"
mkdir -p "$dir" "$dir/monthly" "$BACKUP_DIR/metrics"

notify() {
  [ -n "${NTFY_URL:-}" ] || return 0
  printf 'header = "Authorization: Bearer %s"\n' "${NTFY_TOKEN:-}" \
    | curl -fsS -m 20 -K - -H "Title: aurict backup failed" -H "Priority: high" -H "Tags: warning" \
      -d "$1" "$NTFY_URL" >/dev/null || true
}
trap 'notify "aurict backup failed ($stamp, line $LINENO)"' ERR

part="$dir/.aurict-$stamp.dump.part"
trap 'rm -f "$part"' EXIT
ssh -i "$BACKUP_KEY" -o BatchMode=yes -o ConnectTimeout=20 -o ServerAliveInterval=30 "$BACKUP_SOURCE" pg_dump > "$part"
# A complete custom-format dump starts with PGDMP and its table of contents can be listed.
[ "$(head -c 5 "$part")" = "PGDMP" ]
docker run --rm -i --network none postgres:17-alpine pg_restore --list < "$part" > /dev/null
chmod 600 "$part"
mv "$part" "$dir/aurict-$stamp.dump"
sha256sum "$dir/aurict-$stamp.dump" | sed "s#  $dir/#  #" > "$dir/aurict-$stamp.dump.sha256"

month="${stamp:0:6}"
if ! compgen -G "$dir/monthly/aurict-${month}*.dump" > /dev/null; then
  cp -p "$dir/aurict-$stamp.dump" "$dir/monthly/"
fi
prune() {  # prune <dir> <glob> <keep>
  find "$1" -maxdepth 1 -name "$2" -printf '%f\n' | sort | head -n "-$3" | while read -r name; do rm -f -- "$1/$name" "$1/$name.sha256"; done
}
prune "$dir" 'aurict-*.dump' 14
prune "$dir/monthly" 'aurict-*.dump' 6

date -u +%s > "$BACKUP_DIR/db.last-ok"
{
  echo "# HELP aurict_backup_last_success_timestamp_seconds Unix time of the last verified database backup."
  echo "# TYPE aurict_backup_last_success_timestamp_seconds gauge"
  echo "aurict_backup_last_success_timestamp_seconds $(cat "$BACKUP_DIR/db.last-ok")"
  echo "# HELP aurict_backup_size_bytes Size of the newest dump."
  echo "# TYPE aurict_backup_size_bytes gauge"
  echo "aurict_backup_size_bytes $(stat -c %s "$dir/aurict-$stamp.dump")"
  if [ -f "$BACKUP_DIR/restore.last-ok" ]; then
    echo "# HELP aurict_backup_restore_test_timestamp_seconds Unix time of the last successful restore test."
    echo "# TYPE aurict_backup_restore_test_timestamp_seconds gauge"
    echo "aurict_backup_restore_test_timestamp_seconds $(cat "$BACKUP_DIR/restore.last-ok")"
  fi
} > "$BACKUP_DIR/metrics/.aurict_backup.prom.tmp"
mv "$BACKUP_DIR/metrics/.aurict_backup.prom.tmp" "$BACKUP_DIR/metrics/aurict_backup.prom"
