---
id: ERP-21
status: todo
context: nafura
assignee: me
parent: ERP-18
feature: classification-article
priority: P1
estimate: 6h
blocked_by: [ERP-20]
tags: [sektor, inventory, backend, frontend]
---

# Classification article — Lot 2 · Suppression item_types

> Spec §4 Lot 2. Colonne `items.item_type_id` conservée jusqu’au Lot 5 / migration.

## Critères d'acceptation
- [ ] Back : classes ItemType / controllers / validation JSON supprimés
- [ ] Front : écrans types-articles + arbres morts + i18n nettoyés
- [ ] Routes / lookups / nav régénérés sans typeArticle
- [ ] Plus aucune occurrence `ItemType` / `itemTypeId` / `typeArticle` hors migration

## Journal
```
05/08 13:32  balayage · capturé depuis 00-PLAN Lot 2
```
