#!/usr/bin/env bash
# Boot the shop (if needed), run Cypress API + e2e workers in Docker (no Cloud).
set -euo pipefail

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

export LISTEN_HOST="${LISTEN_HOST:-0.0.0.0}"
export E2E_HOST="${E2E_HOST:-host.docker.internal}"

mkdir -p allure-results/api allure-results/e2e
rm -rf allure-results/api/* allure-results/e2e/* allure-report 2>/dev/null || true

compose=(docker compose -f docker-compose.cypress.yml)
"${compose[@]}" build

# Restart shop so LISTEN_HOST / E2E_HOST / Vite allowedHosts apply.
bash scripts/e2e-down.sh
bash scripts/e2e-up.sh

failed=0
"${compose[@]}" run --rm --no-deps cypress-api &
pid1=$!
"${compose[@]}" run --rm --no-deps cypress-e2e &
pid2=$!

wait "$pid1" || failed=1
wait "$pid2" || failed=1

if compgen -G "allure-results/api/*" >/dev/null || compgen -G "allure-results/e2e/*" >/dev/null; then
  echo "Generating Allure report…"
  npx allure generate allure-results/api allure-results/e2e -o allure-report --clean || true
fi

if [[ "$failed" -ne 0 ]]; then
  echo "One or more Cypress workers failed." >&2
  exit 1
fi

echo "Cypress Docker workers finished. Open the report with: npm run allure:open"
