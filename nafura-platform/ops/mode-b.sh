#!/usr/bin/env bash
# One-shot Mode B (Sektor): env + Postgres PF + bootRun + start:erp:cursor.
# Usage (from repo root):
#   make -C nafura-platform/ops mode-b
#   make -C nafura-platform/ops mode-b-stop
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export KUBE_CONTEXT="${KUBE_CONTEXT:-docker-desktop}"
export ENV="${ENV:-staging}"
cmd="${1:-start}"
case "$cmd" in
  stop)
    exec bash "$DIR/dev-staging-local.sh" stop
    ;;
  start)
    exec bash "$DIR/dev-staging-local.sh" start "${2:-sektor-btp}" "${3:-full}"
    ;;
  *)
    echo "usage: bash nafura-platform/ops/mode-b.sh [start|stop]" >&2
    exit 1
    ;;
esac
