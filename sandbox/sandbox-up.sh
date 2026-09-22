#!/usr/bin/env bash
# Sandbox — back (H2 :8082) + front (sandbox web :4300).
#
# Usage (Git Bash / Linux) :
#   ./sandbox-up.sh          # start back + front and wait for both
#   ./sandbox-up.sh stop     # stop ports 8082 and 4300
#   ./sandbox-up.sh back     # back only
#   ./sandbox-up.sh status   # port health
#
# Windows Git Bash is supported when Java 25 and Gradle are available in PATH
# or through JAVA_HOME and GRADLE_HOME.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP="$ROOT/sources/backend"
WEB="$ROOT/sources/web"
NODE22_HOME="/c/Users/karkafiy/bin/node22/node-v22.17.1-win-x64"

# Use the workspace's documented JDK when the caller has not selected one.
JDK25_HOME="/c/Users/karkafiy/Desktop/tools/jdk-25.0.4.1+1"
if [[ -d "$JDK25_HOME" ]]; then
  export PATH="$JDK25_HOME/bin:$PATH"
  hash -r 2>/dev/null || true
fi

# Agent shells may redirect GRADLE_USER_HOME to a temp cache without proxy props.
if [[ -d "${USERPROFILE:-$HOME}/.gradle" ]]; then
  export GRADLE_USER_HOME="${USERPROFILE:-$HOME}/.gradle"
elif [[ -d "$HOME/.gradle" ]]; then
  export GRADLE_USER_HOME="$HOME/.gradle"
fi

BACK_PORT=8082
FRONT_PORT=4300
HEALTH_URL="http://127.0.0.1:${BACK_PORT}/actuator/health"
FRONT_URL="http://127.0.0.1:${FRONT_PORT}"
PID_FILE="$APP/build/sandbox-backend.pid"
LOG_FILE="$APP/build/sandbox-backend.log"
FRONT_PID_FILE="$WEB/.sandbox-web.pid"
FRONT_LOG_FILE="$WEB/.sandbox-web.log"
die() { echo "ERROR: $*" >&2; exit 1; }

ERROR_LOG_FILE="$APP/build/sandbox-backend-error.log"


port_pids() {
  local port="$1"
  if command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -NoProfile -Command \
      "Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique" \
      2>/dev/null | tr -d '\r' | awk 'NF && $1 ~ /^[0-9]+$/'
  elif command -v lsof >/dev/null 2>&1; then
    lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true
  else
    return 0
  fi
}

kill_port() {
  local port="$1"
  local pids
  pids="$(port_pids "$port" || true)"
  if [[ -z "${pids//[[:space:]]/}" ]]; then
    return 0
  fi
  echo "→ stop :$port (pids: $(echo "$pids" | tr '\n' ' '))"
  # shellcheck disable=SC2086
  kill $pids 2>/dev/null || true
  sleep 1
  pids="$(port_pids "$port" || true)"
  if [[ -n "${pids//[[:space:]]/}" ]]; then
    # shellcheck disable=SC2086
    kill -9 $pids 2>/dev/null || true
  fi
}

health_ok() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsS --max-time 2 "$HEALTH_URL" >/dev/null 2>&1
  elif command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -NoProfile -Command \
      "try { (Invoke-WebRequest '$HEALTH_URL' -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200 } catch { exit 1 }" \
      >/dev/null 2>&1
  else
    return 1
  fi
}

wait_health() {
  local i
  for i in $(seq 1 40); do
    if health_ok; then
      echo "✓ back UP  $HEALTH_URL"
      return 0
    fi
    sleep 0.5
  done
  die "back pas UP après ~20s — voir $LOG_FILE"
}

front_ok() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsS --max-time 2 "$FRONT_URL" >/dev/null 2>&1
  elif command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -NoProfile -Command \
      "try { (Invoke-WebRequest '$FRONT_URL' -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200 } catch { exit 1 }" \
      >/dev/null 2>&1
  else
    return 1
  fi
}

wait_front() {
  local i
  for i in $(seq 1 120); do
    if front_ok; then
      echo "✓ front UP $FRONT_URL"
      return 0
    fi
    sleep 0.5
  done
  die "front pas UP après ~60s — voir $FRONT_LOG_FILE"
}

