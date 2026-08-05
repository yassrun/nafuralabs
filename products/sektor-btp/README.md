# Sektor BTP (ERP)

ERP BTP. Référence monorepo : [docs/AGENTS.md](../../docs/AGENTS.md).  
Deploy : [toolchain/ops/AGENTS.md](../../toolchain/ops/AGENTS.md).

## Structure

```
sektor-btp/
├── backend/app/          # :sektor:app
├── backend/modules/      # :sektor:<domaine>
├── web/app/              # UI (@applications/*)
└── deploy/k8s/overlays/  # staging | prod
```

## Build

```bash
.\gradlew.bat :sektor:app:bootJar
cd web && npm run build:staging   # ou build:prod pour prod
```

## Cycle de vie

```bash
make dev-up  SCOPE=front|back|full APP=sektor-btp   # locaux → infra staging (sans image)
make stg-up  SCOPE=front|back|full APP=sektor-btp   # build + pods staging
REGISTRY_PASS=*** make prod-up SCOPE=full APP=sektor-btp   # après OK staging
```

### Mode B + Cursor QA (skip Keycloak)

Pour QA locale sans IAM (user seed `cursor.qa@nafuralabs.local`) :

```bash
ENV=staging KUBE_CONTEXT=docker-desktop bash toolchain/ops/nlops.sh dev-up sektor-btp full
set -a; source secrets/dev-staging-local.env; set +a   # inclut NAFURA_DEV_CURSOR_AUTH_ENABLED=true
./gradlew.bat :sektor:app:bootRun
cd products/sektor-btp/web && npm run start:erp:cursor
# → http://127.0.0.1:4200 auto-login (pas de Keycloak)
```

Le flag `NAFURA_DEV_CURSOR_AUTH_ENABLED` ne doit **jamais** être activé sur les pods staging/prod.

## Deploy (bas niveau)

```bash
# 1× infra sur nouveau cluster staging
KUBE_CONTEXT=docker-desktop ENV=staging bash toolchain/ops/nlops.sh bootstrap-env

# 1× premier onboard
BUILD_IMAGES=true KUBE_CONTEXT=docker-desktop ENV=staging bash toolchain/ops/nlops.sh onboard-app sektor-btp

# = make stg-up SCOPE=full
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
