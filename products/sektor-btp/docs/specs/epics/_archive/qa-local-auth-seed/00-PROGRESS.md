---
kind: epic-progress
app: sektor-btp
slug: qa-local-auth-seed
raster_feature: ERP-40
updated: 2026-08-11
---

# Progress — QA local auth + seed

**Statut :** done  
**Lot courant :** — (clos)  
**Ticket :** ERP-40 (archived)  
**Next :** —

## Lots

| # | Lot | Status | Ticket |
|---|-----|--------|--------|
| 1 | Contrat + docs agents | done | ERP-41 |
| 2 | Provision tenant+owner + seed preset | done | ERP-42 |
| 3 | Auto-auth unifié → `qa@…` | done | ERP-43 |
| 4 | Inventaire seed (outdated) | done | ERP-44 |
| 5 | CLI `qa-token` | done | ERP-45 |
| 6 | (Option) API key locale | cancelled | — |

## Notes (courtes)

- 2026-08-10 : PLAN + ADR rédigés — **pas d’impl code**.
- 2026-08-10 : impl Lots 1–5 — `QaLocalProvisioner`, defaults `qa@…`, docs, `qa-token.sh`, inventaire.
- 2026-08-11 : check progress · ERP-40→45 `done` (humain) · Raster → `backlog_archive/` · epic → `_archive/`.
- Lot 6 (API key locale) hors scope — non livré.
