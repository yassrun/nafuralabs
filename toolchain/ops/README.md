# Nafura ops (`nlops.sh`)

Séparation **infra partagée** (une fois par env/cluster) et **produits** (déployables indépendamment).

**Référence agents AI** : [AGENTS.md](AGENTS.md)

## Environnements

| `ENV` | Cluster | Namespace infra | Namespace Sektor | Images |
|-------|---------|-----------------|------------------|--------|
| `staging` | Docker Desktop K8s | `nafura-infra-staging` | `sektor-staging` | tags locaux `:staging` |
| `prod` | OVH VPS k3s | `nafura-infra-prod` | `sektor-prod` | VPS registry `:prod` |
| `demo` | *(deprecated)* | — | — | — |

### Env `demo` (économie GKE)

- HTTP only — pas de cert-manager
- PVC réduits — postgres 5 Gi, minio 2 Gi, vault 1 Gi
- URLs : `http://sektor-demo.nafuralabs.com`, `http://iam-demo.nafuralabs.com`

## Catalogue des ops

### Cluster / infra (une fois par env)

| Commande | Description |
|----------|-------------|
| `clean-env` | Supprime legacy + namespaces de l'env (**destructif**) |
| `bootstrap-env` | Infra + vault-init + attente postgres/redis/minio/keycloak |
| `infra-up` | Applique l'overlay infra sans attente |
| `infra-wait` | Attend le rollout des services core |
| `preflight` | Vérifie injector, infra, images manquantes |

### Images

| Commande | Description |
|----------|-------------|
| `build-images [app]` | Build backend + web + keycloak + lifecycle |
| `push-images [app]` | Push vers GAR (demo/prod uniquement) |
| `build-push [app]` | build + push |

Variables : `REGISTRY`, `BUILD_IMAGES=true`, `PUSH_IMAGES=true`

### Base de données

| Commande | Description |
|----------|-------------|
| `provision-db <app>` | `CREATE DATABASE` sur Postgres partagé |
| `drop-db <app>` | Supprime la base (**destructif**) |
| `migrate <app>` | collectMigrations Gradle + **Job Liquibase K8s** |

### Déploiement produit

| Commande | Description |
|----------|-------------|
| `deploy <app>` | Applique l'overlay K8s complet |
| `deploy-backend <app>` | Apply + wait rollout backend |
| `deploy-frontend <app>` | Apply + wait rollout frontend |
| `reset-app <app>` | Scale à 0 ; `RESET_DB=true` → drop + recreate DB |
| `clean-app <app>` | Supprime le namespace produit |

### Workflows (enchaînements)

| Commande | Pipeline |
|----------|----------|
| `onboard-app <app>` | provision-db → **migrate** → deploy |
| `release-app <app>` | **migrate** → deploy-backend → deploy-frontend |
| `release-backend <app>` | migrate → deploy-backend |
| `release-frontend <app>` | deploy-frontend |

> **Ordre critique** : les migrations Liquibase tournent **avant** le backend via un Job K8s (`nafura-lifecycle:${ENV}`).

## Scénarios

### Nouveau cluster Docker Desktop (staging)

```bash
ENV=staging bash toolchain/ops/nlops.sh clean-env
ENV=staging bash toolchain/ops/nlops.sh bootstrap-env
BUILD_IMAGES=true ENV=staging bash toolchain/ops/nlops.sh onboard-app sektor-btp
```

### Release quotidienne (infra déjà up)

```bash
BUILD_IMAGES=true ENV=staging bash toolchain/ops/nlops.sh release-app sektor-btp
```

Backend seul (avec migrations) :

```bash
ENV=staging bash toolchain/ops/nlops.sh release-backend sektor-btp
```

Frontend seul :

```bash
BUILD_IMAGES=true ENV=staging bash toolchain/ops/nlops.sh release-frontend sektor-btp
```

### Reset app sur cluster existant

```bash
# Soft reset (scale down, garde la DB)
ENV=staging bash toolchain/ops/nlops.sh reset-app sektor-btp

# Hard reset (drop DB + recreate)
RESET_DB=true ENV=staging bash toolchain/ops/nlops.sh reset-app sektor-btp
BUILD_IMAGES=true ENV=staging bash toolchain/ops/nlops.sh release-app sektor-btp
```

### Nouveau cluster GKE (demo)

```bash
BUILD_IMAGES=true PUSH_IMAGES=true ENV=demo bash toolchain/ops/nlops.sh build-push sektor-btp
ENV=demo bash toolchain/ops/nlops.sh bootstrap-env
ENV=demo bash toolchain/ops/nlops.sh onboard-app sektor-btp
# ou si infra déjà up :
ENV=demo bash toolchain/ops/nlops.sh release-app sektor-btp
```

### GKE prod — premiers tests HTTP

URLs : `http://sektor.nafuralabs.com`, `http://api.sektor.nafuralabs.com`, `http://iam.nafuralabs.com`

```bash
BUILD_IMAGES=true PUSH_IMAGES=true ENV=prod bash toolchain/ops/nlops.sh build-push sektor-btp
ENV=prod bash toolchain/ops/nlops.sh bootstrap-env
ENV=prod bash toolchain/ops/nlops.sh release-app sektor-btp
```

Arrêt pour économiser :

```bash
kubectl scale deployment --all -n nafura-infra-demo --replicas=0
kubectl scale deployment --all -n sektor-demo --replicas=0
```

## Makefile

```bash
make help
make clean-env ENV=staging
make bootstrap-env ENV=staging
make preflight ENV=staging
make build-images ENV=staging
make onboard-app APP=sektor-btp ENV=staging
make release-app APP=sektor-btp ENV=staging BUILD_IMAGES=true
make release-backend APP=sektor-btp ENV=staging
make reset-app APP=sektor-btp ENV=staging RESET_DB=true
```

## Bases de données

| App | Base | Postgres |
|-----|------|----------|
| `sektor-btp` | `nafura_erp` | `nafura-infra-<env>` |

## Hostnames staging

Produits et infra partagée utilisent le suffixe `*.nafuralabs.staging` :

| Service | Host |
|---------|------|
| Sektor web | `sektor.nafuralabs.staging` |
| Sektor API | `api.sektor.nafuralabs.staging` |
| MBS vitrine | `mbs.nafuralabs.staging` |
| IAM | `iam.nafuralabs.staging` |
| Minio / S3 / Vault | `minio.nafuralabs.staging`, `s3.nafuralabs.staging`, `vault.nafuralabs.staging` |

```
127.0.0.1 sektor.nafuralabs.staging api.sektor.nafuralabs.staging mbs.nafuralabs.staging iam.nafuralabs.staging minio.nafuralabs.staging s3.nafuralabs.staging vault.nafuralabs.staging
```

Windows (admin) : `powershell -ExecutionPolicy Bypass -File toolchain/ops/add-staging-hosts.ps1`

## Images Sektor (manuel)

```bash
ENV=staging bash toolchain/ops/nlops.sh build-images sektor-btp
# ou
docker build -t sektor-btp-backend:staging -f products/sektor-btp/Dockerfile.jar products/sektor-btp/backend/app/build/libs
cd web && npm run build:prod
docker build -t sektor-btp-web:staging -f products/sektor-btp/Dockerfile.web .
```
