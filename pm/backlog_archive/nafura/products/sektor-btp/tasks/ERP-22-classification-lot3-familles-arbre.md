---
id: ERP-22
status: done
context: nafura
kind: task
feature: classification-article
parent: ERP-18
priority: P1
assignee: agent
gate: none
sprint: 2026-W32
blocked_by: [ERP-21]
tags: [sektor, inventory, onboarding]
---


# Classification article — Lot 3 · Familles en arbre

> Spec §4 Lot 3 + §3.2 / §3.3 (unités ML/MLT).

## Critères d'acceptation
- [x] `reference-data.json` : 60 familles (25 racines + 35 enfants) + parentCode
- [x] Unités corrigées (`ML` = mètre linéaire, millilitre → `MLT`)
- [x] Seed `seedItemCategories` deux passes
- [x] Écran Familles : arbre TreeEditor + parent à la création
- [x] Tenant frais : 60 familles dont 35 avec parent

## Journal
```
05/08 13:32  balayage · capturé depuis 00-PLAN Lot 3
05/08 15:05  ERP-21 done · débloqué · itemTypes seed déjà retiré
05/08 15:25  done · 60 familles + seed 2 passes + UoM ML/MLT + famille-tree UI
05/08 21:30  archivé → backlog_archive · framework v2
```
