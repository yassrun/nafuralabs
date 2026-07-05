#!/usr/bin/env bash
# Migrate Vault KV paths from legacy infra/* + apps/*/db|minio to platform/* + apps/*/database|object-storage.
# Idempotent — safe to re-run. Does not delete old paths (rollback friendly).
#
# Usage:
#   ENV=prod INFRA_NAMESPACE=nafura-infra-prod bash infra/scripts/vault-migrate-platform-paths.sh
#   VAULT_TOKEN=hvs.xxx ENV=prod bash infra/scripts/vault-migrate-platform-paths.sh
set -eu

ENV="${ENV:?ENV required (staging|prod|demo)}"
INFRA_NAMESPACE="${INFRA_NAMESPACE:-nafura-infra-${ENV}}"
VAULT_ADDR="${VAULT_ADDR:-http://vault.${INFRA_NAMESPACE}.svc:8200}"

if ! command -v vault >/dev/null 2>&1; then
  echo "vault CLI not found — run inside a pod or install hashicorp/vault locally with port-forward"
  exit 1
fi

if [ -z "${VAULT_TOKEN:-}" ]; then
  if command -v kubectl >/dev/null 2>&1; then
    VAULT_TOKEN="$(kubectl -n "$INFRA_NAMESPACE" get secret vault-bootstrap -o jsonpath='{.data.root_token}' | base64 -d)"
  fi
fi
[ -n "${VAULT_TOKEN:-}" ] || { echo "VAULT_TOKEN required"; exit 1; }

export VAULT_ADDR VAULT_TOKEN

kv_get_field() {
  local path="$1" field="$2"
  vault kv get -field="$field" "$path" 2>/dev/null || true
}

kv_copy_if_old() {
  local old_path="$1" new_path="$2"
  shift 2
  if ! vault kv get "$old_path" >/dev/null 2>&1; then
    echo "SKIP (no old): $old_path"
    return 0
  fi
  echo "Migrating $old_path -> $new_path"
  vault kv put "$new_path" "$@"
}

echo "=== Vault path migration env=${ENV} addr=${VAULT_ADDR} ==="

# --- platform/data/postgres ---
if vault kv get "secret/nafura/${ENV}/infra/postgres" >/dev/null 2>&1; then
  u="$(kv_get_field "secret/nafura/${ENV}/infra/postgres" username)"
  p="$(kv_get_field "secret/nafura/${ENV}/infra/postgres" password)"
  h="$(kv_get_field "secret/nafura/${ENV}/infra/postgres" host)"
  pt="$(kv_get_field "secret/nafura/${ENV}/infra/postgres" port)"
  dk="$(kv_get_field "secret/nafura/${ENV}/infra/postgres" database_keycloak)"
  vault kv put "secret/nafura/${ENV}/platform/data/postgres" \
    username="${u:-nafura}" password="${p:-nafura}" host="${h:-postgres}" \
    port="${pt:-5432}" database_keycloak="${dk:-keycloak}"
fi

# --- platform/iam/keycloak ---
if vault kv get "secret/nafura/${ENV}/infra/keycloak" >/dev/null 2>&1; then
  vault kv put "secret/nafura/${ENV}/platform/iam/keycloak" \
    admin_username="$(kv_get_field "secret/nafura/${ENV}/infra/keycloak" admin_username)" \
    admin_password="$(kv_get_field "secret/nafura/${ENV}/infra/keycloak" admin_password)" \
    db_username="$(kv_get_field "secret/nafura/${ENV}/infra/keycloak" db_username)" \
    db_password="$(kv_get_field "secret/nafura/${ENV}/infra/keycloak" db_password)" \
    db_database="$(kv_get_field "secret/nafura/${ENV}/infra/keycloak" db_database)"
fi

# --- platform/storage/minio ---
if vault kv get "secret/nafura/${ENV}/infra/minio" >/dev/null 2>&1; then
  vault kv put "secret/nafura/${ENV}/platform/storage/minio" \
    root_user="$(kv_get_field "secret/nafura/${ENV}/infra/minio" root_user)" \
    root_password="$(kv_get_field "secret/nafura/${ENV}/infra/minio" root_password)" \
    access_key="$(kv_get_field "secret/nafura/${ENV}/infra/minio" access_key)" \
    secret_key="$(kv_get_field "secret/nafura/${ENV}/infra/minio" secret_key)"
fi

# --- integrations (from infra/llm) ---
if vault kv get "secret/nafura/${ENV}/infra/llm" >/dev/null 2>&1; then
  brevo="$(kv_get_field "secret/nafura/${ENV}/infra/llm" brevo_api_key)"
  gemini="$(kv_get_field "secret/nafura/${ENV}/infra/llm" gemini_api_key)"
  vault kv put "secret/nafura/${ENV}/platform/integrations/email/brevo" api_key="${brevo}"
  vault kv put "secret/nafura/${ENV}/platform/integrations/ai/gemini" api_key="${gemini}"
