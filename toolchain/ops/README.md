# Nafura ops (`nlops.sh`)

CLI deploy : infra partagée (1× par cluster) + produits (indépendants).

| Audience | Document |
|----------|----------|
| **Agents IA (ops)** | **[AGENTS.md](AGENTS.md)** — cycle de vie, recettes, troubleshooting |
| Monorepo / git / envs | [docs/AGENTS.md](../../docs/AGENTS.md) |

## Cycle de vie (vocabulaire canonique)

| Commande | Effet |
|----------|-------|
| **`make dev-up SCOPE=front\|back\|full`** | Process **locaux** (ng serve / bootRun) → infra **staging** — **sans** rebuild image |
| **`make stg-up SCOPE=front\|back\|full`** | Build images + **deploy pods** staging |
| **`make prod-up SCOPE=front\|back\|full`** | Build + push + **deploy pods** prod (`REGISTRY_PASS` requis) |

```bash
make dev-up  SCOPE=full APP=sektor-btp          # itérer
make stg-up  SCOPE=full APP=sektor-btp          # valider staging
REGISTRY_PASS=*** make prod-up SCOPE=full APP=sektor-btp   # prod
```

Itérer → `dev-up` · Valider → `stg-up` · Promouvoir → `prod-up`.

## Environnements

| `ENV` | Cluster | Contexte | Infra NS | Images |
|-------|---------|----------|----------|--------|
| `staging` | Docker Desktop K8s | `docker-desktop` | `nafura-infra-staging` | locales `:staging` |
| `prod` | OVH VPS k3s | `nafura-vps-prod` | `nafura-infra-prod` | registry VPS `:prod` |

`demo` (GKE) : **deprecated** — ne plus utiliser.

## Commandes bas niveau (résumé)

| Commande | Effet |
|----------|-------|
| `bootstrap-env` | Infra + vault-init + **vault-seed** + wait services |
| `vault-seed` | Applique `secrets/nafura.secrets` → Vault pour `ENV` |
| `onboard-app <app>` | provision-db → migrate → deploy |
| `release-app <app>` | migrate → deploy-backend → deploy-frontend (= `stg-up`/`prod-up` `SCOPE=full`) |
| `release-backend <app>` | migrate → deploy-backend (= `SCOPE=back`) |
| `release-frontend <app>` | deploy-frontend (= `SCOPE=front`) |
| `infra-up` | Apply overlay infra |
| `preflight` | Diagnostic cluster / images |

`BUILD_IMAGES=true` pour rebuild Docker. Prod : ajouter `PUSH_IMAGES=true REGISTRY_PASS=…`.

## Scénarios

### Staging — nouveau cluster

```bash
# secrets/nafura.secrets doit exister (voir secrets/README.md)

KUBE_CONTEXT=docker-desktop ENV=staging bash toolchain/ops/nlops.sh bootstrap-env
BUILD_IMAGES=true KUBE_CONTEXT=docker-desktop ENV=staging bash toolchain/ops/nlops.sh onboard-app sektor-btp
```

### Staging — validation pods

```bash
make stg-up SCOPE=full APP=sektor-btp
```

### Staging — itération locale (sans image)

```bash
make dev-up SCOPE=full APP=sektor-btp
```

### Prod — Sektor

```bash
REGISTRY_PASS=*** make prod-up SCOPE=full APP=sektor-btp
```

URLs prod : `sektor.nafuralabs.com`, `api.sektor.nafuralabs.com`, `iam.nafuralabs.com`

## Hostnames staging

Tous en `*.nafuralabs.staging` → `127.0.0.1` dans le fichier hosts :

```
127.0.0.1 sektor.nafuralabs.staging api.sektor.nafuralabs.staging mbs.nafuralabs.staging zenith.nafuralabs.staging iam.nafuralabs.staging minio.nafuralabs.staging s3.nafuralabs.staging vault.nafuralabs.staging
```

Windows (admin) : `powershell -ExecutionPolicy Bypass -File toolchain/ops/add-staging-hosts.ps1`

## Makefile

```bash
make help
make stg-up SCOPE=full APP=sektor-btp
make prod-up SCOPE=full APP=sektor-btp REGISTRY_PASS=***
make dev-up SCOPE=front APP=sektor-btp
```

Détail complet : [AGENTS.md](AGENTS.md).
