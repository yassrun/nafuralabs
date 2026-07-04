# Agent rules — NafuraLabs

Guide complet : [README.md](README.md).

**Référence ops (déploiement, migrations, cluster)** → **[toolchain/ops/AGENTS.md](../toolchain/ops/AGENTS.md)**  
Lire ce document avant toute opération `nlops.sh`, bootstrap, release ou reset.

---

**`nf/nafuralabs`** — seul monorepo actif.

**`nf/nafura`** — legacy, ne plus modifier sauf hotfix prod avant bascule.

## Products

| App ID | Gradle | K8s namespace | DB |
|--------|--------|---------------|-----|
| `sektor-btp` | `:sektor:app`, `:sektor:<module>` | `sektor-${ENV}` | `nafura_erp` |
| `venue-catalog` | — | `venue-catalog-${ENV}` | `nafura_venue_catalog` |
| `mbs-studio` | — | `nafura-vitrine-${ENV}` | — |
| `corporate` | — | `nafura-vitrine-${ENV}` | — |

## Imports

- Backend: `project(":platform:…")`, `project(":sektor:…")`
- Frontend: `@platform/*` → `platform/web`, `@applications/*` → `products/sektor-btp/web/app`

## Environments

| `ENV` | Cluster | Context kubectl | Infra NS | App NS |
|-------|---------|-----------------|----------|--------|
| `staging` | Docker Desktop K8s (optional) | `docker-desktop` | `nafura-infra-staging` | `sektor-staging` |
| `prod` | OVH VPS k3s | `nafura-vps-prod` | `nafura-infra-prod` | `sektor-prod`, `nafura-vitrine-prod` |

Pas d’overlay `dev`.

## Forbidden

- JSON spec-driven codegen
- nafgen, nafspec, nafops
- Nouveau code métier hors `products/<app-id>/`
- Namespaces legacy : `nafura-erp-dev`, `nafura-infra`, infra dans `default`

## Ops (résumé)

```bash
# Diagnostic
KUBE_CONTEXT=docker-desktop ENV=staging bash toolchain/ops/nlops.sh preflight

# 1× nouveau cluster staging
KUBE_CONTEXT=docker-desktop ENV=staging bash toolchain/ops/nlops.sh bootstrap-env

# 1× premier produit
BUILD_IMAGES=true ENV=staging bash toolchain/ops/nlops.sh onboard-app sektor-btp

# Release (migrations AVANT backend)
BUILD_IMAGES=true ENV=staging bash toolchain/ops/nlops.sh release-app sektor-btp
```

Détail complet, arbre de décision, troubleshooting : **[toolchain/ops/AGENTS.md](../toolchain/ops/AGENTS.md)**.
