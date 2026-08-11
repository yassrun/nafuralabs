---
id: ERP-21
status: done
context: nafura
kind: task
feature: classification-article
parent: ERP-18
priority: P1
assignee: agent
gate: none
sprint: 2026-W32
blocked_by: [ERP-20]
tags: [sektor, inventory, backend, frontend]
---


# Classification article — Lot 2 · Suppression item_types

> Spec §4 Lot 2. Colonne `items.item_type_id` conservée jusqu’au Lot 5 / migration.

## Critères d'acceptation
- [x] Back : classes ItemType / controllers / validation JSON supprimés
- [x] Back : seedItemTypes + reference-data.itemTypes retirés (anticipé vs plan Lot 3)
- [x] Front : écrans types-articles + item-types + pages catalogue/items mortes
- [x] Routes / lookups / nav nettoyés (hand-edit des fichiers « generated »)
- [x] Plus de `ItemType` / `typeArticle` UI — `Item.itemTypeId` colonne conservée jusqu’au Lot 5

## Journal
```
05/08 13:32  balayage · capturé depuis 00-PLAN Lot 2
05/08 14:50  ERP-20 done · débloqué
05/08 15:05  done · ItemType CRUD+écrans+seed supprimés · ItemsApiService conservé · tsc+compile OK
05/08 21:30  archivé → backlog_archive · framework v2
```
