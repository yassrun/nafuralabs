---
id: ERP-59
status: done
context: nafura
kind: task
priority: P0
assignee: agent
gate: qa
parent: ERP-58
feature: etude-cout-ux
sprint: 2026-W33
tags: [sektor, etudes, bug, ux, gates]
---

# Bug — Soft Coût compte l’alerte qualité comme « poste à chiffrer »

> Bannière soft : « 1 poste à chiffrer » + Anomalies=1 alors que tous les
> articles ont un PU. Cause : merge gates 3+4+5 inclut `part_couts_estimes`
> (gate chiffrage, sans `noeudId`).

## Critères d'acceptation
- [x] Soft « N postes à chiffrer » / KPI Anomalies étape = uniquement postes incomplets (PU / origine / décompo manquants)
- [x] Alerte `part_couts_estimes` ne se présente plus comme poste manquant sur Coût (reste visible à la Synthèse)
- [x] Si tous les postes ont un coût : soft → OK / prêt (pas de faux 1)
- [x] QA DE-0001 : 5.1 + 5.2 chiffrés → Anomalies 0 · pas « poste à chiffrer »

## Journal
```
11/08 15:20  done · QA DE-0001 Coût OK + Synthèse « trop estimés »
11/08 15:08  doing · priorité #1 tour Coût
```
