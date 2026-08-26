#!/usr/bin/env bash
# Mode B helpers — process locaux branchés sur infra staging (Docker Desktop).
# Usage:
#   bash nafura-platform/ops/dev-staging-local.sh start [app-id] [front|back|full]
#   bash nafura-platform/ops/dev-staging-local.sh [app-id] [front|back|full]   # prep + recette, ne lance pas
#   bash nafura-platform/ops/dev-staging-local.sh stop
# One-shot agents : make -C nafura-platform/ops mode-b
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CTX="${KUBE_CONTEXT:-docker-desktop}"
INFRA_NS="nafura-infra-staging"
PF_DIR="${TMPDIR:-/tmp}/nafura-dev-up"
PF_PID_FILE="${PF_DIR}/port-forward.pids"
APP_PID_FILE="${PF_DIR}/mode-b.pids"
ENV_FILE="${ROOT}/nafura-platform/ops/secrets/dev-staging-local.env"
SECRETS_FILE="${SECRETS_FILE:-$ROOT/nafura-platform/ops/secrets/nafura.secrets}"
BACK_URL="${NAFURA_QA_API_BASE:-http://localhost:8082}"
FRONT_URL="${NAFURA_QA_FRONT_BASE:-http://127.0.0.1:4200}"
BACK_HEALTH="${BACK_URL%/}/actuator/health"
BACK_LOG="${PF_DIR}/bootRun.log"
FRONT_LOG="${PF_DIR}/ng-cursor.log"

mkdir -p "$PF_DIR" "$(dirname "$ENV_FILE")"

die() { echo "ERROR: $*" >&2; exit 1; }

stop_port_forwards() {
  if [[ -f "$PF_PID_FILE" ]]; then
    while read -r pid; do
      [[ -n "${pid:-}" ]] && kill "$pid" 2>/dev/null || true
    done <"$PF_PID_FILE"
    rm -f "$PF_PID_FILE"
    echo "Stopped previous port-forwards."
  fi
}

