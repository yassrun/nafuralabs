# Nafura ops (`nlops.sh`)

CLI deploy : infra partagée (1× par cluster) + produits (indépendants).

| Audience | Document |
|----------|----------|
| **Agents IA (ops)** | **[AGENTS.md](AGENTS.md)** — arbre de décision, recettes, troubleshooting |
| Monorepo / git / envs | [docs/AGENTS.md](../../docs/AGENTS.md) |

## Environnements

| `ENV` | Cluster | Contexte | Infra NS | Images |
|-------|---------|----------|----------|--------|
| `staging` | Docker Desktop K8s | `docker-desktop` | `nafura-infra-staging` | locales `:staging` |
| `prod` | OVH VPS k3s | `nafura-vps-prod` | `nafura-infra-prod` | registry VPS `:prod` |

`demo` (GKE) : **deprecated** — ne plus utiliser.

## Commandes (résumé)

| Commande | Effet |
|----------|-------|
| `bootstrap-env` | Infra + vault-init + **vault-seed** + wait services |
| `vault-seed` | Applique `secrets/nafura.secrets` → Vault pour `ENV` |
| `onboard-app <app>` | provision-db → migrate → deploy |
| `release-app <app>` | migrate → deploy-backend → deploy-frontend |
| `release-backend <app>` | migrate → deploy-backend |
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

### Staging — release quotidienne

```bash
BUILD_IMAGES=true KUBE_CONTEXT=docker-desktop ENV=staging bash toolchain/ops/nlops.sh release-app sektor-btp
```

### Prod — release Sektor

```bash
BUILD_IMAGES=true PUSH_IMAGES=true KUBE_CONTEXT=nafura-vps-prod ENV=prod REGISTRY_PASS=*** \
  bash toolchain/ops/nlops.sh release-app sektor-btp
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
make release-app APP=sektor-btp ENV=staging BUILD_IMAGES=true KUBE_CONTEXT=docker-desktop
```

Détail complet : [AGENTS.md](AGENTS.md).
