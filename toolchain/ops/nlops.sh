#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV="${ENV:-staging}"
KUBECTL="${KUBECTL:-kubectl}"

db_name_for_app() {
  case "$1" in
    sektor-btp|erp) echo "nafura_erp" ;;
    venue-catalog) echo "nafura_venue_catalog" ;;
    *) echo "nafura_${1//-/_}" ;;
  esac
}

infra_up() {
  echo "Applying infra overlay: $ENV"
  $KUBECTL kustomize "$ROOT/infra/k8s/overlays/infra/$ENV" | $KUBECTL apply -f -
}

provision_db() {
  local app_id="${1:?app id required}"
  local db_name
  db_name="$(db_name_for_app "$app_id")"
  echo "Creating database $db_name (if missing)"
  $KUBECTL exec -n nafura-infra deploy/postgres -- \
    psql -U nafura -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='$db_name'" | grep -q 1 \
    || $KUBECTL exec -n nafura-infra deploy/postgres -- \
    psql -U nafura -d postgres -c "CREATE DATABASE $db_name;"
}

migrate_app() {
  local app_id="${1:?app id required}"
  local gradle_app_id="sektor-btp"
  if [[ "$app_id" == "erp" ]]; then gradle_app_id="sektor-btp"; fi
  echo "Collecting migrations for $app_id (gradle -PappId=$gradle_app_id)"
  (cd "$ROOT" && ./gradlew.bat :tools:lifecycle:collectMigrations -PappId="$gradle_app_id" --no-daemon)
  echo "Apply Liquibase via CI / lifecycle image (see products/$app_id/deploy)"
}

deploy_app() {
  local app_id="${1:?app id required}"
  echo "Deploying $app_id overlay: $ENV"
  $KUBECTL kustomize "$ROOT/products/$app_id/deploy/k8s/overlays/$ENV" | $KUBECTL apply -f -
}

case "${1:-}" in
  infra-up) infra_up ;;
  provision-db) provision_db "${2:?}" ;;
  migrate) migrate_app "${2:?}" ;;
  deploy) deploy_app "${2:?}" ;;
  *)
    echo "Usage: $0 {infra-up|provision-db <app>|migrate <app>|deploy <app>}"
    echo "  ENV=staging|prod (default: staging)"
    exit 1
    ;;
esac