fi

# --- platform/security/invitation ---
if vault kv get "secret/nafura/${ENV}/infra/app" >/dev/null 2>&1; then
  vault kv put "secret/nafura/${ENV}/platform/security/invitation" \
    token_secret="$(kv_get_field "secret/nafura/${ENV}/infra/app" invitation_token_secret)"
fi

# --- apps/sektor-btp ---
if vault kv get "secret/nafura/${ENV}/apps/sektor-btp/db" >/dev/null 2>&1; then
  vault kv put "secret/nafura/${ENV}/apps/sektor-btp/database" \
    name="$(kv_get_field "secret/nafura/${ENV}/apps/sektor-btp/db" name)" \
    schema="$(kv_get_field "secret/nafura/${ENV}/apps/sektor-btp/db" schema)" \
    user="$(kv_get_field "secret/nafura/${ENV}/apps/sektor-btp/db" user)" \
    pass="$(kv_get_field "secret/nafura/${ENV}/apps/sektor-btp/db" pass)" \
    ai_user="$(kv_get_field "secret/nafura/${ENV}/apps/sektor-btp/db" ai_user)" \
    ai_user_password="$(kv_get_field "secret/nafura/${ENV}/apps/sektor-btp/db" ai_user_password)"
fi

if vault kv get "secret/nafura/${ENV}/apps/sektor-btp/minio" >/dev/null 2>&1; then
  vault kv put "secret/nafura/${ENV}/apps/sektor-btp/object-storage" \
    endpoint="$(kv_get_field "secret/nafura/${ENV}/apps/sektor-btp/minio" endpoint)" \
    bucket="$(kv_get_field "secret/nafura/${ENV}/apps/sektor-btp/minio" bucket)" \
    user="$(kv_get_field "secret/nafura/${ENV}/apps/sektor-btp/minio" user)" \
    password="$(kv_get_field "secret/nafura/${ENV}/apps/sektor-btp/minio" password)"
fi

# --- keycloak clients (legacy flat map -> per-app) ---
if vault kv get "secret/nafura/${ENV}/infra/keycloak-clients" >/dev/null 2>&1; then
  for app in sektor-btp venue-catalog; do
    secret_val="$(kv_get_field "secret/nafura/${ENV}/infra/keycloak-clients" "${app}_backend_secret")"
    if [ -n "$secret_val" ]; then
      vault kv put "secret/nafura/${ENV}/platform/iam/clients/${app}" client_secret="$secret_val"
    fi
  done
fi

# --- policies ---
echo "Updating Vault policies..."
vault policy write postgres - <<POL
path "secret/data/nafura/${ENV}/platform/data/postgres" { capabilities = ["read"] }
POL

vault policy write keycloak - <<POL
path "secret/data/nafura/${ENV}/platform/iam/keycloak" { capabilities = ["read"] }
path "secret/data/nafura/${ENV}/platform/data/postgres" { capabilities = ["read"] }
POL

vault policy write minio - <<POL
path "secret/data/nafura/${ENV}/platform/storage/minio" { capabilities = ["read"] }
POL

SEKTOR_NS="sektor-${ENV}"
vault policy write sektor-btp-backend - <<POL
path "secret/data/nafura/${ENV}/apps/sektor-btp/*" { capabilities = ["read"] }
path "secret/data/nafura/${ENV}/platform/integrations/email/brevo" { capabilities = ["read"] }
path "secret/data/nafura/${ENV}/platform/integrations/ai/gemini" { capabilities = ["read"] }
path "secret/data/nafura/${ENV}/platform/iam/keycloak" { capabilities = ["read"] }
path "secret/data/nafura/${ENV}/platform/security/invitation" { capabilities = ["read"] }
POL

vault write auth/kubernetes/role/postgres \
  bound_service_account_names=postgres \
  bound_service_account_namespaces="${INFRA_NAMESPACE}" \
  policies=postgres ttl=1h 2>/dev/null || true

vault write auth/kubernetes/role/keycloak \
  bound_service_account_names=keycloak \
  bound_service_account_namespaces="${INFRA_NAMESPACE}" \
  policies=keycloak ttl=1h 2>/dev/null || true

vault write auth/kubernetes/role/minio \
  bound_service_account_names=minio \
  bound_service_account_namespaces="${INFRA_NAMESPACE}" \
  policies=minio ttl=1h 2>/dev/null || true

vault write auth/kubernetes/role/sektor-btp-backend \
  bound_service_account_names=sektor-btp-backend \
  bound_service_account_namespaces="${SEKTOR_NS}" \
  policies=sektor-btp-backend ttl=1h 2>/dev/null || true

echo "=== Migration complete for env=${ENV} ==="
echo "New paths under secret/nafura/${ENV}/platform/ and apps/"
echo "Old paths kept for rollback — delete manually when verified."
