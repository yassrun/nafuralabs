#!/usr/bin/env bash
# Mint a local Mode B QA Bearer token (no Keycloak).
# Requires: backend running with NAFURA_DEV_CURSOR_AUTH_ENABLED=true
# Usage:
#   eval "$(bash toolchain/ops/qa-token.sh)"
#   curl -s -H "Authorization: Bearer $TOKEN" -H "X-Tenant-Id: $TENANT_ID" \
#     "http://localhost:8082/api/..."
set -euo pipefail

API_BASE="${NAFURA_QA_API_BASE:-http://localhost:8082}"
URL="${API_BASE%/}/api/public/dev/cursor-session"

if ! command -v curl >/dev/null 2>&1; then
  echo "ERROR: curl required" >&2
  exit 1
fi

RESP="$(curl -sS -X POST "$URL" -H 'Accept: application/json' || true)"
if [[ -z "$RESP" ]]; then
  echo "ERROR: empty response from $URL — is bootRun up with cursor auth?" >&2
  exit 1
fi

if command -v jq >/dev/null 2>&1; then
  TOKEN="$(printf '%s' "$RESP" | jq -r '.accessToken // empty')"
  TENANT_ID="$(printf '%s' "$RESP" | jq -r '.tenantId // empty')"
  EMAIL="$(printf '%s' "$RESP" | jq -r '.email // empty')"
  TENANT_SLUG="$(printf '%s' "$RESP" | jq -r '.tenantSlug // empty')"
else
  # Minimal fallback without jq
  TOKEN="$(printf '%s' "$RESP" | sed -n 's/.*"accessToken"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)"
  TENANT_ID="$(printf '%s' "$RESP" | sed -n 's/.*"tenantId"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)"
  EMAIL="$(printf '%s' "$RESP" | sed -n 's/.*"email"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)"
  TENANT_SLUG="$(printf '%s' "$RESP" | sed -n 's/.*"tenantSlug"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)"
fi

if [[ -z "${TOKEN:-}" || "$TOKEN" == "null" ]]; then
  echo "ERROR: no accessToken in response from $URL" >&2
  echo "$RESP" >&2
  exit 1
fi

# Shell-exportable (eval-friendly)
printf 'export TOKEN=%q\n' "$TOKEN"
printf 'export TENANT_ID=%q\n' "$TENANT_ID"
printf 'export QA_EMAIL=%q\n' "${EMAIL:-qa@nafuralabs.local}"
printf 'export TENANT_SLUG=%q\n' "${TENANT_SLUG:-qa-local}"

# Human hint on stderr
echo "# QA session: ${EMAIL:-qa@…} @ ${TENANT_SLUG:-qa-local} (TENANT_ID=$TENANT_ID)" >&2
echo "# Use: curl -H \"Authorization: Bearer \$TOKEN\" -H \"X-Tenant-Id: \$TENANT_ID\" ..." >&2
