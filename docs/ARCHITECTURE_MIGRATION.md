# Migration `nf/nafura` → `nafuralabs`

**Statut :** Sektor ERP migré (2026-06).  
**État actuel du repo :** [AGENTS.md](AGENTS.md).

Ce document conserve uniquement la **table de correspondance** des chemins legacy.

---

## Correspondance chemins

| Ancien (`nf/nafura`) | Nouveau (`nafuralabs`) |
|----------------------|------------------------|
| `backend/domains/*` | `products/sektor-btp/backend/modules/*` (`:sektor:*`) |
| `backend/applications/erp` | `products/sektor-btp/backend/app` (`:sektor:app`) |
| `web/app/applications/erp` | `products/sektor-btp/web/app` |
| `web/app/platform` | `platform/web` |
| `web/` (workspace) | `nafuralabs/web/` |
| `infra/k8s/.../erp` | `products/sektor-btp/deploy/k8s/` |
| `marketing/nafuralabs` | `marketing/corporate/` |
| Gradle `:domains:` | `:sektor:` |
| `nafops` / `nafgen` | `toolchain/ops/nlops.sh` |

**Base Postgres prod conservée :** `nafura_erp`

---

## Après bascule prod

1. Archiver `nf/nafura`
2. Ne plus porter de correctifs sur l’ancien monorepo

Ops prod : [toolchain/ops/AGENTS.md](../toolchain/ops/AGENTS.md) § OVH VPS.
