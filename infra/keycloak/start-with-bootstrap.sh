#!/bin/sh
# Start Keycloak and apply Nafura Labs theme to the master realm (admin console).
set -eu

if [ -f /vault/secrets/keycloak ]; then
  . /vault/secrets/keycloak
fi

KC_ADMIN_USER="${KC_BOOTSTRAP_ADMIN_USERNAME:-admin}"
KC_ADMIN_PASS="${KC_BOOTSTRAP_ADMIN_PASSWORD:-admin}"

/opt/keycloak/bin/kc.sh start-dev --import-realm --health-enabled=true &
KC_PID=$!

for _ in $(seq 1 90); do
  if curl -sf http://127.0.0.1:9000/health/ready >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

if curl -sf http://127.0.0.1:9000/health/ready >/dev/null 2>&1; then
  /opt/keycloak/bin/kcadm.sh config credentials \
    --server http://127.0.0.1:8080 \
    --realm master \
    --user "$KC_ADMIN_USER" \
    --password "$KC_ADMIN_PASS" >/dev/null 2>&1 || true

  /opt/keycloak/bin/kcadm.sh update realms/master \
    -s loginTheme=nafuralabs \
    -s accountTheme=nafuralabs \
    -s emailTheme=nafuralabs \
    -s displayName="Nafura Labs IAM" \
    -s 'displayNameHtml=<span>Nafura Labs</span> IAM' >/dev/null 2>&1 || true
fi

wait "$KC_PID"
