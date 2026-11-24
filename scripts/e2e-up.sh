#!/usr/bin/env bash
# Start Postgres, Redis, and the apps the shop page needs. Exits once they answer.
set -euo pipefail

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"
logdir="$root/.e2e-logs"
mkdir -p "$logdir"

# Reachable from Docker test containers (host.docker.internal) and host browsers.
export LISTEN_HOST="${LISTEN_HOST:-0.0.0.0}"
export E2E_HOST="${E2E_HOST:-host.docker.internal}"

ready() {
  curl -sf --max-time 2 http://127.0.0.1:4000/api/health >/dev/null \
    && curl -sf --max-time 2 -o /dev/null http://127.0.0.1:5173/ \
    && curl -sf --max-time 2 -o /dev/null http://127.0.0.1:5174/remoteEntry.js \
    && curl -sf --max-time 2 -o /dev/null http://127.0.0.1:5175/remoteEntry.js \
    && curl -s --max-time 2 -o /dev/null http://127.0.0.1:4001/ \
    && curl -s --max-time 2 -o /dev/null http://127.0.0.1:4002/ \
    && curl -s --max-time 2 -o /dev/null http://127.0.0.1:4004/
}

if ready; then
  # Docker containers cannot reach a 127.0.0.1-only bind via host.docker.internal.
  if lsof -nP -iTCP:5173 -sTCP:LISTEN 2>/dev/null | grep -q '127.0.0.1:5173'; then
    echo "Shop is loopback-only; restarting for Docker."
    bash "$root/scripts/e2e-down.sh"
  else
    echo "Shop is already running."
    exit 0
  fi
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

apps=(
  server
  services/catalog
  services/orders
  services/shipping
  web
  frontends/catalog
  frontends/orders
)
for dir in "${apps[@]}"; do
  if [[ ! -d "$dir/node_modules" ]]; then
    echo "Installing $dir"
    (cd "$root/$dir" && npm install)
  fi
done

start() {
  local name=$1 dir=$2
  echo "Starting $name"
  (cd "$root/$dir" && npm run dev) >"$logdir/$name.log" 2>&1 &
  echo $! >"$logdir/$name.pid"
}

start api server
start catalog services/catalog
start orders services/orders
start shipping services/shipping
start web web
start catalog-ui frontends/catalog
start orders-ui frontends/orders

for _ in $(seq 1 60); do
  if ready; then
    # Fail fast if Vite still rejects the Docker hostname (remotes won't load).
    for port in 5174 5175; do
      code=$(curl -sS -o /dev/null -w "%{http_code}" \
        -H "Host: ${E2E_HOST}:${port}" \
        "http://127.0.0.1:${port}/remoteEntry.js" || true)
      if [[ "$code" != "200" ]]; then
        echo "Vite on :${port} rejected Host ${E2E_HOST} (HTTP ${code}). Check server.allowedHosts." >&2
        exit 1
      fi
    done
    echo "Shop is up."
    exit 0
  fi
  sleep 2
done

echo "Shop did not start. Logs are in .e2e-logs." >&2
exit 1
