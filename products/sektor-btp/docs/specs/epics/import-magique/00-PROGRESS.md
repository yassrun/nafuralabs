---
kind: epic-progress
app: sektor-btp
slug: import-magique
pm_feature: ERP-53
updated: 2026-08-11
---

# Progress — Import magique

**Statut :** todo
**Lot courant :** — (PLAN à valider avant découpage)
**Ticket :** ERP-53
**Next :** trancher O1 (portée du cache de plans), puis découper le lot 0 en `kind: task`.

## Lots

| # | Lot | Status | Ticket |
|---|-----|--------|--------|
| 0 | Socle grille en plateforme | todo | — |
| 1 | Plan, cascade, cache | todo | — |
| 2 | Plan ↔ Definition | todo | — |
| 3 | Carte des doutes | todo | — |
| 4 | Bascule vague 1 | todo | — |

## Notes (courtes)

- 11/08 — PLAN + ARCHITECTURE rédigés. Aucun lot ouvert.
- O1 est bloquante avant le lot 1 : cache de plans par tenant ou mutualisé.
- Étalon de non-régression : 703 articles / 4 fichiers, cf. `docs/extraction/README.md`.
- `ReadingPlan` / `PlanResolver` / `PlanValidator` / `PlanCache` : zéro occurrence dans le dépôt à
  ce jour — tout est à écrire au lot 1.
