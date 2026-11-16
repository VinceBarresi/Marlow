#!/usr/bin/env bash
# Start Postgres, Redis, and every Marlow app. Ctrl+C stops the apps and leaves Docker running.
set -euo pipefail

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required." >&2
  exit 1
fi
if ! command -v npm >/dev/null 2>&1 || ! command -v node >/dev/null 2>&1; then
  echo "Node and npm are required. Load nvm, then run this again." >&2
  exit 1
fi

echo "Starting Postgres and Redis"
docker compose up -d --wait

users=$(docker compose exec -T postgres psql -U datalab -d datalab -tAc "select to_regclass('public.users')" | tr -d '[:space:]')
if [[ "$users" != "users" ]]; then
  echo "Empty database. Creating tables and loading the shop."
  for file in server/sql/001_schema.sql server/sql/002_tracking.sql server/sql/004_locations.sql server/sql/005_careers.sql; do
    docker compose exec -T postgres psql -U datalab -d datalab -v ON_ERROR_STOP=1 -f - < "$file"
  done
  node server/scripts/seed.mjs | docker compose exec -T postgres psql -U datalab -d datalab -v ON_ERROR_STOP=1 -q
fi

ports=(4000 4001 4002 4003 5173 5174 5175)
if command -v lsof >/dev/null 2>&1; then
  for port in "${ports[@]}"; do
    if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      echo "Port $port is already in use. Stop that process, then run this again." >&2
      exit 1
    fi
  done
fi

apps=(
  "api|server"
  "catalog|services/catalog"
  "orders|services/orders"
  "db|services/db"
  "web|web"
  "catalog-ui|frontends/catalog"
  "orders-ui|frontends/orders"
)

for spec in "${apps[@]}"; do
  dir=${spec#*|}
  if [[ ! -d "$dir/node_modules" ]]; then
    echo "Installing $dir"
    (cd "$dir" && npm install)
  fi
done

pids=()
use_script=0
if ! script -q /dev/null true 2>&1 | grep -q openpty; then
  use_script=1
fi

kill_tree() {
  local pid=$1 child
  for child in $(pgrep -P "$pid" 2>/dev/null || true); do
    kill_tree "$child"
  done
  kill "$pid" 2>/dev/null || true
}

cleanup() {
  local pid
  echo
  echo "Stopping apps. Postgres and Redis stay up."
  for pid in "${pids[@]+"${pids[@]}"}"; do
    kill_tree "$pid"
  done
}

trap 'cleanup; exit 0' INT TERM

for spec in "${apps[@]}"; do
  name=${spec%%|*}
  dir=${spec#*|}
  (
    cd "$root/$dir"
    if [[ "$use_script" -eq 1 ]]; then
      script -q /dev/null npm run dev
    else
      npm run dev
    fi 2>&1 | while IFS= read -r line; do
      printf '[%s] %s\n' "$name" "$line"
    done
  ) &
  pids+=($!)
done

echo "Shop: http://localhost:5173"
echo "API:  http://127.0.0.1:4000"
echo "Docs: http://127.0.0.1:4000/docs"
wait
