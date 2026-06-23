#!/usr/bin/env bash
# Nafura ops — infra (once per env) vs products (repeatable deploys).
# Usage: ENV=staging|prod  nlops.sh <command> [args]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV="${ENV:-staging}"
KUBECTL="${KUBECTL:-kubectl}"
GRADLEW="${GRADLEW:-$ROOT/gradlew.bat}"

usage() {
  cat <<EOF
Usage: ENV=staging|prod $0 <command> [args]

Environment bootstrap (once per cluster):
  bootstrap-env              Apply shared infra + wait for core services

Product lifecycle:
  onboard-app <app-id>       First deploy: provision-db + migrate + deploy
  provision-db <app-id>      CREATE DATABASE on shared Postgres
  migrate <app-id>           Collect / apply schema migrations
  deploy <app-id>            Apply product K8s overlay (repeatable)

Low-level:
  infra-up                   Apply infra/k8s/overlays/infra/\$ENV only

Examples:
  ENV=staging $0 bootstrap-env
  ENV=staging $0 onboard-app sektor-btp
  ENV=staging $0 deploy sektor-btp
  ENV=prod    $0 deploy venue-catalog

Supported app ids: sektor-btp (alias erp), venue-catalog
EOF
}

require_env() {
  case "$ENV" in
    staging|prod) ;;
    *)
      echo "ERROR: ENV must be staging or prod (got: $ENV)" >&2
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

product_deploy_dir() {
  echo "$ROOT/products/$1/deploy/k8s/overlays/$ENV"
}

assert_product_deployable() {
  local app_id="${1:?app id required}"
  local dir
  dir="$(product_deploy_dir "$app_id")"
  if [[ ! -d "$dir" ]]; then
    echo "ERROR: no deploy overlay for app '$app_id' at $dir" >&2
    echo "Create products/$app_id/deploy/k8s/overlays/{staging,prod}/ first." >&2
    exit 1
  fi
}

wait_rollout() {
  local namespace="$1"
  local resource="$2"
  local timeout="${3:-120}s"
  echo "Waiting for $namespace/$resource (timeout $timeout)..."
  $KUBECTL rollout status "$resource" -n "$namespace" --timeout="$timeout"
}

infra_up() {
  require_env
  echo "Applying infra overlay: $ENV"
  $KUBECTL kustomize "$ROOT/infra/k8s/overlays/infra/$ENV" | $KUBECTL apply -f -
}

bootstrap_env() {
  require_env
  infra_up
  wait_rollout nafura-infra deployment/postgres 180s
  wait_rollout nafura-infra deployment/redis 120s
  wait_rollout nafura-infra deployment/minio 180s
  wait_rollout nafura-infra deployment/keycloak 300s || {
    echo "WARN: keycloak rollout not ready yet — check: kubectl get pods -n nafura-infra" >&2
  }
  echo ""
  echo "Bootstrap complete for ENV=$ENV (namespace nafura-infra)."
  echo "Next: onboard or deploy a product, e.g."
  echo "  ENV=$ENV $0 onboard-app sektor-btp"
}

provision_db() {
  local app_id="${1:?app id required}"
  local db_name
  db_name="$(db_name_for_app "$app_id")"
  echo "Creating database $db_name (if missing) on nafura-infra/postgres"
  if $KUBECTL exec -n nafura-infra deploy/postgres -- \
    psql -U nafura -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='$db_name'" | grep -q 1; then
    echo "Database $db_name already exists."
  else
    $KUBECTL exec -n nafura-infra deploy/postgres -- \
      psql -U nafura -d postgres -c "CREATE DATABASE $db_name;"
    echo "Created database $db_name."
  fi
}

migrate_app() {
  local app_id="${1:?app id required}"
  local gradle_app_id engine
  gradle_app_id="$(gradle_app_id_for "$app_id")"
  engine="$(migration_engine_for "$gradle_app_id")"

  if [[ "$engine" == "flyway" ]]; then
    echo "Migration engine: Flyway (embedded in Spring Boot app)"
    echo "  SQL: products/$gradle_app_id/backend/app/src/main/resources/db/migration/"
    echo "  Flyway runs automatically on app startup after provision-db."
    echo "  No separate Liquibase collect step for $gradle_app_id."
    return 0
  fi

  echo "Collecting Liquibase migrations for $gradle_app_id..."
  (cd "$ROOT" && "$GRADLEW" :tools:lifecycle:collectMigrations -PappId="$gradle_app_id" --no-daemon)

  local db_name
  db_name="$(db_name_for_app "$gradle_app_id")"
  cat <<EOF

Liquibase changelog generated under tools/lifecycle/build/changelog/.

To apply migrations against Postgres in cluster $ENV:
  1. Build lifecycle image:
       docker build -t nafura-lifecycle:local -f tools/lifecycle/Dockerfile tools/lifecycle
  2. Port-forward Postgres (from another terminal):
       kubectl port-forward -n nafura-infra svc/postgres 5432:5432
  3. Run Liquibase update:
       docker run --rm --network host nafura-lifecycle:local \\
         --url=jdbc:postgresql://host.docker.internal:5432/$db_name \\
         --username=nafura --password=nafura \\
         --changeLogFile=changelog/db.changelog-master.yaml update

Or rely on the lifecycle K8s job when CI/CD is wired (see tools/lifecycle/README.md).
EOF
}

deploy_app() {
  local app_id="${1:?app id required}"
  require_env
  assert_product_deployable "$app_id"
  echo "Deploying $app_id overlay: ENV=$ENV"
  $KUBECTL kustomize "$(product_deploy_dir "$app_id")" | $KUBECTL apply -f -
  echo "Deploy applied for $app_id (ENV=$ENV)."
}

onboard_app() {
  local app_id="${1:?app id required}"
  echo "Onboarding $app_id on ENV=$ENV (provision-db → migrate → deploy)"
  provision_db "$app_id"
  migrate_app "$app_id"
  deploy_app "$app_id"
  echo "Onboard complete for $app_id."
}

case "${1:-}" in
  bootstrap-env) bootstrap_env ;;
  infra-up) infra_up ;;
  provision-db) provision_db "${2:?app id required}" ;;
  migrate) migrate_app "${2:?app id required}" ;;
  deploy) deploy_app "${2:?app id required}" ;;
  onboard-app) onboard_app "${2:?app id required}" ;;
  -h|--help|help) usage ;;
  *)
    usage >&2
    exit 1
    ;;
esac
