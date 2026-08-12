---
id: ERP-31
status: todo
context: nafura
kind: task
feature: rh-pointage-raffinement
parent: ERP-26
priority: P2
assignee: agent
gate: none
blocked_by: [ERP-29]
tags: [sektor, rh, chantiers, backend]
---


# RH / pointage — Lot 4 · Coût remonte au chantier

> Spec §5 Lot 4. Bloqué aussi par décision 7.1 bis (clé frais généraux).
> Unifier `chantier_id` UUID avec le plan stock (constat J).

## Critères d'acceptation
- [ ] À validation lot : écriture coût MO = heures × coût horaire chargé, selon `mode_imputation`
- [ ] Coût chargé dérivé contrat + paramètres patronaux
- [ ] Répartition mensuelle `FRAIS_GENERAUX` (clé tranchée en 7.1 bis)
- [ ] Réalisé MO par chantier / poste comparable au chiffré
- [ ] Référence chantier unifiée UUID (avec stock)

## Journal
```
05/08 16:05  balayage · capturé depuis 00-PLAN Lot 4
05/08 21:30  framework v2 · task schema (estimate out · gate/kind)
```