kill_port() {
  local port="$1"
  local pid
  if command -v lsof >/dev/null 2>&1; then
    while read -r pid; do
      [[ -n "${pid:-}" ]] && kill "$pid" 2>/dev/null || true
    done < <(lsof -t -iTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
  fi
  if command -v netstat >/dev/null 2>&1; then
    while read -r pid; do
      [[ -n "${pid:-}" && "$pid" != "0" ]] || continue
      taskkill //F //PID "$pid" >/dev/null 2>&1 || kill -9 "$pid" 2>/dev/null || true
    done < <(netstat -ano 2>/dev/null | awk -v p=":${port}" '
      $0 ~ p && /LISTENING/ { print $NF }
    ' | sort -u)
  fi
}

stop_app_processes() {
  if [[ -f "$APP_PID_FILE" ]]; then
    while read -r pid; do
      [[ -n "${pid:-}" ]] && kill "$pid" 2>/dev/null || true
    done <"$APP_PID_FILE"
    rm -f "$APP_PID_FILE"
  fi
  kill_port 8082
  kill_port 4200
  echo "Stopped Mode B app processes (8082 / 4200)."
}

http_up() {
  local url="$1"
  curl -sf -o /dev/null --connect-timeout 2 "$url" 2>/dev/null
}

# Mode B is ready only when cursor-session mints (provisioner finished), not mere Tomcat up.
session_up() {
  curl -sf -o /dev/null --connect-timeout 2 -X POST \
    "${BACK_URL%/}/api/public/dev/cursor-session" 2>/dev/null
}

wait_http() {
  local url="$1"
  local timeout="${2:-180}"
  local label="${3:-$url}"
  local pid="${4:-}"
  local check="${5:-http}"
  local elapsed=0
  while (( elapsed < timeout )); do
    if [[ -n "$pid" ]] && ! kill -0 "$pid" 2>/dev/null; then
      echo "ERROR: process $pid exited while waiting for $label" >&2
      return 1
    fi
    if [[ "$check" == "session" ]]; then
      if session_up; then
        echo "Ready: cursor-session"
        return 0
      fi
    elif http_up "$url"; then
      echo "Ready: $label"
      return 0
    fi
    sleep 3
    elapsed=$((elapsed + 3))
  done
  echo "ERROR: timeout waiting for $label (${timeout}s)" >&2
  return 1
}

wait_tcp() {
  local host="$1"
  local port="$2"
  local timeout="${3:-30}"
  local elapsed=0
  while (( elapsed < timeout )); do
    if (echo >/dev/tcp/"$host"/"$port") >/dev/null 2>&1; then
      echo "Ready: $host:$port"
      return 0
    fi
    sleep 1
    elapsed=$((elapsed + 1))
  done
  echo "ERROR: timeout waiting for $host:$port (${timeout}s)" >&2
  return 1
}

gradlew_sektor() {
  if [[ -f "$ROOT/sektor/sources/backend/gradlew" ]]; then
    echo "$ROOT/sektor/sources/backend/gradlew"
  elif [[ -f "$ROOT/sektor/sources/backend/gradlew.bat" ]]; then
    echo "$ROOT/sektor/sources/backend/gradlew.bat"
  else
    die "gradlew missing under sektor/sources/backend"
  fi
}

start_sektor_app() {
  local gw
  gw="$(gradlew_sektor)"
  : >"$APP_PID_FILE"

  if [[ "$SCOPE" == "back" || "$SCOPE" == "full" ]]; then
    if session_up; then
      echo "Backend already up: cursor-session"
    else
      echo "Starting backend → $BACK_LOG"
      (
        trap '' HUP
        set -a
        # shellcheck disable=SC1090
        source "$ENV_FILE"
        set +a
        cd "$ROOT/sektor/sources/backend"
        exec "$gw" :sektor:app:bootRun
      ) >>"$BACK_LOG" 2>&1 &
      local back_pid=$!
      disown "$back_pid" 2>/dev/null || true
      echo "$back_pid" >>"$APP_PID_FILE"
      wait_http "$BACK_HEALTH" 240 "cursor-session" "$back_pid" session || {
        echo "See $BACK_LOG" >&2
        exit 1
      }
    fi
  fi

  if [[ "$SCOPE" == "front" || "$SCOPE" == "full" ]]; then
    if http_up "$FRONT_URL"; then
      echo "Frontend already up: $FRONT_URL"
    else
      echo "Starting frontend → $FRONT_LOG"
      (
        trap '' HUP
        cd "$ROOT/sektor/sources/web"
        exec npm run start:erp:cursor
      ) >>"$FRONT_LOG" 2>&1 &
      local front_pid=$!
      disown "$front_pid" 2>/dev/null || true
      echo "$front_pid" >>"$APP_PID_FILE"
      wait_http "$FRONT_URL" 180 "$FRONT_URL" "$front_pid" || {
        echo "See $FRONT_LOG" >&2
        exit 1
      }
    fi
  fi

  cat <<EOF

=== Mode B running ===
  App:  $FRONT_URL   (auto-login qa@nafuralabs.local)
  API:  $BACK_URL
  Token: eval "\$(bash nafura-platform/ops/qa-token.sh)"
  Stop:  make -C nafura-platform/ops mode-b-stop

EOF
}

if [[ "${1:-}" == "stop" ]]; then
  stop_app_processes
  stop_port_forwards
  exit 0
fi

RUN_APP=0
if [[ "${1:-}" == "start" ]]; then
  RUN_APP=1
  shift
fi

APP_ID="${1:-sektor-btp}"
SCOPE="${2:-full}"

case "$SCOPE" in
  front|back|full) ;;
  *) die "scope must be front|back|full (got: $SCOPE)" ;;
esac

