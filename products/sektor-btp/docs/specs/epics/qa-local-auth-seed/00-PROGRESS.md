---
kind: epic-progress
app: sektor-btp
slug: qa-local-auth-seed
pm_feature: ERP-40
updated: 2026-08-10
---

# Progress — QA local auth + seed

**Statut :** review (Lots 1–5 livrés — validation gate me sur ERP-40)  
**Lot courant :** 1–5  
**Ticket :** ERP-40  
**Next :** relancer Mode B (`dev-up` + bootRun + `start:erp:cursor`) puis check progress

## Lots

| # | Lot | Status | Ticket |
|---|-----|--------|--------|
| 1 | Contrat + docs agents | review | ERP-41 |
| 2 | Provision tenant+owner + seed preset | review | ERP-42 |
| 3 | Auto-auth unifié → `qa@…` | review | ERP-43 |
| 4 | Inventaire seed (outdated) | review | ERP-44 |
| 5 | CLI `qa-token` | review | ERP-45 |
| 6 | (Option) API key locale | todo | — |

## Notes (courtes)

- 2026-08-10 : PLAN + ADR rédigés — **pas d’impl code**.
- 2026-08-10 : impl Lots 1–5 — `QaLocalProvisioner`, defaults `qa@…`, docs, `qa-token.sh`, inventaire.
- Sibling archivé : `_archive/referentiel-catalogue-sektor`.
