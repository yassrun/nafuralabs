#!/usr/bin/env bash
# Apply nafura-platform/ops/secrets/nafura.secrets sections for ENV into Vault KV (via kubectl exec).
# Called by nlops bootstrap-env / vault-seed — not for manual prod init on bare metal.
set -euo pipefail

ENV="${1:?ENV required (staging|prod|demo)}"
ROOT="${ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)}"
SECRETS_FILE="${SECRETS_FILE:-$ROOT/nafura-platform/ops/secrets/nafura.secrets}"
KUBECTL_BIN="${KUBECTL_BIN:-kubectl}"
KUBE_CONTEXT="${KUBE_CONTEXT:-}"

infra_namespace_for_env() {
  case "$1" in
    staging) echo "nafura-infra-staging" ;;
    prod) echo "nafura-infra-prod" ;;
    demo) echo "nafura-infra-demo" ;;
    *) echo "unknown env $1" >&2; return 1 ;;
  esac
}

if [[ -n "$KUBE_CONTEXT" ]]; then
  KUBECTL() { "$KUBECTL_BIN" --context="$KUBE_CONTEXT" "$@"; }
else
  KUBECTL() { "$KUBECTL_BIN" "$@"; }
fi

if [[ ! -f "$SECRETS_FILE" ]]; then
  echo "ERROR: secrets file not found: $SECRETS_FILE" >&2
  echo "Create nafura-platform/ops/secrets/nafura.secrets — see nafura-platform/ops/secrets/README.md" >&2
  exit 1
fi

INFRA_NS="$(infra_namespace_for_env "$ENV")"

if ! KUBECTL get deployment vault -n "$INFRA_NS" >/dev/null 2>&1; then
  echo "ERROR: vault deployment missing in namespace $INFRA_NS" >&2
  exit 1
fi

ROOT_TOKEN="$(KUBECTL get secret vault-bootstrap -n "$INFRA_NS" -o jsonpath='{.data.root_token}' 2>/dev/null | base64 -d || true)"
if [[ -z "$ROOT_TOKEN" ]]; then
  echo "ERROR: secret/vault-bootstrap root_token missing in $INFRA_NS — run vault-init first" >&2
  exit 1
fi

vault_kv_put() {
  local vault_path="$1"
  shift
  if [[ $# -eq 0 ]]; then
    return 0
  fi
  echo "  → secret/nafura/${ENV}/${vault_path}"
  KUBECTL exec -n "$INFRA_NS" deploy/vault -- env \
    VAULT_ADDR=http://127.0.0.1:8200 \
    VAULT_TOKEN="$ROOT_TOKEN" \
    vault kv put "secret/nafura/${ENV}/${vault_path}" "$@"
}

current_section=""
declare -a kv_args=()

flush_section() {
  if [[ -z "$current_section" ]]; then
    return 0
  fi
  if [[ ${#kv_args[@]} -gt 0 ]]; then
    vault_kv_put "$current_section" "${kv_args[@]}"
  fi
  kv_args=()
}

echo "Seeding Vault from $SECRETS_FILE (ENV=$ENV, namespace=$INFRA_NS)..."

while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"
  line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  [[ -z "$line" ]] && continue

  if [[ "$line" =~ ^\[([^]]+)\]$ ]]; then
    flush_section
    section="${BASH_REMATCH[1]}"
    if [[ "$section" != "${ENV}/"* ]]; then
      current_section=""
      continue
    fi
    current_section="${section#${ENV}/}"
    continue
  fi

  [[ -z "$current_section" ]] && continue

  if [[ "$line" != *"="* ]]; then
    echo "WARN: skip invalid line (expected key=value): $line" >&2
    continue
  fi

  key="${line%%=*}"
  val="${line#*=}"
  key="$(echo "$key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  kv_args+=("${key}=${val}")
done < "$SECRETS_FILE"

flush_section

echo "Vault seed complete for ENV=$ENV."
