# Sektor BTP (ERP)

ERP BTP. Référence monorepo : [docs/AGENTS.md](../../docs/AGENTS.md).  
Deploy : [toolchain/ops/AGENTS.md](../../toolchain/ops/AGENTS.md).

## Structure

```
sektor-btp/
├── backend/app/              # :sektor:app (boot)
├── backend/modules/          # :sektor:<domaine> (+ onboarding, ai, search)
├── web/app/features/         # UI métier (@app/features/*)
├── web/app/{shell,shared,config,routes}/
└── deploy/k8s/overlays/      # staging | prod
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
