#!/usr/bin/env bash
# Start Postgres, Redis, and the apps the shop page needs. Exits once they answer.
set -euo pipefail

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"
logdir="$root/.e2e-logs"
mkdir -p "$logdir"

ready() {
  curl -sf --max-time 2 http://localhost:4000/api/health >/dev/null \
    && curl -sf --max-time 2 -o /dev/null http://localhost:5173/ \
    && curl -sf --max-time 2 -o /dev/null http://localhost:5174/remoteEntry.js \
    && curl -s --max-time 2 -o /dev/null http://localhost:4001/ \
    && curl -s --max-time 2 -o /dev/null http://localhost:4002/
}

if ready; then
  echo "Shop is already running."
  exit 0
fi

echo "Starting Postgres and Redis"
docker compose up -d --wait

users=$(docker compose exec -T postgres psql -U datalab -d datalab -tAc "select to_regclass('public.users')" | tr -d '[:space:]')
if [[ "$users" != "users" ]]; then
  echo "Creating tables and loading the shop."
  for file in server/sql/001_schema.sql server/sql/002_tracking.sql server/sql/004_locations.sql server/sql/005_careers.sql; do
    docker compose exec -T postgres psql -U datalab -d datalab -v ON_ERROR_STOP=1 -f - < "$file"
  done
  node server/scripts/seed.mjs | docker compose exec -T postgres psql -U datalab -d datalab -v ON_ERROR_STOP=1 -q
fi

start() {
  local name=$1 dir=$2
  echo "Starting $name"
  (cd "$root/$dir" && npm run dev) >"$logdir/$name.log" 2>&1 &
  echo $! >"$logdir/$name.pid"
}

start api server
start catalog services/catalog
start orders services/orders
start web web
start catalog-ui frontends/catalog

for _ in $(seq 1 60); do
  if ready; then
    echo "Shop is up."
    exit 0
  fi
  sleep 2
done

echo "Shop did not start. Logs are in .e2e-logs." >&2
exit 1
