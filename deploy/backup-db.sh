#!/usr/bin/env bash
# Dump the database to a dated file and keep the newest 14.
# Cron example: 0 2 * * * /var/www/smartbid/deploy/backup-db.sh >> /var/log/smartbid-backup.log 2>&1
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$HOME/smartbid-backups}"
KEEP="${KEEP:-14}"

if [ -z "${DATABASE_URL:-}" ]; then
  DATABASE_URL="$(grep -E '^DATABASE_URL=' "$ROOT/backend/.env" | cut -d= -f2- | tr -d '"')"
fi
# pg_dump does not understand Prisma's ?schema= parameter
DB_URL="${DATABASE_URL%%\?*}"

mkdir -p "$BACKUP_DIR"
FILE="$BACKUP_DIR/smartbid-$(date +%Y%m%d-%H%M%S).sql.gz"
pg_dump --no-owner "$DB_URL" | gzip > "$FILE" || { rm -f "$FILE"; echo "Backup failed" >&2; exit 1; }
echo "Backup written: $FILE"

ls -1t "$BACKUP_DIR"/smartbid-*.sql.gz | tail -n +"$((KEEP + 1))" | xargs -r rm --