[[ "${ENV:-staging}" == "staging" ]] || die "dev-up only supports ENV=staging"
kubectl --context="$CTX" get ns "$INFRA_NS" >/dev/null 2>&1 \
  || die "namespace $INFRA_NS missing — run bootstrap-env first"

read_secret_field() {
  local section="$1"
  local key="$2"
  local secrets_file="$SECRETS_FILE"
  if [[ ! -f "$secrets_file" && -f "$ROOT/secrets/nafura.secrets" ]]; then
    secrets_file="$ROOT/secrets/nafura.secrets"
  fi
  [[ -f "$secrets_file" ]] || return 0
  awk -v sec="[$section]" -v key="$key" '
    $0 == sec { in_sec=1; next }
    /^\[/ { in_sec=0 }
    in_sec && index($0, key "=") == 1 { sub(/^[^=]+=/, ""); print; exit }
  ' "$secrets_file"
}

write_env_file_sektor() {
  local gemini_key=""
  gemini_key="$(read_secret_field "staging/platform/integrations/ai/gemini" "api_key")"
  if [[ -z "$gemini_key" && -n "${AI_GEMINI_API_KEY:-}" ]]; then
    gemini_key="$AI_GEMINI_API_KEY"
  fi
  local deepseek_key=""
  deepseek_key="$(read_secret_field "staging/platform/integrations/ai/deepseek" "api_key")"
  if [[ -z "$deepseek_key" && -n "${AI_DEEPSEEK_API_KEY:-}" ]]; then
    deepseek_key="$AI_DEEPSEEK_API_KEY"
  fi

  cat >"$ENV_FILE" <<EOF
# Generated by toolchain/ops/dev-staging-local.sh — do not commit
# Usage: set -a; source secrets/dev-staging-local.env; set +a

POSTGRES_HOST=localhost
POSTGRES_DB=nafura_erp
POSTGRES_SCHEMA=public
POSTGRES_USER=nafura
POSTGRES_PASSWORD=nafura

KEYCLOAK_ISSUER_URI=http://iam.nafuralabs.staging/realms/iam-portal
KEYCLOAK_JWK_SET_URI=http://iam.nafuralabs.staging/realms/iam-portal/protocol/openid-connect/certs
KEYCLOAK_ADMIN_URL=http://iam.nafuralabs.staging
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=admin
KEYCLOAK_REALM=iam-portal
KEYCLOAK_CLIENT_ID=erp-web

# S3 API (port 9000 via ingress s3.*) — pas minio.* qui sert la console (9001)
DOCUMENTS_MINIO_ENDPOINT=http://s3.nafuralabs.staging
DOCUMENTS_MINIO_BUCKET=documents
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin

APP_FRONTEND_BASE_URL=http://localhost:4200
NAFURA_ONBOARDING_SKIP_EMAIL_VERIFICATION=true
# QA local auto-login (Mode B only — never set on K8s staging/prod)
# Owner qa@nafuralabs.local / tenant qa-local provisioned on boot when enabled
NAFURA_DEV_CURSOR_AUTH_ENABLED=true
NAFURA_DEV_CURSOR_AUTH_EMAIL=qa@nafuralabs.local
AI_GEMINI_API_KEY=$gemini_key
AI_DEEPSEEK_API_KEY=$deepseek_key
AI_PROVIDER=deepseek
AI_DEEPSEEK_MODEL=deepseek-v4-flash
EOF
  if [[ -n "$gemini_key" ]]; then
    echo "Wrote $ENV_FILE (Gemini key present)"
  else
    echo "Wrote $ENV_FILE (WARNING: no AI_GEMINI_API_KEY — descriptif CPS uses section fallback)"
  fi
  if [[ -n "$deepseek_key" ]]; then
    echo "Wrote $ENV_FILE (DeepSeek key present)"
  else
    echo "Wrote $ENV_FILE (WARNING: no AI_DEEPSEEK_API_KEY)"
  fi
}

write_env_file_blanner() {
  local places_key=""
  places_key="$(read_secret_field "staging/apps/blanner/integrations" "google_places_api_key")"
  if [[ -z "$places_key" && -n "${GOOGLE_PLACES_API_KEY:-}" ]]; then
    places_key="$GOOGLE_PLACES_API_KEY"
  fi

  cat >"$ENV_FILE" <<EOF
# Generated by toolchain/ops/dev-staging-local.sh — do not commit
# Usage: set -a; source secrets/dev-staging-local.env; set +a

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=nafura_blanner
POSTGRES_SCHEMA=public
POSTGRES_USER=nafura
POSTGRES_PASSWORD=nafura
SERVER_PORT=8080
GOOGLE_PLACES_API_KEY=$places_key
CORS_ALLOWED_ORIGIN_PATTERNS=http://localhost:*,http://127.0.0.1:*,http://10.0.2.2:*,https://*.nafuralabs.staging
EOF
  if [[ -n "$places_key" ]]; then
    echo "Wrote $ENV_FILE (Google Places key present)"
  else
    echo "Wrote $ENV_FILE (WARNING: no GOOGLE_PLACES_API_KEY — Places autocomplete will fail)"
  fi
}

write_env_file_venue_catalog() {
  local db_name db_schema db_user db_pass
  local minio_bucket minio_user minio_password places_key
  db_name="$(read_secret_field "staging/apps/venue-catalog/database" "name")"
  db_schema="$(read_secret_field "staging/apps/venue-catalog/database" "schema")"
  db_user="$(read_secret_field "staging/apps/venue-catalog/database" "user")"
  db_pass="$(read_secret_field "staging/apps/venue-catalog/database" "pass")"
  minio_bucket="$(read_secret_field "staging/apps/venue-catalog/object-storage" "bucket")"
  minio_user="$(read_secret_field "staging/apps/venue-catalog/object-storage" "user")"
  minio_password="$(read_secret_field "staging/apps/venue-catalog/object-storage" "password")"
  places_key="$(read_secret_field "staging/apps/venue-catalog/integrations" "google_places_api_key")"

  db_name="${db_name:-nafura_venue_catalog}"
  db_schema="${db_schema:-public}"
  db_user="${db_user:-nafura}"
  db_pass="${db_pass:-nafura}"
  minio_bucket="${minio_bucket:-venue-catalog-media}"
  minio_user="${minio_user:-minioadmin}"
  minio_password="${minio_password:-minioadmin}"
  if [[ -z "$places_key" && -n "${GOOGLE_PLACES_API_KEY:-}" ]]; then
    places_key="$GOOGLE_PLACES_API_KEY"
  fi

  cat >"$ENV_FILE" <<EOF
# Generated by toolchain/ops/dev-staging-local.sh — do not commit
# Usage: set -a; source secrets/dev-staging-local.env; set +a

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=$db_name
POSTGRES_SCHEMA=$db_schema
POSTGRES_USER=$db_user
POSTGRES_PASSWORD=$db_pass

REDIS_HOST=localhost
REDIS_PORT=6380

# S3 API through the staging ingress; cluster-local MinIO DNS is not resolvable here.
DOCUMENTS_MINIO_ENDPOINT=http://s3.nafuralabs.staging
DOCUMENTS_MINIO_BUCKET=$minio_bucket
MINIO_ROOT_USER=$minio_user
MINIO_ROOT_PASSWORD=$minio_password

SERVER_PORT=8085
KEYCLOAK_ISSUER_URI=http://iam.nafuralabs.staging/realms/iam-portal
KEYCLOAK_JWK_SET_URI=http://iam.nafuralabs.staging/realms/iam-portal/protocol/openid-connect/certs
GOOGLE_PLACES_API_KEY=$places_key
EOF
  if [[ -n "$places_key" ]]; then
    echo "Wrote $ENV_FILE (Venue Catalog secrets and Places key present)"
  else
    echo "Wrote $ENV_FILE (WARNING: no GOOGLE_PLACES_API_KEY — Places import will fail)"
  fi
}

start_port_forwards() {
  local postgres_pid redis_pid=""
  if netstat -ano 2>/dev/null | grep -qE ':5432[ ].*LISTENING'; then
    echo "Port-forward already listening on 5432 — leaving it."
  else
    stop_port_forwards
    : >"$PF_PID_FILE"

    nohup kubectl --context="$CTX" -n "$INFRA_NS" port-forward svc/postgres 5432:5432 \
      >/tmp/nafura-pf-postgres.log 2>&1 &
    postgres_pid=$!
    disown "$postgres_pid" 2>/dev/null || true
    echo "$postgres_pid" >>"$PF_PID_FILE"

    sleep 1
    if ! kill -0 "$postgres_pid" 2>/dev/null; then
      die "postgres port-forward failed — see /tmp/nafura-pf-postgres.log"
    fi
    echo "Port-forward: localhost:5432 → $INFRA_NS/postgres (pid $postgres_pid)"
  fi

  if [[ "$APP_ID" == "venue-catalog" ]]; then
    if netstat -ano 2>/dev/null | grep -qE ':6380[ ].*LISTENING'; then
      echo "Port-forward already listening on 6380 — leaving it."
    else
      nohup kubectl --context="$CTX" -n "$INFRA_NS" port-forward svc/redis 6380:6379 \
        >/tmp/nafura-pf-redis.log 2>&1 &
      redis_pid=$!
      disown "$redis_pid" 2>/dev/null || true
      echo "$redis_pid" >>"$PF_PID_FILE"
      sleep 1
      if ! kill -0 "$redis_pid" 2>/dev/null; then
        die "redis port-forward failed — see /tmp/nafura-pf-redis.log"
      fi
      echo "Port-forward: localhost:6380 → $INFRA_NS/redis (pid $redis_pid)"
    fi
  fi
}

print_recipe_sektor() {
  case "$SCOPE" in
    front)
      cat <<'EOF'
# Front local (Cursor QA — auto-login qa@nafuralabs.local)
cd sektor/sources/web
npm run start:erp:cursor
# → http://127.0.0.1:4200  |  API http://localhost:8082
# Keycloak staging-local (manuel) : npm run start:erp:staging-local
EOF
      ;;
    back)
      cat <<EOF
