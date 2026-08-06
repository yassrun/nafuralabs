---
id: ERP-24
status: done
context: nafura
kind: task
feature: classification-article
parent: ERP-18
priority: P1
assignee: agent
gate: none
sprint: 2026-W32
blocked_by: [ERP-23]
tags: [sektor, inventory, materiel]
---


# Classification article — Lot 5 · Rattachement matériel ↔ article

> Spec §4 Lot 5 + migration données §5 (volume faible — bon moment).

## Critères d'acceptation
- [x] `materiels.item_id` + `item_category_id` (remplace famille VARCHAR libre)
- [x] Règle : fiche matériel + ligne `items` nature `MATERIEL`
- [x] Migration `article_type` → `nature` + reprise `PRESTATION` / familles legacy selon §5
- [x] `MaterielServiceTest` couvre création liée à un article
- [x] Drop `items.item_type_id` quand migration OK

## Journal
```
05/08 13:32  balayage · capturé depuis 00-PLAN Lot 5
05/08 15:45  ERP-23 done · débloqué
05/08 16:10  done · SQL v1.1/002 + create liée Item MATERIEL + front map familleId↔itemCategoryId
05/08 16:00  migrate staging · v1.1/001+002 appliqués · chantier classification clos
05/08 21:30  archivé → backlog_archive · framework v2
```