resolve_gradle() {
  local gradle_bin=""
  if command -v gradle >/dev/null 2>&1; then
    gradle_bin="$(command -v gradle)"
  elif [[ -n "${GRADLE_HOME:-}" && -x "$GRADLE_HOME/bin/gradle" ]]; then
    gradle_bin="$GRADLE_HOME/bin/gradle"
  elif [[ -f "/c/Users/karkafiy/Desktop/tools/gradle-9.7.1/bin/gradle.bat" ]]; then
    gradle_bin="/c/Users/karkafiy/Desktop/tools/gradle-9.7.1/bin/gradle.bat"
  else
    die "Gradle introuvable (définir GRADLE_HOME ou ajouter Gradle au PATH)"
  fi
  local java_bin="$JDK25_HOME/bin/java"
  if [[ ! -x "$java_bin" ]]; then
    die "java introuvable dans PATH"
  fi
  local java_major
  java_major="$("$java_bin" -version 2>&1 | sed -nE 's/.*version "([0-9]+)(\..*)?".*/\1/p' | head -1)"
  [[ "$java_major" =~ ^[0-9]+$ && "$java_major" -ge 25 ]] || \
    die "Java 25 requis pour le backend Sandbox (Java détecté: ${java_major:-inconnu})"
  printf '%s' "$gradle_bin"
}

start_back() {
  local gradle_bin
  gradle_bin="$(resolve_gradle)"
  mkdir -p "$APP/build"
  kill_port "$BACK_PORT"
  local app_dir="$APP"
  local log_file="$LOG_FILE"
  local error_log_file="$ERROR_LOG_FILE"
  if command -v cygpath >/dev/null 2>&1; then
    app_dir="$(cygpath -w "$app_dir")"
    gradle_bin="$(cygpath -w "$gradle_bin")"
    log_file="$(cygpath -w "$log_file")"
    error_log_file="$(cygpath -w "$error_log_file")"
  fi

  echo "→ start back (gradle bootRun) cwd=$APP"
  if command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -NoProfile -Command \
      "\$args = @('-Dorg.gradle.java.installations.paths=$JDK25_HOME', '--no-daemon', 'bootRun'); \$p = Start-Process -FilePath '$gradle_bin' -ArgumentList \$args -WorkingDirectory '$app_dir' -RedirectStandardOutput '$log_file' -RedirectStandardError '$error_log_file' -WindowStyle Hidden -PassThru; \$p.Id" \
      | tr -d '\r' | awk 'NF && $1 ~ /^[0-9]+$/ { print $1; exit }' >"$PID_FILE"
  else
    (
      cd "$APP"
      nohup "$gradle_bin" "-Dorg.gradle.java.installations.paths=$JDK25_HOME" --no-daemon bootRun >"$LOG_FILE" 2>&1 &
      echo $! >"$PID_FILE"
    )
  fi
  wait_health
}

start_front() {
  [[ -d "$WEB" ]] || die "manque $WEB"
  [[ -d "$WEB/node_modules" ]] || die "manque node_modules — cd $WEB && npm install --legacy-peer-deps"
  if [[ -x "$NODE22_HOME/node.exe" || -x "$NODE22_HOME/node" ]]; then
    export PATH="$NODE22_HOME:$PATH"
    hash -r 2>/dev/null || true
  fi
  local node_version
  node_version="$(node --version 2>/dev/null || true)"
  [[ "$node_version" =~ ^v22\. ]] || die "Node 22 requis pour le frontend Sandbox (Node détecté: ${node_version:-inconnu})"
  command -v npm >/dev/null 2>&1 || die "npm introuvable dans PATH"
  kill_port "$FRONT_PORT"
  echo "→ start front  $FRONT_URL"
  (
    cd "$WEB"
    export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=8192}"
    nohup npm start >"$FRONT_LOG_FILE" 2>&1 &
    echo $! >"$FRONT_PID_FILE"
  )
  wait_front
}

cmd_status() {
  if health_ok; then
    echo "back  : UP   $HEALTH_URL"
  else
    echo "back  : DOWN $HEALTH_URL"
  fi
  local fp
  fp="$(port_pids "$FRONT_PORT" || true)"
  if [[ -n "${fp//[[:space:]]/}" ]]; then
    echo "front : UP   $FRONT_URL  (pids: $(echo "$fp" | tr '\n' ' '))"
  else
    echo "front : DOWN $FRONT_URL"
  fi
}

cmd_stop() {
  kill_port "$FRONT_PORT"
  kill_port "$BACK_PORT"
  rm -f "$FRONT_PID_FILE"
  rm -f "$PID_FILE"
  echo "✓ sandbox stopped"
}

cmd="${1:-up}"
case "$cmd" in
  up|start|"")
    start_back
    start_front
    ;;
  back)
    start_back
    echo "logs: $LOG_FILE"
    echo "tail -f \"$LOG_FILE\""
    ;;
  stop)
    cmd_stop
    ;;
  status)
    cmd_status
    ;;
  *)
    die "usage: $0 [up|back|stop|status]"
    ;;
esac
