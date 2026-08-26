#!/usr/bin/env bash
# Mint a local Mode B QA Bearer token (no Keycloak).
# Requires: backend running with NAFURA_DEV_CURSOR_AUTH_ENABLED=true
# Usage:
#   eval "$(bash nafura-platform/ops/qa-token.sh)"              # owner (auto-login)
#   eval "$(bash nafura-platform/ops/qa-token.sh magasinier)"   # alias
#   eval "$(bash nafura-platform/ops/qa-token.sh qa.dg@nafuralabs.local)"
#   bash nafura-platform/ops/qa-token.sh --list
set -euo pipefail

API_BASE="${NAFURA_QA_API_BASE:-http://localhost:8082}"
BASE="${API_BASE%/}"
SESSION_URL="${BASE}/api/public/dev/cursor-session"
IDENTITIES_URL="${BASE}/api/public/dev/cursor-identities"

if ! command -v curl >/dev/null 2>&1; then
  echo "ERROR: curl required" >&2
  exit 1
fi

if [[ "${1:-}" == "--list" ]]; then
  RESP="$(curl -sS -X GET "$IDENTITIES_URL" -H 'Accept: application/json' || true)"
  if [[ -z "$RESP" ]]; then
    echo "ERROR: empty response from $IDENTITIES_URL — is bootRun up with cursor auth?" >&2
    exit 1
  fi
  printf '%s\n' "$RESP"
  exit 0
fi

SELECTOR="${1:-}"
CURL_ARGS=(-sS -X POST -G "$SESSION_URL" -H 'Accept: application/json')
if [[ -n "$SELECTOR" ]]; then
  if [[ "$SELECTOR" == *@* ]]; then
    CURL_ARGS+=(--data-urlencode "email=${SELECTOR}")
  else
    CURL_ARGS+=(--data-urlencode "role=${SELECTOR}")
  fi
fi

RESP="$(curl "${CURL_ARGS[@]}" || true)"
if [[ -z "$RESP" ]]; then
  echo "ERROR: empty response from $SESSION_URL — is bootRun up with cursor auth?" >&2
  exit 1
fi

if command -v jq >/dev/null 2>&1; then
  TOKEN="$(printf '%s' "$RESP" | jq -r '.accessToken // empty')"
  TENANT_ID="$(printf '%s' "$RESP" | jq -r '.tenantId // empty')"
  EMAIL="$(printf '%s' "$RESP" | jq -r '.email // empty')"
  TENANT_SLUG="$(printf '%s' "$RESP" | jq -r '.tenantSlug // empty')"
else
  TOKEN="$(printf '%s' "$RESP" | sed -n 's/.*"accessToken"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)"
  TENANT_ID="$(printf '%s' "$RESP" | sed -n 's/.*"tenantId"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)"
  EMAIL="$(printf '%s' "$RESP" | sed -n 's/.*"email"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)"
  TENANT_SLUG="$(printf '%s' "$RESP" | sed -n 's/.*"tenantSlug"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)"
fi

if [[ -z "${TOKEN:-}" || "$TOKEN" == "null" ]]; then
  echo "ERROR: no accessToken in response from $SESSION_URL" >&2
  echo "$RESP" >&2
  exit 1
fi

printf 'export TOKEN=%q\n' "$TOKEN"
printf 'export TENANT_ID=%q\n' "$TENANT_ID"
printf 'export QA_EMAIL=%q\n' "${EMAIL:-qa@nafuralabs.local}"
printf 'export TENANT_SLUG=%q\n' "${TENANT_SLUG:-qa-local}"

echo "# QA session: ${EMAIL:-qa@…} @ ${TENANT_SLUG:-qa-local} (TENANT_ID=$TENANT_ID)" >&2
echo "# Use: curl -H \"Authorization: Bearer \$TOKEN\" -H \"X-Tenant-Id: \$TENANT_ID\" ..." >&2
