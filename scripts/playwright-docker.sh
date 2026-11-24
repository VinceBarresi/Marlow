#!/usr/bin/env bash
# Boot the shop (if needed), run Playwright in 2 Docker shards, merge reports.
set -euo pipefail

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

export LISTEN_HOST="${LISTEN_HOST:-0.0.0.0}"
export E2E_HOST="${E2E_HOST:-host.docker.internal}"

compose=(docker compose -f docker-compose.playwright.yml)
"${compose[@]}" build

# Restart shop so LISTEN_HOST / E2E_HOST / Vite allowedHosts apply.
bash scripts/e2e-down.sh
bash scripts/e2e-up.sh

rm -rf blob-report playwright-report test-results
mkdir -p blob-report test-results

failed=0
"${compose[@]}" run --rm --no-deps playwright-1 &
pid1=$!
"${compose[@]}" run --rm --no-deps playwright-2 &
pid2=$!

wait "$pid1" || failed=1
wait "$pid2" || failed=1

# Always merge blob reports when present (including failed runs).
if compgen -G "blob-report/*" >/dev/null; then
  echo "Merging Playwright blob reports…"
  npx playwright merge-reports --reporter html blob-report || true
  if [[ -f playwright-report/index.html ]]; then
    echo "Merged report: playwright-report/index.html"
  fi
else
  echo "No blob-report files to merge." >&2
fi

if [[ "$failed" -ne 0 ]]; then
  echo "One or more Playwright shards failed." >&2
  exit 1
fi

echo "Playwright Docker shards finished."
