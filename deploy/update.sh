#!/usr/bin/env bash
# Pull latest code, update DB schema, restart API, rebuild frontend. Run from anywhere.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

git pull --ff-only

cd "$ROOT/backend"
npm ci --include=dev   # prisma CLI is a devDependency; --omit=dev would make npx fetch an unpinned prisma
npx prisma generate
npx prisma db push

pm2 restart smartbid-api || pm2 start "$ROOT/deploy/ecosystem.config.js"
pm2 save

cd "$ROOT/frontend"
npm ci
npm run build

echo "Update complete."
