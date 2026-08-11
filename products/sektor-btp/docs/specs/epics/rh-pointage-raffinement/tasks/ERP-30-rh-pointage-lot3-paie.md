---
id: ERP-30
status: todo
context: nafura
kind: task
feature: rh-pointage-raffinement
parent: ERP-26
priority: P2
assignee: either
gate: me
blocked_by: [ERP-29]
tags: [sektor, rh, paie, backend]
---


# RH / pointage — Lot 3 · Paie juste et paramétrée

> Spec §5 Lot 3. Attend validation comptable des chiffres §4.5 + décision 7.2.

## Critères d'acceptation
- [ ] Table `parametres_paie` datée + seed valeurs validées comptable
- [ ] `FichePaieCalculator` : assiette unique CNSS/AMO, frais pro, barème daté, charges famille, patronal
- [ ] `FichePaieService` lit HS validées du mois (plus de `montantHeuresSup` en entrée)
- [ ] Fiche validée fige ses paramètres
- [ ] Tests étendus (tranches, plafond CNSS, charges famille)
- [ ] Fiche de référence comptable reproduite au centime

## Journal
```
05/08 16:05  balayage · capturé depuis 00-PLAN Lot 3
05/08 21:30  framework v2 · task schema (estimate out · gate/kind)
```
