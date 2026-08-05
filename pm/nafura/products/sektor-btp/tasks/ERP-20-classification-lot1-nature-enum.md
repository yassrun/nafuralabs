---
id: ERP-20
status: todo
context: nafura
assignee: me
parent: ERP-18
feature: classification-article
priority: P0
estimate: 8h
blocked_by: [ERP-19]
tags: [sektor, inventory, backend]
---

# Classification article — Lot 1 · Nature devient un vrai enum

> Spec §4 Lot 1. Compile + tests avant Lot 2.

## Critères d'acceptation
- [ ] `Nature` enum Java (9 valeurs + attributs) remplace constantes String
- [ ] `NatureComposantMapping` étendu ; plus d’écrasement LOCATION/OUTILLAGE → MATERIEL
- [ ] Champ `articleType` → `nature` (entité + DTOs + validation 400)
- [ ] `GET /api/v1/article-natures` lecture seule
- [ ] Changelog SQL rename `items.article_type` → `items.nature`
- [ ] `Nature.fromLegacy` pour `MATERIAU`
- [ ] `NatureComposantMappingTest` OK pour les 9 natures

## Journal
```
05/08 13:32  balayage · capturé depuis 00-PLAN Lot 1
```
