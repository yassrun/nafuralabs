#!/usr/bin/env bash
# Nafura ops ? infra (once per env) vs products (repeatable deploys).
# Usage: ENV=staging|prod|demo  nlops.sh <command> [args]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV="${ENV:-staging}"
KUBECTL_BIN="${KUBECTL_BIN:-kubectl}"
KUBE_CONTEXT="${KUBE_CONTEXT:-}"
KUSTOMIZE_LOAD_RESTRICTOR="${KUSTOMIZE_LOAD_RESTRICTOR:-LoadRestrictionsNone}"
GRADLEW_SEKTOR="${GRADLEW_SEKTOR:-$ROOT/sektor/sources/backend/gradlew}"
GRADLEW_PLATFORM="${GRADLEW_PLATFORM:-$ROOT/nafura-platform/sources/backend/gradlew}"
REGISTRY_HOST="${REGISTRY_HOST:-54.36.183.106:30500}"
REGISTRY="${REGISTRY:-${REGISTRY_HOST}/nafura}"
BUILD_IMAGES="${BUILD_IMAGES:-false}"
PUSH_IMAGES="${PUSH_IMAGES:-false}"
RESET_DB="${RESET_DB:-false}"
# front = image web only ; back = backend (+ lifecycle Sektor) ; full = tout.
IMAGE_SCOPE="${IMAGE_SCOPE:-full}"
REGISTRY_USER="${REGISTRY_USER:-nafura}"
REGISTRY_PASS="${REGISTRY_PASS:-}"
SECRETS_FILE="${SECRETS_FILE:-$ROOT/nafura-platform/ops/secrets/nafura.secrets}"

if [[ -n "$KUBE_CONTEXT" ]]; then
  KUBECTL() { "$KUBECTL_BIN" --context="$KUBE_CONTEXT" "$@"; }
else
  KUBECTL() { "$KUBECTL_BIN" "$@"; }
fi

# Garde-fou ENV <-> contexte kubectl.
# KUBE_CONTEXT est optionnel : s'il est absent, kubectl retombe sur le contexte COURANT,
# qui peut etre la production. Une variable oubliee suffisait donc a executer sur prod une
# commande destinee a staging -- y compris `RESET_DB=true reset-app`, qui fait un DROP DATABASE.
# On refuse tout croisement entre un ENV et un contexte qui ne se correspondent pas.
assert_context_matches_env() {
  local resolved
  resolved="${KUBE_CONTEXT:-$("$KUBECTL_BIN" config current-context 2>/dev/null || true)}"
  [[ -z "$resolved" ]] && return 0

  local ctx_is_prod=false
  [[ "$resolved" == *prod* ]] && ctx_is_prod=true

  if [[ "$ENV" == "prod" && "$ctx_is_prod" == false ]]; then
    echo "ABORT: ENV=prod mais contexte kubectl '$resolved' n'est pas un contexte de production." >&2
    echo "       Definir KUBE_CONTEXT explicitement (ex. KUBE_CONTEXT=nafura-vps-prod)." >&2
    exit 1
  fi
  if [[ "$ENV" != "prod" && "$ctx_is_prod" == true ]]; then
    echo "ABORT: ENV=$ENV mais contexte kubectl '$resolved' pointe sur la PRODUCTION." >&2
    echo "       Definir KUBE_CONTEXT explicitement (ex. KUBE_CONTEXT=docker-desktop)," >&2
    echo "       ou basculer le contexte courant : kubectl config use-context docker-desktop" >&2
    exit 1
  fi
}
assert_context_matches_env

kustomize_build() {
  KUBECTL kustomize --load-restrictor "$KUSTOMIZE_LOAD_RESTRICTOR" "$1"
}

infra_namespace_for_env() {
  case "$1" in
    staging) echo "nafura-infra-staging" ;;
    prod) echo "nafura-infra-prod" ;;
    demo) echo "nafura-infra-demo" ;;
    *) echo "ERROR: unknown ENV '$1'" >&2; return 1 ;;
  esac
}

vitrine_namespace_for_env() {
  echo "nafura-vitrine-${1:-$ENV}"
}

app_namespace_for() {
  local app_id="${1:?app id required}"
  case "$app_id" in
    sektor-btp|erp) echo "sektor-${ENV}" ;;
    venue-catalog) echo "venue-catalog-${ENV}" ;;
    corporate|mbs-studio) vitrine_namespace_for_env "$ENV" ;;
    *) echo "${app_id}-${ENV}" ;;
  esac
}

image_tag_for_env() {
  echo "$ENV"
}

uses_remote_registry() {
  case "$ENV" in
    staging) return 1 ;;
    *) return 0 ;;
  esac
}

image_ref() {
  local name="$1"
  local tag="${2:-$(image_tag_for_env)}"
  if uses_remote_registry; then
    echo "${REGISTRY}/${name}:${tag}"
  else
    echo "${name}:${tag}"
  fi
}

