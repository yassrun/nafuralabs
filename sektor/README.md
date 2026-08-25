# Sektor BTP (ERP)

ERP BTP. Porte : [NAFURALABS.md](../NAFURALABS.md).  
Deploy : [nafura-platform/ops/AGENTS.md](../nafura-platform/ops/AGENTS.md).

## Structure

```
sektor/
├── raster-src/               # tickets SEKTOR-*
├── ops/                      # Dockerfiles + k8s/overlays/
├── e2e/                      # preuves — racine projet, pas sources/
└── sources/
    ├── backend/              # Gradle ici
    └── web/                  # package.json ici
```

## Build

```bash
cd sources/backend && ./gradlew :sektor:app:bootJar
cd ../web && npm run build:staging   # ou build:prod pour prod
```

## Cycle de vie

```bash
make -C nafura-platform/ops dev-up  SCOPE=front|back|full APP=sektor-btp   # locaux → infra staging (sans image)
make -C nafura-platform/ops stg-up  SCOPE=front|back|full APP=sektor-btp   # build + pods staging
REGISTRY_PASS=*** make -C nafura-platform/ops prod-up SCOPE=full APP=sektor-btp   # après OK staging
```

### Mode B + Cursor QA (skip Keycloak)

Un seul compte local pour humain + agents : **`qa@nafuralabs.local`** / tenant **`qa-local`**.
Au boot (`NAFURA_DEV_CURSOR_AUTH_ENABLED=true`), le backend provisionne le tenant et exécute
le **même preset onboarding** qu’un owner (`applyPreset` / `seedReferenceData`) — sans wizard UI.

```bash
ENV=staging KUBE_CONTEXT=docker-desktop bash nafura-platform/ops/nlops.sh dev-up sektor-btp full
set -a; source nafura-platform/ops/secrets/dev-staging-local.env; set +a   # NAFURA_DEV_CURSOR_AUTH_ENABLED=true
cd sektor/sources/backend && ./gradlew.bat :sektor:app:bootRun
cd sektor/sources/web && npm run start:erp:cursor
# → http://127.0.0.1:4200 auto-login (pas de Keycloak)
```

API sans browser :

```bash
eval "$(bash nafura-platform/ops/qa-token.sh)"
curl -s -H "Authorization: Bearer $TOKEN" -H "X-Tenant-Id: $TENANT_ID" "http://localhost:8082/api/..."
```

`cursor.qa@nafuralabs.local` est **déprécié** (remappé vers `qa@…`).  
Le flag `NAFURA_DEV_CURSOR_AUTH_ENABLED` ne doit **jamais** être activé sur les pods staging/prod.

## Deploy (bas niveau)

```bash
# 1× infra sur nouveau cluster staging
KUBE_CONTEXT=docker-desktop ENV=staging bash toolchain/ops/nlops.sh bootstrap-env

# 1× premier onboard
BUILD_IMAGES=true KUBE_CONTEXT=docker-desktop ENV=staging bash toolchain/ops/nlops.sh onboard-app sektor-btp

# = make -C nafura-platform/ops stg-up SCOPE=full
BUILD_IMAGES=true KUBE_CONTEXT=docker-desktop ENV=staging bash toolchain/ops/nlops.sh release-app sektor-btp
```

## Environnements

| Env | Cluster | Namespace | Web | API |
|-----|---------|-----------|-----|-----|
| staging | Docker Desktop | `sektor-staging` | `sektor.nafuralabs.staging` | `api.sektor.nafuralabs.staging` |
| prod | OVH VPS k3s | `sektor-prod` | `sektor.nafuralabs.com` | `api.sektor.nafuralabs.com` |

Infra partagée : `nafura-infra-${ENV}`. IAM staging : `iam.nafuralabs.staging`.

Hosts local : `powershell -ExecutionPolicy Bypass -File toolchain/ops/add-staging-hosts.ps1` (admin).

## DB

`nafura_erp` sur Postgres infra partagé.
