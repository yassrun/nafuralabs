---
id: ERP-22
status: todo
context: nafura
assignee: me
parent: ERP-18
feature: classification-article
priority: P1
estimate: 6h
blocked_by: [ERP-21]
tags: [sektor, inventory, onboarding]
---

# Classification article — Lot 3 · Familles en arbre

> Spec §4 Lot 3 + §3.2 / §3.3 (unités ML/MLT).

## Critères d'acceptation
- [ ] `reference-data.json` : 55 familles + parentCode ; plus de bloc itemTypes
- [ ] Unités corrigées (`ML` = mètre linéaire, millilitre → `MLT`)
- [ ] Seed `seedItemCategories` deux passes ; `seedItemTypes` supprimé
- [ ] Écran Familles : arbre + parent à la création
- [ ] Tenant frais : 55 familles dont 30 avec parent

## Journal
```
05/08 13:32  balayage · capturé depuis 00-PLAN Lot 3
```
