---
id: ERP-32
status: todo
context: nafura
kind: task
feature: rh-pointage-raffinement
parent: ERP-26
priority: P2
assignee: agent
gate: none
blocked_by: [ERP-29]
tags: [sektor, rh, cleanup]
---


# RH / pointage — Lot 5 · Intégrité et nettoyage

> Spec §5 Lot 5. Parties pointage (seed hors lecture, routes HS/frais) peuvent avancer tôt.

## Critères d'acceptation
- [ ] FK vers `employes` sur les 8 tables (constat H)
- [ ] Supprimer `employe_nom` dénormalisé ; joindre à la lecture
- [ ] Router ou supprimer écrans `heures-sup` / `frais-deplacement`
- [ ] Sortir `seedIfEmpty()` des services de lecture
- [ ] `RhKpiService` masse salariale depuis `fiches_paie`
- [ ] Retirer `/api/sync/**` des public-endpoints
- [ ] GPS / signature : distance paramétrable + signature obligatoire avant soumission

## Journal
```
05/08 16:05  balayage · capturé depuis 00-PLAN Lot 5
05/08 21:30  framework v2 · task schema (estimate out · gate/kind)
```
