---
id: ERP-20
status: done
context: nafura
kind: task
feature: classification-article
parent: ERP-18
priority: P0
assignee: agent
gate: none
sprint: 2026-W32
blocked_by: [ERP-19]
tags: [sektor, inventory, backend]
---


# Classification article — Lot 1 · Nature devient un vrai enum

> Spec §4 Lot 1. Compile + tests avant Lot 2.

## Critères d'acceptation
- [x] `Nature` enum Java (9 valeurs + attributs) remplace constantes String
- [x] `NatureComposantMapping` étendu ; LOCATION/OUTILLAGE natures distinctes ; SERVICE→DPU_ST
- [x] Champ `articleType` → `nature` (entité + DTOs + validation 400)
- [x] `GET /api/v1/article-natures` lecture seule
- [x] Changelog SQL rename `items.article_type` → `items.nature`
- [x] `Nature.fromLegacy` pour `MATERIAU`
- [x] `NatureComposantMappingTest` OK pour les 9 natures

## Journal
```
05/08 13:32  balayage · capturé depuis 00-PLAN Lot 1
05/08 13:50  ERP-19 done · débloqué · SERVICE→DPU_ST figé dans ADR
05/08 14:50  done · Nature enum + mapping + NatureController + SQL v1.1 + tests OK
05/08 21:30  archivé → backlog_archive · framework v2
```
