---
id: SEKTOR-214
status: todo
context: nafura
type: bug
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-213]
tags: [etudes, devis, chantiers, tracabilite]
---

# Rendre la chaine Etude-Devis-Chantier navigable

> Depuis chaque objet, ouvrir les deux autres par identifiant. La liste Devis ouvre une fiche. `/etudes` ouvre le portefeuille Études.

Contrat : [`../CONTRAT.md`](../CONTRAT.md) AC-7, AC-8, AC-9.

## Étapes

- [ ] Brancher clic ligne + numéro de la liste Devis vers `/etudes/devis/{id}`.
- [ ] Sur le chantier, rendre `devisNumero` et l'étude cliquables (`openDevis` / `openEtude` déjà présents).
- [ ] Depuis l'étude convertie et le devis approuvé : liens chantier et devis/étude.
- [ ] Rediriger `/etudes` vers `etudes/dossiers`, pas `etudes/devis`.

## Preuves attendues

- Clic `DV-2026-0060` en liste → fiche devis (id du snapshot).
- Fiche chantier : clic numéro devis et numéro étude → bonnes fiches.
- `/etudes` affiche le portefeuille études.
- Captures desktop + 390.

## Journal

```
27/08 21:58  posée
```

## Rapport de livraison