# Backend local
set -a; source "$ENV_FILE"; set +a
cd sektor/sources/backend && ./gradlew.bat :sektor:app:bootRun
# → http://localhost:8082/actuator/health
EOF
      ;;
    full)
      cat <<EOF
# Terminal 1 — backend
set -a; source "$ENV_FILE"; set +a
cd sektor/sources/backend && ./gradlew.bat :sektor:app:bootRun

# Terminal 2 — frontend (Cursor QA — auto-login qa@nafuralabs.local)
cd sektor/sources/web
npm run start:erp:cursor

# URLs
#   App:  http://127.0.0.1:4200
#   API:  http://localhost:8082
# Keycloak staging-local (manuel) : npm run start:erp:staging-local
EOF
      ;;
  esac
}

print_recipe_blanner() {
  case "$SCOPE" in
    front)
      cat <<'EOF'
# Flutter local → back local (démarrer le back en parallèle si besoin)
cd "$ROOT/nafuralabs-archives/blanner/blanner_flutter"  # hors dépôt ; voir NAFURALABS.md
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8080/api
# iOS / Chrome: --dart-define=API_BASE_URL=http://localhost:8080/api
EOF
      ;;
    back)
      cat <<EOF
# Backend local
set -a; source "$ENV_FILE"; set +a
./gradlew.bat :blanner:app:bootRun
# → http://localhost:8080/actuator/health
# Prérequis: make provision-db APP=blanner (ou onboard-app blanner)
EOF
      ;;
    full)
      cat <<EOF
