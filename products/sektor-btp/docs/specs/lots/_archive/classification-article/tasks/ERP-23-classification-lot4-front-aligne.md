---
id: ERP-23
status: done
context: nafura
kind: task
feature: classification-article
parent: ERP-18
priority: P1
assignee: agent
gate: none
sprint: 2026-W32
blocked_by: [ERP-22]
tags: [sektor, inventory, frontend]
---


# Classification article — Lot 4 · Front aligné (9 natures)

> Spec §4 Lot 4. Inclut dialogue création article depuis chiffrage.

## Critères d'acceptation
- [x] Type TS `Nature` (9 valeurs) ; `ArticleType` alias deprecated
- [x] Select natures via lookup `GET /api/v1/article-natures` ; posteBudget prérempli à la création
- [x] Listing / filtres / mappers / mouvements / smart-import / i18n → `nature`
- [x] Dialogue chiffrage propose 9 natures (map → type DPU)
- [x] Filtre catalogue articles n’exclut plus MAIN_DOEUVRE (ex MATERIAU-only)

## Journal
```
05/08 13:32  balayage · capturé depuis 00-PLAN Lot 4
05/08 15:25  ERP-22 done · débloqué
05/08 15:45  done · NatureApiService + front 9 natures + i18n · tsc OK
05/08 21:30  archivé → backlog_archive · framework v2
```
