---
id: SEKTOR-121
status: done-me
context: nafura
type: bug
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-115]
tags: [etudes, qa-parcours]
---

# Clic article ouvre le drawer de chiffrage

> Etape Cout : clic simple sur l article inerte. Seulement double-clic, sans affordance. openOnClick false, selectionEnabled true.

Repro QA 20/08 : `openOnClick` false, `selectionEnabled` true → `onRowClick` no-op, `onRowDblClick` ouvre. Pas d’affordance.

## Étapes

- [x] Étape Coût : un **clic simple** sur un ARTICLE ouvre le drawer de chiffrage.
- [x] Affordance visible (curseur / hint), pas seulement le double-clic.
- [x] Preuve e2e : clic (pas dblclick) ouvre le drawer. Vu rouge avant.

## Journal

```
20/08 21:12  posée
20/08 21:33  status → doing
20/08 21:40  e2e vert : clic Beton QA → .poste-drawer
20/08 21:34  status → review
20/08 21:40  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `decomposition-workspace` passe `[openOnClick]="true"` à `bordereau-arbre` (hint « clic pour ouvrir »).
critères prouvés     Clic simple sur l’article ouvre `.poste-drawer` (parcours-qa-cout-chrome).
décidé seul          Un seul clic, pas de mode sélection vs ouverture — l’étape Coût ouvre toujours le drawer.
écarts / dette       Double-clic reste actif (même handler).
