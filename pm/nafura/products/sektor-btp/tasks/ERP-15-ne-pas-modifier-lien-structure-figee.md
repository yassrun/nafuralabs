---
id: ERP-15
status: todo
context: nafura
kind: task
feature: etude-parcours
parent: ERP-17
priority: P1
assignee: me
gate: me
tags: [sektor, etudes, chiffrage, structure, regle-metier]
---


# Règle métier — ne pas modifier le lien (structure figée / correction)

> Quand l’étude est en **Structure figée** (chiffrage / correction), **on ne doit
> pas pouvoir modifier le lien** (liaison structure / marché / source — à figer
> précisément à l’impl). L’UI et les API doivent l’interdire.

## Contexte UI
- Étude ex. DE-0007 · tag **Structure figée** · étape Décomposition
- Actions visibles : Corriger le chiffrage · Réouvrir le bordereau
- Besoin exprimé : « on ne doit pas modifier le lien »

## Critères d'acceptation
- [ ] Périmètre du « lien » clarifié (AO / dossier parent / nœuds structure / version source)
- [ ] En **Structure figée** : pas d’édition UI du lien (champs / actions désactivés ou absents)
- [ ] API refuse la modification du lien dans cet état (erreur métier claire)
- [ ] « Réouvrir le bordereau » (si conservé) = seul chemin explicite pour dégeler la structure — documenté
- [ ] Correction chiffrage (PU, décomposition) reste possible **sans** toucher au lien

## Journal
```
05/08 12:39  capturé depuis écran DE-0007 Structure figée + besoin « ne pas modifier le lien »
05/08 21:30  framework v2 · task schema (estimate out · gate/kind)
```