# Prod push : REGISTRY_PASS, sinon le secret k8s `nafura-registry` déjà sur le cluster.
ensure_registry_pass() {
  [[ -n "$REGISTRY_PASS" ]] && return 0
  uses_remote_registry || return 0
  local ns raw
  ns="$(infra_namespace_for_env "$ENV")"
  raw="$(KUBECTL get secret nafura-registry -n "$ns" -o jsonpath='{.data.\.dockerconfigjson}' 2>/dev/null || true)"
  if [[ -z "$raw" ]]; then
    echo "ERROR: REGISTRY_PASS unset and secret nafura-registry missing in $ns" >&2
    exit 1
  fi
  REGISTRY_PASS="$(printf '%s' "$raw" | python3 -c '
import sys, json, base64
cfg = json.loads(base64.b64decode(sys.stdin.read().strip()))
for auth in (cfg.get("auths") or {}).values():
    pwd = auth.get("password") or ""
    if not pwd and auth.get("auth"):
        dec = base64.b64decode(auth["auth"]).decode()
        pwd = dec.split(":", 1)[1] if ":" in dec else ""
    if pwd:
        print(pwd)
        break
' 2>/dev/null || true)"
  if [[ -z "$REGISTRY_PASS" ]]; then
    echo "ERROR: could not decode registry password from nafura-registry (install python3, or set REGISTRY_PASS)" >&2
    exit 1
  fi
  echo "REGISTRY_PASS taken from cluster secret nafura-registry (len=${#REGISTRY_PASS})"
}

usage() {
  cat <<EOF
Usage: ENV=staging|prod|demo $0 <command> [args]

Namespaces:
  staging ? nafura-infra-staging, sektor-staging, nafura-vitrine-staging
  prod    ? nafura-infra-prod,    sektor-prod,    nafura-vitrine-prod
  demo    ? nafura-infra-demo,   sektor-demo,    nafura-vitrine-demo

Cluster / infra (once per env, or after clean-env):
  clean-env                  Delete legacy + env namespaces (destructive)
  clean-demo                 Delete demo namespaces only (legacy)
  bootstrap-env              Infra + vault-init + seed secrets + wait core services
  vault-seed                 Apply nafura-platform/ops/secrets/nafura.secrets to Vault for ENV
  infra-up                   Apply infra overlay only
  infra-wait                 Wait for postgres/redis/minio/keycloak/gotenberg
  preflight                  Check injector, namespaces, optional images

Images (local tags on staging, private registry on prod/demo):
  build-images [app-id]      Images for IMAGE_SCOPE (front|back|full, default full)
  push-images  [app-id]      Push to REGISTRY (prod/demo; REGISTRY_PASS or cluster secret)
  build-push   [app-id]      build-images + push-images

Database:
  provision-db <app-id>      CREATE DATABASE on shared Postgres
  drop-db      <app-id>      DROP app database (destructive)
  migrate      <app-id>      Collect SQL + run Liquibase job on cluster

Product deploy:
  deploy           <app-id>   Apply full K8s overlay
  deploy-backend   <app-id>   Apply overlay + restart backend only
  deploy-frontend  <app-id>   Apply overlay + restart frontend only
  reset-app        <app-id>   Scale down app; RESET_DB=true drops DB
  clean-app        <app-id>   Delete app namespace

Workflows:
  onboard-app      <app-id>   First time: provision-db ? migrate ? deploy
  release-app      <app-id>   migrate ? deploy-backend ? deploy-frontend
  release-backend  <app-id>   migrate ? deploy-backend
  release-frontend <app-id>   [build web only] + deploy-frontend

Cycle de vie (préférer Make, depuis la racine du repo) :
  make -C nafura-platform/ops mode-b            # one-shot Sektor Mode B (lance bootRun + cursor)
  make -C nafura-platform/ops mode-b-stop
  make -C nafura-platform/ops dev-up  SCOPE=front|back|full   # prep only
  make -C nafura-platform/ops stg-up  SCOPE=front|back|full   # build + pods staging
  make -C nafura-platform/ops prod-up SCOPE=front|back|full   # build + push + pods prod

  nlops.sh dev-up <app-id> <front|back|full>   Check Mode B recipe (local → staging infra)

Flags (env vars):
  KUBE_CONTEXT=<name>       kubectl context (e.g. nafura-vps-prod, docker-desktop)
  BUILD_IMAGES=true          With release-*, build images first
  PUSH_IMAGES=true           With release-*, push to REGISTRY
  IMAGE_SCOPE=front|back|full  What to build (release-frontend forces front)
  RESET_DB=true              With reset-app, drop and recreate database
  REGISTRY_PASS=…            Prod push ; if empty, read cluster secret nafura-registry

Examples ? new Docker Desktop cluster:
  ENV=staging $0 clean-env
  ENV=staging $0 bootstrap-env
  BUILD_IMAGES=true ENV=staging $0 onboard-app sektor-btp

Examples ? daily cycle:
  make -C nafura-platform/ops stg-up SCOPE=full APP=sektor-btp
  make -C nafura-platform/ops dev-up SCOPE=front APP=sektor-btp
  REGISTRY_PASS=*** make -C nafura-platform/ops prod-up SCOPE=full APP=sektor-btp

Examples ? OVH VPS prod (marketing vitrine):
  BUILD_IMAGES=true PUSH_IMAGES=true KUBE_CONTEXT=nafura-vps-prod ENV=prod REGISTRY_PASS=*** $0 build-push mbs-studio
  KUBE_CONTEXT=nafura-vps-prod ENV=prod $0 deploy mbs-studio
  BUILD_IMAGES=true PUSH_IMAGES=true KUBE_CONTEXT=nafura-vps-prod ENV=prod REGISTRY_PASS=*** $0 build-push corporate
  KUBE_CONTEXT=nafura-vps-prod ENV=prod $0 deploy corporate

Supported apps: sektor-btp (alias erp), venue-catalog, mbs-studio, corporate
EOF
}

require_env() {
  case "$ENV" in
    staging|prod|demo) ;;
    *)
      echo "ERROR: ENV must be staging, prod, or demo (got: $ENV)" >&2
      exit 1
      ;;
  esac
}

