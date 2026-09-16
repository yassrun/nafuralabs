#!/usr/bin/env bash
# Sandbox — back (H2 :8082) + front (sandbox web :4300).
#
# Usage (Git Bash / Linux) :
#   ./sandbox-up.sh          # start back + front (front foreground)
#   ./sandbox-up.sh stop     # stop ports 8082 and 4300
#   ./sandbox-up.sh back     # back only
#   ./sandbox-up.sh status   # port health
#
# Windows (this machine): use the twin .\sandbox-up.ps1 — system bash.exe is WSL, not Git Bash.
# Do NOT use Gradle here (plugin proxy 407). Back = offline java.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP="$ROOT/sources/backend"
WEB="$ROOT/sources/web"
BACK_PORT=8082
FRONT_PORT=4300
HEALTH_URL="http://127.0.0.1:${BACK_PORT}/actuator/health"
FRONT_URL="http://127.0.0.1:${FRONT_PORT}"
PID_FILE="$APP/build/sandbox-backend.pid"
LOG_FILE="$APP/build/sandbox-backend.log"
MAIN_CLASS="ma.nafura.sandbox.bootstrap.SandboxApplication"

die() { echo "ERROR: $*" >&2; exit 1; }

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

require_offline() {
  [[ -d "$APP/build/offline-classes" ]] || die "manque $APP/build/offline-classes (build offline une fois)"
  [[ -f "$APP/build/offline-classpath.txt" ]] || die "manque $APP/build/offline-classpath.txt"
  command -v java >/dev/null 2>&1 || die "java introuvable dans PATH"
}

start_back() {
  require_offline
  mkdir -p "$APP/build"
  kill_port "$BACK_PORT"
  # Le fichier contient déjà offline-classes + jars (.m2), séparateur Windows ;
  local cp
  cp="$(tr -d '\r\n' <"$APP/build/offline-classpath.txt")"
  [[ -n "$cp" ]] || die "offline-classpath.txt vide"
  cp="$APP/build/offline-classes;$cp"

  echo "→ start back (java offline) cwd=$APP"
  (
    cd "$APP"
    # nohup pour survivre si le shell parent ferme ; logs dédiés
    nohup java -cp "$cp" "$MAIN_CLASS" >"$LOG_FILE" 2>&1 &
    echo $! >"$PID_FILE"
  )
  wait_health
}

start_front() {
  [[ -d "$WEB" ]] || die "manque $WEB"
  [[ -d "$WEB/node_modules" ]] || die "manque node_modules — cd $WEB && npm install --legacy-peer-deps"
  command -v npm >/dev/null 2>&1 || die "npm introuvable dans PATH"
  kill_port "$FRONT_PORT"
  echo "→ start front  $FRONT_URL"
  echo "   Ctrl+C arrête le front ; le back reste up (./sandbox-up.sh stop pour tout couper)"
  cd "$WEB"
  exec npm start
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