# Terminal 1 — backend
set -a; source "$ENV_FILE"; set +a
./gradlew.bat :blanner:app:bootRun

# Terminal 2 — Flutter (Android emulator)
cd "$ROOT/nafuralabs-archives/blanner/blanner_flutter"  # hors dépôt ; voir NAFURALABS.md
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8080/api

# URLs
#   API:      http://localhost:8080
#   Health:   http://localhost:8080/actuator/health
#   Swagger:  http://localhost:8080/swagger-ui/index.html
#   Staging API (pods): http://api.blanner.nafuralabs.staging
EOF
      ;;
  esac
}

print_recipe_venue_catalog() {
  if [[ "$SCOPE" == "front" ]]; then
    cat <<'EOF'
# Frontend local (Mode B) — API local via proxy, IAM staging
cd venue-catalog/sources/web
npm start
# URL: http://127.0.0.1:4210  (proxy /api → localhost:8085)
# Auth: useDevJwt=true (staging-local) — bouton "Continuer (dev JWT)"
EOF
    return
  fi

  if [[ "$SCOPE" == "full" ]]; then
    cat <<EOF
# Backend local
set -a; source "$ENV_FILE"; set +a
cd venue-catalog && ./gradlew.bat :venue-catalog:app:bootRun

# Frontend (autre terminal)
cd venue-catalog/sources/web && npm start

# URLs
#   Web:          http://127.0.0.1:4210
#   API:          http://localhost:8085
#   Health:       http://localhost:8085/actuator/health
#   Staging API:  http://api.venue-catalog.nafuralabs.staging
# Prérequis: make provision-db APP=venue-catalog (Flyway runs at startup)
EOF
    return
  fi

  cat <<EOF
# Backend local
set -a; source "$ENV_FILE"; set +a
cd venue-catalog && ./gradlew.bat :venue-catalog:app:bootRun

# URLs
#   API:          http://localhost:8085
#   Health:       http://localhost:8085/actuator/health
#   Staging API:  http://api.venue-catalog.nafuralabs.staging
# Prérequis: make provision-db APP=venue-catalog (Flyway runs at startup)
EOF
}