db_name_for_app() {
  case "$1" in
    sektor-btp|erp) echo "nafura_erp" ;;
    venue-catalog) echo "nafura_venue_catalog" ;;
    *) echo "nafura_${1//-/_}" ;;
  esac
}

gradle_app_id_for() {
  case "$1" in
    erp) echo "sektor-btp" ;;
    *) echo "$1" ;;
  esac
}

migration_engine_for() {
  case "$1" in
    venue-catalog) echo "flyway" ;;
    *) echo "liquibase" ;;
  esac
}

is_marketing_app() {
  case "$1" in
    corporate|mbs-studio) return 0 ;;
    *) return 1 ;;
  esac
}

is_vitrine_app() {
  is_marketing_app "$1"
}

needs_keycloak_image() {
  case "$1" in
    sektor-btp|erp|"") return 0 ;;
    *) return 1 ;;
  esac
}

marketing_app_root() {
  local app_id="${1:?app id required}"
  case "$app_id" in
    corporate) echo "$ROOT/corporate" ;;
    mbs-studio) echo "$ROOT/mbs-studio" ;;
    *) echo "$ROOT/$app_id" ;;
  esac
}

app_deploy_dir() {
  local app_id="${1:?app id required}"
  if is_marketing_app "$app_id"; then
    echo "$(marketing_app_root "$app_id")/ops/k8s/overlays/$ENV"
  elif [[ "$app_id" == "sektor-btp" || "$app_id" == "erp" ]]; then
    echo "$ROOT/sektor/ops/k8s/overlays/$ENV"
  elif [[ "$app_id" == "venue-catalog" ]]; then
    echo "$ROOT/venue-catalog/ops/k8s/overlays/$ENV"
  else
    echo "$ROOT/$app_id/ops/k8s/overlays/$ENV"
  fi
}

assert_app_deployable() {
  local app_id="${1:?app id required}"
  local dir
  dir="$(app_deploy_dir "$app_id")"
  if [[ ! -d "$dir" ]]; then
    echo "ERROR: no deploy overlay for app '$app_id' at $dir" >&2
    exit 1
  fi
}

ensure_app_namespace() {
  local app_id="${1:?app id required}"
  local app_ns gradle_app_id
  app_ns="$(app_namespace_for "$app_id")"
  gradle_app_id="$(gradle_app_id_for "$app_id")"
  if KUBECTL get namespace "$app_ns" >/dev/null 2>&1; then
    return 0
  fi
  echo "Creating namespace $app_ns ..."
  local ns_file
  ns_file="$(app_deploy_dir "$app_id")/patch-namespace.yaml"
  if [[ -f "$ns_file" ]]; then
    KUBECTL apply -f "$ns_file"
  else
    KUBECTL create namespace "$app_ns"
    KUBECTL label namespace "$app_ns" \
      "nafura.io/app=${gradle_app_id}" "nafura.io/env=${ENV}" --overwrite
  fi
}

wait_rollout() {
  local namespace="$1"
  local resource="$2"
  local timeout="${3:-120}"
  case "$timeout" in
    *s|*m|*h) ;;
    *) timeout="${timeout}s" ;;
  esac
  echo "Waiting for $namespace/$resource (timeout $timeout)..."
  KUBECTL rollout status "$resource" -n "$namespace" --timeout="$timeout" || return 1
}

infra_is_ready() {
  local infra_ns
  infra_ns="$(infra_namespace_for_env "$ENV")"
  KUBECTL get deployment postgres -n "$infra_ns" >/dev/null 2>&1 || return 1
  local ready
  ready="$(KUBECTL get deployment postgres -n "$infra_ns" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo 0)"
  [[ "${ready:-0}" -ge 1 ]]
}

configure_vault_injector() {
  local infra_ns
  infra_ns="$(infra_namespace_for_env "$ENV")"
  local vault_addr="http://vault.${infra_ns}.svc:8200"

  if ! KUBECTL get deployment vault-injector-agent-injector -n default >/dev/null 2>&1; then
    echo "WARN: vault-injector not found in default ? skip injector config" >&2
    return 0
  fi

  echo "Pointing vault-injector to ${vault_addr}..."
  KUBECTL set env deployment/vault-injector-agent-injector -n default \
    "AGENT_INJECT_VAULT_ADDR=${vault_addr}" >/dev/null

  KUBECTL patch deployment vault-injector-agent-injector -n default --type=merge -p \
    '{"spec":{"replicas":1,"strategy":{"type":"Recreate"}}}' >/dev/null 2>&1 || true
  KUBECTL patch deployment vault-injector-agent-injector -n default --type=json -p \
    '[{"op":"remove","path":"/spec/template/spec/affinity"}]' >/dev/null 2>&1 || true

  KUBECTL scale deployment vault-injector-agent-injector -n default --replicas=1
  wait_rollout default deployment/vault-injector-agent-injector 120s || {
    echo "WARN: vault-injector not ready" >&2
  }
}

restart_vault_injected_workloads() {
  local infra_ns
  infra_ns="$(infra_namespace_for_env "$ENV")"
  echo "Restarting vault-injected infra workloads in ${infra_ns}..."
  for dep in postgres minio keycloak; do
    if KUBECTL get deployment "$dep" -n "$infra_ns" >/dev/null 2>&1; then
      KUBECTL rollout restart "deployment/${dep}" -n "$infra_ns"
    fi
  done
}

