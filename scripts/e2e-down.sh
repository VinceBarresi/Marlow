#!/usr/bin/env bash
# Stop apps started by e2e-up.sh (Postgres/Redis stay up).
set -euo pipefail

root=$(cd "$(dirname "$0")/.." && pwd)
logdir="$root/.e2e-logs"

if [[ -d "$logdir" ]]; then
  for pidfile in "$logdir"/*.pid; do
    [[ -f "$pidfile" ]] || continue
    pid=$(cat "$pidfile" 2>/dev/null || true)
    if [[ -n "${pid:-}" ]]; then
      kill "$pid" 2>/dev/null || true
      pkill -P "$pid" 2>/dev/null || true
    fi
    rm -f "$pidfile"
  done
fi

# Also clear listeners on shop ports (covers stale vite/tsx not tracked by pid files).
ports=(4000 4001 4002 4004 4005 4006 5173 5174 5175)
for port in "${ports[@]}"; do
  if command -v lsof >/dev/null 2>&1; then
    pids=$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null || true)
    if [[ -n "${pids:-}" ]]; then
      # shellcheck disable=SC2086
      kill $pids 2>/dev/null || true
      sleep 0.2
      # shellcheck disable=SC2086
      kill -9 $pids 2>/dev/null || true
    fi
  fi
done
