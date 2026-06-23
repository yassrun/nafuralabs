# Agent rules — NafuraLabs

Guide complet : [README.md](README.md).


**`nf/nafuralabs`** — seul monorepo actif.

**`nf/nafura`** — legacy, ne plus modifier sauf hotfix prod avant bascule.

## Products

| App ID | Gradle | K8s namespace | DB |
|--------|--------|---------------|-----|
| `sektor-btp` | `:sektor:app`, `:sektor:<module>` | `nafura-sektor` | `nafura_erp` |

## Imports

- Backend: `project(":platform:…")`, `project(":sektor:…")`
- Frontend: `@platform/*` → `platform/web`, `@applications/*` → `products/sektor-btp/web/app`

## Environments

- `staging` = cluster K8s local
- `prod` = GKE
- Pas d’overlay `dev`

## Forbidden

- JSON spec-driven codegen
- nafgen, nafspec, nafops
- Nouveau code métier hors `products/<app-id>/`

## Ops

```bash
# 1× par nouveau cluster (staging ou prod)
ENV=staging bash toolchain/ops/nlops.sh bootstrap-env

# 1× par produit sur cet env
ENV=staging bash toolchain/ops/nlops.sh onboard-app sektor-btp

# Releases (infra déjà en place)
ENV=staging bash toolchain/ops/nlops.sh deploy sektor-btp
```

Voir [toolchain/ops/README.md](../toolchain/ops/README.md).