infra_up() {
  require_env
  echo "Applying infra overlay: $ENV ? namespace $(infra_namespace_for_env "$ENV")"
  kustomize_build "$ROOT/nafura-platform/ops/k8s/overlays/infra/$ENV" | KUBECTL apply -f -
  apply_ingress_nginx_hsts_policy
}

# HTTP-only clusters (staging / staging-local / demo) must not emit HSTS: the ingress-nginx
# default (max-age=31536000; includeSubDomains) pins *.nafuralabs.staging to https in the
# browser and breaks the http-only Keycloak OAuth flow. Prod keeps HSTS (real TLS).
apply_ingress_nginx_hsts_policy() {
  if [[ "$ENV" == "prod" ]]; then
    return 0
  fi
  if KUBECTL get namespace ingress-nginx >/dev/null 2>&1; then
    echo "Disabling ingress-nginx HSTS (http-only env: $ENV)..."
    KUBECTL apply -f "$ROOT/nafura-platform/ops/k8s/ingress-nginx/hsts-off-configmap.yaml" || \
      echo "WARN: could not apply ingress-nginx HSTS policy" >&2
  else
    echo "WARN: ingress-nginx namespace not found ? skipping HSTS policy" >&2
  fi
}

run_vault_init() {
  local infra_ns
  infra_ns="$(infra_namespace_for_env "$ENV")"
  if [[ ! -f "$SECRETS_FILE" ]]; then
    echo "ERROR: Missing $SECRETS_FILE" >&2
    echo "  Create nafura-platform/ops/secrets/nafura.secrets — see nafura-platform/ops/secrets/README.md" >&2
    exit 1
  fi
  KUBECTL delete job vault-init -n "$infra_ns" --ignore-not-found=true
  kustomize_build "$ROOT/nafura-platform/ops/k8s/overlays/infra/$ENV" | KUBECTL apply -f -
  echo "Waiting for vault-init job..."
  KUBECTL wait --for=condition=complete "job/vault-init" -n "$infra_ns" --timeout=180s
  vault_seed_from_local
}

vault_seed_from_local() {
  echo "Seeding Vault from local secrets file..."
  ROOT="$ROOT" ENV="$ENV" SECRETS_FILE="$SECRETS_FILE" KUBECTL_BIN="$KUBECTL_BIN" KUBE_CONTEXT="$KUBE_CONTEXT" \
    bash "$ROOT/nafura-platform/ops/scripts/vault-seed-from-local.sh" "$ENV"
}

infra_wait() {
  require_env
  local infra_ns
  infra_ns="$(infra_namespace_for_env "$ENV")"
  wait_rollout "$infra_ns" deployment/postgres 300s
  wait_rollout "$infra_ns" deployment/redis 120s || true
  wait_rollout "$infra_ns" deployment/minio 300s
  # Document rendering: not required to boot an app, only to print.
  wait_rollout "$infra_ns" deployment/gotenberg 180s || {
    echo "WARN: gotenberg not ready ? PDF rendering will answer 503" >&2
  }
  wait_rollout "$infra_ns" deployment/keycloak 300s || {
    echo "WARN: keycloak not ready ? check: kubectl get pods -n $infra_ns" >&2
  }
}


ensure_registry_pull_secret() {
  local ns="$1"
  if [[ "$ENV" != "prod" && "$ENV" != "demo" ]]; then
    return 0
  fi
  ensure_registry_pass
  KUBECTL create secret docker-registry nafura-registry     --docker-server="$REGISTRY_HOST"     --docker-username="$REGISTRY_USER"     --docker-password="$REGISTRY_PASS"     -n "$ns" --dry-run=client -o yaml | KUBECTL apply -f -
  KUBECTL patch serviceaccount default -n "$ns"     -p '{"imagePullSecrets":[{"name":"nafura-registry"}]}' 2>/dev/null || true
}

bootstrap_env() {
  require_env
  local infra_ns
  infra_ns="$(infra_namespace_for_env "$ENV")"
  local infra_overlay="$ROOT/nafura-platform/ops/k8s/overlays/infra/$ENV"
  if [[ -f "$infra_overlay/patch-namespace.yaml" ]]; then
    KUBECTL apply -f "$infra_overlay/patch-namespace.yaml"
  fi
  ensure_registry_pull_secret "$infra_ns"

  configure_vault_injector

  if infra_is_ready; then
    echo "Infra already ready in $infra_ns ? skipping vault-init, ensuring manifests applied."
    infra_up
    return 0
  fi

  infra_up
  run_vault_init
  restart_vault_injected_workloads
  infra_wait

  echo ""
  echo "Bootstrap complete for ENV=$ENV (namespace $infra_ns)."
  echo "Next: ENV=$ENV $0 onboard-app sektor-btp"
}

clean_env() {
  require_env
  local infra_ns app_ns
  infra_ns="$(infra_namespace_for_env "$ENV")"
  app_ns="$(app_namespace_for sektor-btp)"

  echo "Cleaning legacy + ENV=$ENV namespaces (destructive)..."

  local legacy=(
    nafura-infra
    nafura-erp-dev
    nafura-erp-staging
    nafura-app-staging
    nafura-infra-demo
    sektor-demo
    "$infra_ns"
    "$app_ns"
    venue-catalog-staging
    venue-catalog-prod
  )

  for ns in "${legacy[@]}"; do
    if KUBECTL get namespace "$ns" >/dev/null 2>&1; then
      echo "  deleting namespace $ns ..."
      KUBECTL delete namespace "$ns" --wait=false
    fi
  done

  KUBECTL delete ingress nafura-ingress -n default --ignore-not-found=true
  KUBECTL delete deployment postgres keycloak minio vault redis -n default --ignore-not-found=true
  KUBECTL delete job minio-init-nafura erp-lifecycle -n default --ignore-not-found=true

  echo "Waiting for namespaces to terminate..."
  for ns in "${legacy[@]}"; do
    for _ in $(seq 1 60); do
      KUBECTL get namespace "$ns" >/dev/null 2>&1 || break
      sleep 2
    done
  done

  echo "Clean complete. Run: ENV=$ENV $0 bootstrap-env"
}

