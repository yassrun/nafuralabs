---
id: ERP-29
status: todo
context: nafura
kind: task
feature: rh-pointage-raffinement
parent: ERP-26
priority: P1
assignee: either
gate: me
blocked_by: [ERP-28]
tags: [sektor, rh, backend]
---


# RH / pointage — Lot 2 · Validation contrôle et produit

> Spec §5 Lot 2.

## Critères d'acceptation
- [ ] `valider()` refuse hors `BROUILLON` / `SOUMIS`
- [ ] Contrôles : employé existe, `ACTIF`, pas en congé (`AbsenceService`), heures ↔ horaires
- [ ] Plafond journalier croisé tous lots `(tenant, employe, date)`
- [ ] Mode `FRAIS_GENERAUX` refusé dans un lot chantier
- [ ] `heure_arrivee` / `heure_depart` → `TIME`
- [ ] Génération auto `heures_supplementaires` (matrice §4.3) + `pointage_id` ; lecture seule écran
- [ ] CHECK type HS élargi aux 4 codes ; tracer `validated_by` / `validated_at`
- [ ] Tests : lot 10 pts dont 2 nuit → HS attendues ; congé approuvé → refus

## Journal
```
05/08 16:05  balayage · capturé depuis 00-PLAN Lot 2
05/08 20:15  ERP-28 done · débloqué
05/08 21:30  framework v2 · task schema (estimate out · gate/kind)
```
