---
id: SEKTOR-120
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

# Compteur anomalies etape N suit letape UI

> Label Anomalies etape N affiche un N qui n est pas letape UI. Clic header n ouvre pas le detail.

Repro QA 20/08 : header « Anomalies étape 2 » pendant l’étape 1 et 3 ; « Anomalies étape 1 » pendant l’étape 3. Clic header = rien.

## Étapes

- [x] Le libellé N = `etapeUi()` courante (pas un gate backend d’une autre étape).
- [x] Clic sur le compteur ouvre le même détail que « Voir les détails » des gates de **cette** étape.
- [x] Preuve e2e ou composant : à l’étape 3, le header ne dit plus « étape 2 ». Vu rouge avant.

## Journal

```
20/08 21:12  posée
20/08 21:33  status → doing
20/08 21:40  e2e vert : Anomalies étape 3 + dialog Détail des erreurs
20/08 21:34  status → review
20/08 21:40  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      Header : « Anomalies étape {{ etapeUi() }} ». Clic → `openGateProblemesDialog` (même dialog que Voir les détails).
critères prouvés     Étape Coût : libellé étape 3, pas « étape 2 » ; clic ouvre « Détail des erreurs ».
décidé seul          KPI cliquable même à 0 anomalies (dialog vide seulement s’il n’y a vraiment aucun problème).
écarts / dette       Aucun.
