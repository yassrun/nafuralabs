---
kind: epic-progress
app: sektor-btp
slug: document-reader
raster_feature: ERP-53
updated: 2026-08-11
---

# Progress — Document reader

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
- 11/08 — le côté écrans sort dans une epic dédiée : `ecrans-lecture-documents` (ERP-67). Ce dossier
  garde le moteur ; le lot 4 est rendu côté demande. Les vagues 2 et 3 y trouvent leurs demandeurs
  (facture / offre reçue, pointage / comparatif fournisseurs).
- 11/08 — **renommé** : slug `import-magique` → `document-reader` (epic, `feature:` d'ERP-53, docs et
  références croisées). Le **nom de marque** est reporté — « Structura » est le candidat en tête, à
  vérifier à l'OMPIC ; il n'apparaîtra jamais dans le code, seulement dans l'UI de compte rendu.
- 11/08 — le renommage **du code** reste à faire **au lot 0**, quand le moteur déménage en
  plateforme. Périmètre mesuré : **38 fichiers** — 16 plateforme (tous dans le dossier
  `smart-import`), 21 sous `sektor-btp/web/app` (13 écrans, 8 `shared/` dont `SMART_IMPORT.md` et
  `erp-doc-scan.service.ts`), 1 e2e `smart-import-platform.spec.ts`. Le faire séparément coûterait
  deux passes pour le même résultat.
- 11/08 — `raster/backlog_archive/…/ERP-23` mentionne `smart-import` : **ne pas y toucher**. Un
  ticket archivé est un compte rendu daté, pas un document vivant.
- O1 est bloquante avant le lot 1 : cache de plans par tenant ou mutualisé.
- Étalon de non-régression : 703 articles / 4 fichiers, cf. `docs/extraction/README.md`.
- `ReadingPlan` / `PlanResolver` / `PlanValidator` / `PlanCache` : zéro occurrence dans le dépôt à
  ce jour — tout est à écrire au lot 1.