clean_demo() {
  echo "Deleting demo namespaces (destructive)..."
  local demo_ns=(
    nafura-infra-demo
    sektor-demo
    nafura-vitrine-demo
  )
  for ns in "${demo_ns[@]}"; do
    if KUBECTL get namespace "$ns" >/dev/null 2>&1; then
      echo "  deleting $ns ..."
      KUBECTL delete namespace "$ns" --wait=false
    fi
  done
  for ns in "${demo_ns[@]}"; do
    for _ in $(seq 1 90); do
      KUBECTL get namespace "$ns" >/dev/null 2>&1 || break
      sleep 2
    done
  done
  echo "Demo cleanup complete."
}

preflight() {
  require_env
  local infra_ns app_ns
  infra_ns="$(infra_namespace_for_env "$ENV")"
  app_ns="$(app_namespace_for sektor-btp)"

  echo "=== Preflight ENV=$ENV ==="
  if [[ -n "$KUBE_CONTEXT" ]]; then
    echo "Context: $KUBE_CONTEXT (explicit)"
  else
    echo "Context: $(KUBECTL config current-context 2>/dev/null || echo unknown)"
  fi
  echo "Infra namespace: $infra_ns"
  echo "App namespace (sektor): $app_ns"

  if KUBECTL get deployment vault-injector-agent-injector -n default >/dev/null 2>&1; then
    local inj_ready inj_replicas
    inj_replicas="$(KUBECTL get deployment vault-injector-agent-injector -n default -o jsonpath='{.spec.replicas}' 2>/dev/null || echo 0)"
    inj_ready="$(KUBECTL get deployment vault-injector-agent-injector -n default -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo 0)"
    if [[ "${inj_replicas:-0}" -lt 1 || "${inj_ready:-0}" -lt 1 ]]; then
      echo "WARN: vault-injector replicas=$inj_replicas ready=$inj_ready ? run bootstrap-env or configure manually"
    else
      echo "OK: vault-injector running"
    fi
  else
    echo "WARN: vault-injector not installed (OK if staging without vault sidecars)"
  fi

  if infra_is_ready; then
    echo "OK: infra postgres ready in $infra_ns"
  else
    echo "WARN: infra not ready ? run bootstrap-env"
  fi

  if uses_remote_registry; then
    echo "Registry: $REGISTRY (tag: $(image_tag_for_env))"
    for img in sektor-btp-backend sektor-btp-web nafura-keycloak nafura-lifecycle mbs-studio-web corporate-web; do
      if docker manifest inspect "${REGISTRY}/${img}:$(image_tag_for_env)" >/dev/null 2>&1; then
        echo "OK: ${img}:$(image_tag_for_env) in registry"
      else
        echo "MISSING: ${img}:$(image_tag_for_env) ? run build-push"
      fi
    done
  else
    echo "Images: local Docker tags (*:$(image_tag_for_env))"
    for img in sektor-btp-backend sektor-btp-web nafura-keycloak nafura-lifecycle; do
      if docker image inspect "${img}:$(image_tag_for_env)" >/dev/null 2>&1; then
        echo "OK: ${img}:$(image_tag_for_env)"
      else
        echo "MISSING: ${img}:$(image_tag_for_env) ? run build-images"
      fi
    done
  fi
  echo "=== Preflight done ==="
}

build_sektor_web_image() {
  local tag web_img
  tag="$(image_tag_for_env)"
  web_img="$(image_ref sektor-btp-web "$tag")"
  echo "Building frontend -> $web_img"
  case "$ENV" in
    staging) (cd "$ROOT/sektor/sources/web" && npm run build:staging) ;;
    *) (cd "$ROOT/sektor/sources/web" && npm run build:prod) ;;
  esac
  docker build -t "$web_img" -f "$ROOT/sektor/ops/Dockerfile.web" "$ROOT"
}

build_sektor_backend_images() {
  local tag backend_img lifecycle_img
  tag="$(image_tag_for_env)"
  backend_img="$(image_ref sektor-btp-backend "$tag")"
  lifecycle_img="$(image_ref nafura-lifecycle "$tag")"

  echo "Building backend -> $backend_img"
  (cd "$ROOT/sektor/sources/backend" && "$GRADLEW_SEKTOR" :sektor:app:bootJar --no-daemon)
  docker build -t "$backend_img" -f "$ROOT/sektor/ops/Dockerfile.jar" \
    "$ROOT/sektor/sources/backend/app/build/libs"

  echo "Building lifecycle -> $lifecycle_img"
  (cd "$ROOT/nafura-platform/ops/lifecycle" && "$GRADLEW_PLATFORM" -p "$ROOT/nafura-platform/ops/lifecycle" collectMigrations -PappId=sektor-btp --no-daemon)
  docker build -t "$lifecycle_img" -f "$ROOT/nafura-platform/ops/lifecycle/Dockerfile" "$ROOT/nafura-platform/ops/lifecycle"
}

