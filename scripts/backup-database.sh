#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

if [[ $# -ne 1 || -z "$1" ]]; then
  echo "Usage: scripts/backup-database.sh /explicit/path/virale-ai.dump" >&2
  exit 1
fi

backup_target="$1"
backup_parent="$(dirname "$backup_target")"
if [[ ! -d "$backup_parent" ]]; then
  echo "Backup directory does not exist: $backup_parent" >&2
  exit 1
fi

pg_dump --dbname="$DATABASE_URL" --format=custom --no-owner --no-privileges --file="$backup_target"
chmod 600 "$backup_target"
echo "Backup written to $backup_target"
