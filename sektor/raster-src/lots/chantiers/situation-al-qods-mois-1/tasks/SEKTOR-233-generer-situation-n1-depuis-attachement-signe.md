---
id: SEKTOR-233
status: todo
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-232]
tags: [chantiers, situation]
---

# Générer situation n°1 depuis attachement signé

> Situation consomme uniquement l’attachement `SIGNE_MOE` de septembre ; cascade RG + avance.

Contrat : [`../CONTRAT.md`](../CONTRAT.md) AC-M7..M10 · voisin [`situation-et-retenues`](../../situation-et-retenues/CONTRAT.md) AC-1..7.

## Étapes

- [ ] Brancher `SituationGenerationService` (ou équivalent) sur attachements signés non consommés.
- [ ] Lignes situation = nœuds 2.1 + 2.3, PU vendu lu, pas de lot seul / pas de `AvancementPhysique` direct.
- [ ] 1ère période : `cumulPrecedentHt = 0`, RG + avance sur taux chantier.
- [ ] Refus génération sans attachement `SIGNE_MOE` (AC-M9).
- [ ] Autoriser génération sans marché notifié — référence devis (186).

## Preuves attendues

- Tests unitaires génération + gold `fixtures/al-qods/situation-mois1/expected/situation-1.json`.

## Journal

```
28/08  posée
```

## Rapport de livraison