case "$APP_ID" in
  sektor-btp|erp)
    write_env_file_sektor
    ;;
  blanner)
    write_env_file_blanner
    ;;
  venue-catalog)
    write_env_file_venue_catalog
    ;;
  *)
    die "dev-up Mode B not implemented for $APP_ID (supported: sektor-btp, blanner, venue-catalog)"
    ;;
esac

if [[ "$SCOPE" == "back" || "$SCOPE" == "full" ]]; then
  start_port_forwards
  wait_tcp 127.0.0.1 5432 30 || die "Postgres port-forward not accepting connections on 5432"
fi

cat <<EOF

=== dev-up $APP_ID SCOPE=$SCOPE ===
Mode B: process locaux → infra staging (pas de rebuild image).

Env file : $ENV_FILE
Stop     : make -C nafura-platform/ops mode-b-stop
# (legacy) bash nafura-platform/ops/dev-staging-local.sh stop

EOF

if [[ "$RUN_APP" == "1" ]]; then
  case "$APP_ID" in
    sektor-btp|erp)
      start_sektor_app
      ;;
    *)
      die "mode-b start only supports sektor-btp (got: $APP_ID) — use make dev-up for the recipe"
      ;;
  esac
  exit 0
fi

case "$APP_ID" in
  sektor-btp|erp) print_recipe_sektor ;;
  blanner) print_recipe_blanner ;;
  venue-catalog) print_recipe_venue_catalog ;;
esac

echo ""
echo "One-shot Sektor: make -C nafura-platform/ops mode-b"
echo "Validation pods: make -C nafura-platform/ops stg-up SCOPE=$SCOPE APP=$APP_ID"