build_sektor_images() {
  local tag keycloak_img
  tag="$(image_tag_for_env)"
  keycloak_img="$(image_ref nafura-keycloak "$tag")"
  build_sektor_backend_images
  build_sektor_web_image
  echo "Building keycloak -> $keycloak_img"
  docker build -t "$keycloak_img" -f "$ROOT/nafura-platform/ops/keycloak/Dockerfile" "$ROOT/nafura-platform/ops/keycloak"
  echo "Build complete."
}

build_venue_catalog_web_image() {
  local tag web_img
  tag="$(image_tag_for_env)"
  web_img="$(image_ref venue-catalog-web "$tag")"
  echo "Building web (Angular)…"
  case "$ENV" in
    staging) (cd "$ROOT/venue-catalog/sources/web" && npm run build:staging) ;;
    *) (cd "$ROOT/venue-catalog/sources/web" && npm run build:prod) ;;
  esac
  echo "Building web image -> $web_img"
  docker build -t "$web_img" -f "$ROOT/venue-catalog/Dockerfile.web" "$ROOT"
}

build_venue_catalog_backend_image() {
  local tag backend_img
  tag="$(image_tag_for_env)"
  backend_img="$(image_ref venue-catalog-backend "$tag")"
  echo "Building backend -> $backend_img"
  docker build -t "$backend_img" -f "$ROOT/venue-catalog/Dockerfile" "$ROOT"
}

build_venue_catalog_images() {
  build_venue_catalog_backend_image
  build_venue_catalog_web_image
  echo "Build complete (backend + web)."
}

build_vitrine_images() {
  local app_id="$1"
  local tag web_img app_root
  tag="$(image_tag_for_env)"
  web_img="$(image_ref "${app_id}-web" "$tag")"
  app_root="$(marketing_app_root "$app_id")"
  echo "Building ${app_id}-web -> $web_img"
  docker build -t "$web_img" -f "$app_root/sources/web/Dockerfile" "$app_root/sources/web" 2>/dev/null || {
    echo "ERROR: $app_id Dockerfile not found in $app_root/sources/web" >&2
    exit 1
  }
}

build_images() {
  local app_id="${1:-sektor-btp}"
  local scope="${2:-$IMAGE_SCOPE}"
  require_env
  case "$app_id" in
    sektor-btp|erp)
      case "$scope" in
        front) build_sektor_web_image ;;
        back) build_sektor_backend_images ;;
        full) build_sektor_images ;;
        *) echo "ERROR: IMAGE_SCOPE must be front|back|full (got: $scope)" >&2; exit 1 ;;
      esac
      ;;
    venue-catalog)
      case "$scope" in
        front) build_venue_catalog_web_image ;;
        back) build_venue_catalog_backend_image ;;
        full) build_venue_catalog_images ;;
        *) echo "ERROR: IMAGE_SCOPE must be front|back|full (got: $scope)" >&2; exit 1 ;;
      esac
      ;;
    mbs-studio|corporate) build_vitrine_images "$app_id" ;;
    *)
      echo "ERROR: build-images not implemented for $app_id" >&2
      exit 1
      ;;
  esac
}

push_images() {
  local app_id="${1:-sektor-btp}"
  local scope="${2:-$IMAGE_SCOPE}"
  require_env
  if ! uses_remote_registry; then
    echo "staging uses local Docker tags ? skip push (set ENV=prod for VPS registry)"
    return 0
  fi
  ensure_registry_pass
  echo "$REGISTRY_PASS" | docker login "$REGISTRY_HOST" -u "$REGISTRY_USER" --password-stdin
  local tag
  tag="$(image_tag_for_env)"
  case "$app_id" in
    sektor-btp|erp)
      case "$scope" in
        front)
          docker push "$(image_ref sektor-btp-web "$tag")"
          ;;
        back)
          docker push "$(image_ref sektor-btp-backend "$tag")"
          docker push "$(image_ref nafura-lifecycle "$tag")"
          ;;
        full)
          docker push "$(image_ref sektor-btp-backend "$tag")"
          docker push "$(image_ref sektor-btp-web "$tag")"
          docker push "$(image_ref nafura-keycloak "$tag")"
          docker push "$(image_ref nafura-lifecycle "$tag")"
          ;;
        *) echo "ERROR: IMAGE_SCOPE must be front|back|full (got: $scope)" >&2; exit 1 ;;
      esac
      ;;
    venue-catalog)
      case "$scope" in
        front) docker push "$(image_ref venue-catalog-web "$tag")" ;;
        back) docker push "$(image_ref venue-catalog-backend "$tag")" ;;
        full)
          docker push "$(image_ref venue-catalog-backend "$tag")"
          docker push "$(image_ref venue-catalog-web "$tag")"
          ;;
        *) echo "ERROR: IMAGE_SCOPE must be front|back|full (got: $scope)" >&2; exit 1 ;;
      esac
      ;;
    mbs-studio|corporate)
      docker push "$(image_ref "${app_id}-web" "$tag")"
      ;;
    *)
      echo "ERROR: push-images not implemented for $app_id" >&2
      exit 1
      ;;
  esac
  echo "Push complete."
}

build_push() {
  build_images "${1:-sektor-btp}"
  push_images "${1:-sektor-btp}"
}

