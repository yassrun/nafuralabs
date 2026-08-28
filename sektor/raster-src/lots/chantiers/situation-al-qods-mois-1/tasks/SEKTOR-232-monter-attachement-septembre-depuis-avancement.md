---
id: SEKTOR-232
status: todo
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-231]
tags: [chantiers, attachement]
---

# Monter attachement septembre depuis avancement

> Période 01/09–30/09 : lignes lues depuis déclarations 2.1 (40 m³) et 2.3 (120 m²), sans ressaisie.

Contrat : [`../CONTRAT.md`](../CONTRAT.md) AC-M1..M6 · voisin [`avancement-et-attachement`](../../avancement-et-attachement/CONTRAT.md) AC-10..16.

## Étapes

- [ ] Déclaration avancement quantité seule sur nœuds feuilles ; refus 181 m³ sur 2.1.
- [ ] Création attachement période : lignes montées depuis déclarations septembre.
- [ ] Exclure nœud INTERNE et poste 3 (0 m²) des lignes.
- [ ] Signature MOE (lien public ou simulation API preuve) → `SIGNE_MOE`.
- [ ] Garde-fou : quantité déjà attachée non reproposée (AC-M6).

## Preuves attendues

- Tests service attachement + script partiel ou section future `verify-alqods-situation-mois1-235.mjs`.
- Grep : plus de saisie libre quantité sur attachement palier 1.

## Journal

```
28/08  posée
```

## Rapport de livraison
