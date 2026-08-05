---
id: ERP-24
status: todo
context: nafura
assignee: me
parent: ERP-18
feature: classification-article
priority: P1
estimate: 6h
blocked_by: [ERP-23]
tags: [sektor, inventory, materiel]
---

# Classification article — Lot 5 · Rattachement matériel ↔ article

> Spec §4 Lot 5 + migration données §5 (volume faible — bon moment).

## Critères d'acceptation
- [ ] `materiels.item_id` + `item_category_id` (remplace famille VARCHAR libre)
- [ ] Règle : fiche matériel + ligne `items` nature `MATERIEL`
- [ ] Migration `article_type` → `nature` + reprise `PRESTATION` / familles legacy selon §5
- [ ] `MaterielServiceTest` couvre création liée à un article
- [ ] Drop `items.item_type_id` quand migration OK

## Journal
```
05/08 13:32  balayage · capturé depuis 00-PLAN Lot 5
```