provision_db() {
  local app_id="${1:?app id required}"
  local db_name infra_ns
  db_name="$(db_name_for_app "$app_id")"
  infra_ns="$(infra_namespace_for_env "$ENV")"

  echo "Creating database $db_name (if missing) on ${infra_ns}/postgres"
  if KUBECTL exec -n "$infra_ns" deploy/postgres -c postgres -- \
    psql -U nafura -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='$db_name'" | grep -q 1; then
    echo "Database $db_name already exists."
  else
    KUBECTL exec -n "$infra_ns" deploy/postgres -c postgres -- \
      psql -U nafura -d postgres -c "CREATE DATABASE $db_name;"
    echo "Created database $db_name."
  fi
}

drop_db() {
  local app_id="${1:?app id required}"
  local db_name infra_ns
  db_name="$(db_name_for_app "$app_id")"
  infra_ns="$(infra_namespace_for_env "$ENV")"
  echo "Dropping database $db_name on ${infra_ns}/postgres..."
  KUBECTL exec -n "$infra_ns" deploy/postgres -c postgres -- \
    psql -U nafura -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$db_name' AND pid <> pg_backend_pid();" \
    >/dev/null 2>&1 || true
  KUBECTL exec -n "$infra_ns" deploy/postgres -c postgres -- \
    psql -U nafura -d postgres -c "DROP DATABASE IF EXISTS $db_name;"
  echo "Dropped $db_name."
}

run_lifecycle_job() {
  local app_id="${1:?app id required}"
  local gradle_app_id engine infra_ns app_ns db_name job_name image pull_policy
  gradle_app_id="$(gradle_app_id_for "$app_id")"
  engine="$(migration_engine_for "$gradle_app_id")"
  infra_ns="$(infra_namespace_for_env "$ENV")"
  app_ns="$(app_namespace_for "$app_id")"
  db_name="$(db_name_for_app "$gradle_app_id")"
  job_name="${gradle_app_id}-lifecycle"
  image="$(image_ref nafura-lifecycle)"
  pull_policy="IfNotPresent"
  if uses_remote_registry; then
    pull_policy="Always"
  fi

  if [[ "$engine" == "flyway" || "$engine" == "liquibase-startup" ]]; then
    echo "Migrations for $gradle_app_id run on backend startup ($engine) — skip lifecycle Job."
    return 0
  fi

  echo "Collecting Liquibase migrations for $gradle_app_id..."
  (cd "$ROOT/nafura-platform/ops/lifecycle" && "$GRADLEW_PLATFORM" -p "$ROOT/nafura-platform/ops/lifecycle" collectMigrations -PappId="$gradle_app_id" --no-daemon)

  if ! docker image inspect "$image" >/dev/null 2>&1; then
    echo "Lifecycle image missing ? building $image"
    docker build -t "$image" -f "$ROOT/nafura-platform/ops/lifecycle/Dockerfile" "$ROOT/nafura-platform/ops/lifecycle"
  fi

  if uses_remote_registry && [[ "$PUSH_IMAGES" == "true" ]]; then
    docker push "$image"
  fi

  ensure_app_namespace "$app_id"

  KUBECTL delete job "$job_name" -n "$app_ns" --ignore-not-found=true

  echo "Running Liquibase job $job_name in $app_ns..."
  cat <<EOF | KUBECTL apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: ${job_name}
  namespace: ${app_ns}
spec:
  ttlSecondsAfterFinished: 600
  backoffLimit: 2
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: liquibase
          image: ${image}
          imagePullPolicy: ${pull_policy}
          args:
            - --url=jdbc:postgresql://postgres.${infra_ns}.svc:5432/${db_name}
            - --username=nafura
            - --password=nafura
            - --changeLogFile=changelog/db.changelog-master.yaml
            - update
EOF

  KUBECTL wait --for=condition=complete "job/${job_name}" -n "$app_ns" --timeout=600s
  echo "Liquibase job complete."
}

migrate_app() {
  run_lifecycle_job "${1:?app id required}"
}

deploy_app() {
  local app_id="${1:?app id required}"
  require_env
  assert_app_deployable "$app_id"
  local app_ns
  app_ns="$(app_namespace_for "$app_id")"
  echo "Deploying $app_id ? namespace $app_ns (ENV=$ENV)"
  kustomize_build "$(app_deploy_dir "$app_id")" | KUBECTL apply -f -
  ensure_registry_pull_secret "$app_ns"
  echo "Deploy applied for $app_id in $app_ns."
}

deploy_backend() {
  local app_id="${1:?app id required}"
  deploy_app "$app_id"
  local app_ns dep
  app_ns="$(app_namespace_for "$app_id")"
  case "$app_id" in
    sektor-btp|erp) dep="sektor-btp-backend" ;;
    *) dep="${app_id}-backend" ;;
  esac
  if KUBECTL get deployment "$dep" -n "$app_ns" >/dev/null 2>&1; then
    KUBECTL rollout restart "deployment/${dep}" -n "$app_ns"
    wait_rollout "$app_ns" "deployment/${dep}" 300s || true
  fi
}

deploy_frontend() {
  local app_id="${1:?app id required}"
  deploy_app "$app_id"
  local app_ns dep
  app_ns="$(app_namespace_for "$app_id")"
  case "$app_id" in
    sektor-btp|erp) dep="sektor-btp-web" ;;
    mbs-studio) dep="mbs-studio-web" ;;
    corporate) dep="corporate-web" ;;
    *) dep="${app_id}-web" ;;
  esac
  if KUBECTL get deployment "$dep" -n "$app_ns" >/dev/null 2>&1; then
    KUBECTL rollout restart "deployment/${dep}" -n "$app_ns"
    wait_rollout "$app_ns" "deployment/${dep}" 120s || true
  fi
}

