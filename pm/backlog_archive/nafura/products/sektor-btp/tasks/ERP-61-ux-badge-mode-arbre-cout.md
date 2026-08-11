---
id: ERP-61
status: done
context: nafura
kind: task
priority: P1
assignee: agent
gate: qa
parent: ERP-58
feature: etude-cout-ux
sprint: 2026-W33
tags: [sektor, etudes, ux, cout]
---

# UX — Badge mode chiffrage dans l’arbre Coût

> L’arbre montre PU/Total mais pas Estimé / Forfait / Décomposé / coût déduit.
> Impossible de scanner la qualité sans ouvrir chaque drawer.

## Critères d'acceptation
- [x] Article : badge lisible selon `origineCout` (+ indicateur coût déduit si applicable)
- [x] Lot : pas de faux badge
- [x] Densité OK (pas de nouvelle colonne large si badge inline libellé/PU)

## Journal
```
11/08 15:25  done · QA DE-0001 · 5.1 Estimé+déduit · 5.2 Estimé · lot sans badge
11/08 15:21  doing
11/08 15:08  créé · tour Coût friction #3
```
