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
ENV=staging bash toolchain/ops/nlops.sh infra-up
bash toolchain/ops/nlops.sh provision-db sektor-btp
bash toolchain/ops/nlops.sh deploy sektor-btp
```