clean_app() {
  local app_id="${1:?app id required}"
  local app_ns
  app_ns="$(app_namespace_for "$app_id")"
  echo "Deleting app namespace $app_ns ..."
  KUBECTL delete namespace "$app_ns" --ignore-not-found=true --wait=false
  for _ in $(seq 1 30); do
    KUBECTL get namespace "$app_ns" >/dev/null 2>&1 || break
    sleep 2
  done
  echo "App namespace removed."
}

reset_app() {
  local app_id="${1:?app id required}"
  local app_ns
  app_ns="$(app_namespace_for "$app_id")"
  echo "Resetting $app_id in $app_ns ..."

  if KUBECTL get namespace "$app_ns" >/dev/null 2>&1; then
    KUBECTL scale deployment --all -n "$app_ns" --replicas=0 2>/dev/null || true
    KUBECTL delete job --all -n "$app_ns" --ignore-not-found=true
  fi

  if [[ "$RESET_DB" == "true" ]]; then
    drop_db "$app_id"
    provision_db "$app_id"
  fi

  echo "Reset complete. Run: ENV=$ENV $0 release-app $app_id"
}

onboard_app() {
  local app_id="${1:?app id required}"
  if is_vitrine_app "$app_id"; then
    echo "Onboarding vitrine $app_id (deploy only)"
    deploy_app "$app_id"
    return 0
  fi
  if [[ "$BUILD_IMAGES" == "true" ]]; then
    build_images "$app_id"
    [[ "$PUSH_IMAGES" == "true" ]] && push_images "$app_id"
  fi
  preflight || true
  echo "Onboarding $app_id (provision-db ? migrate ? deploy)"
  provision_db "$app_id"
  migrate_app "$app_id"
  deploy_app "$app_id"
  echo "Onboard complete for $app_id."
}

release_backend() {
  local app_id="${1:?app id required}"
  IMAGE_SCOPE=back
  if [[ "$BUILD_IMAGES" == "true" ]]; then
    build_images "$app_id" back
    [[ "$PUSH_IMAGES" == "true" ]] && push_images "$app_id" back
  fi
  migrate_app "$app_id"
  deploy_backend "$app_id"
  echo "Backend release complete."
}

release_frontend() {
  local app_id="${1:?app id required}"
  IMAGE_SCOPE=front
  if [[ "$BUILD_IMAGES" == "true" ]]; then
    build_images "$app_id" front
    [[ "$PUSH_IMAGES" == "true" ]] && push_images "$app_id" front
  fi
  deploy_frontend "$app_id"
  echo "Frontend release complete."
}

release_app() {
  local app_id="${1:?app id required}"
  if is_vitrine_app "$app_id"; then
    release_frontend "$app_id"
    return 0
  fi
  if [[ "$BUILD_IMAGES" == "true" ]]; then
    IMAGE_SCOPE=full
    build_images "$app_id" full
    [[ "$PUSH_IMAGES" == "true" ]] && push_images "$app_id" full
  fi
  echo "Release $app_id: migrate ? backend ? frontend"
  provision_db "$app_id"
  migrate_app "$app_id"
  deploy_backend "$app_id"
  deploy_frontend "$app_id"
  echo "Release complete for $app_id."
}

# Mode B — process locaux pointant sur l'infra staging (pas de rebuild image).
dev_up() {
  local app_id="${1:-sektor-btp}"
  local scope="${2:-full}"
  case "$scope" in
    front|back|full) ;;
    *)
      echo "ERROR: scope must be front|back|full (got: $scope)" >&2
      exit 1
      ;;
  esac

  require_env
  if [[ "$ENV" != "staging" ]]; then
    echo "ERROR: dev-up only supports ENV=staging (got: $ENV)" >&2
    exit 1
  fi

  bash "$ROOT/nafura-platform/ops/dev-staging-local.sh" "$app_id" "$scope"
}

case "${1:-}" in
  bootstrap-env) bootstrap_env ;;
  vault-seed) require_env; vault_seed_from_local ;;
  clean-env) clean_env ;;
  clean-demo) clean_demo ;;
  infra-up) infra_up ;;
  infra-wait) infra_wait ;;
  preflight) preflight ;;
  build-images) build_images "${2:-sektor-btp}" ;;
  push-images) push_images "${2:-sektor-btp}" ;;
  build-push) build_push "${2:-sektor-btp}" ;;
  provision-db) provision_db "${2:?app id required}" ;;
  drop-db) drop_db "${2:?app id required}" ;;
  migrate) migrate_app "${2:?app id required}" ;;
  deploy) deploy_app "${2:?app id required}" ;;
  deploy-backend) deploy_backend "${2:?app id required}" ;;
  deploy-frontend) deploy_frontend "${2:?app id required}" ;;
  reset-app) reset_app "${2:?app id required}" ;;
  clean-app) clean_app "${2:?app id required}" ;;
  onboard-app) onboard_app "${2:?app id required}" ;;
  release-app) release_app "${2:?app id required}" ;;
  release-backend) release_backend "${2:?app id required}" ;;
  release-frontend) release_frontend "${2:?app id required}" ;;
  dev-up)
    ENV="${ENV:-staging}"
    require_env
    if [[ "$ENV" != "staging" ]]; then
      echo "ERROR: dev-up only supports ENV=staging (got: $ENV)" >&2
      exit 1
    fi
    dev_up "${2:-sektor-btp}" "${3:-full}"
    ;;
  -h|--help|help) usage ;;
  *)
    usage >&2
    exit 1
    ;;
esac
