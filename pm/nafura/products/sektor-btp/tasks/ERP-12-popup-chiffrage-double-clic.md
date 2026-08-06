---
id: ERP-12
status: todo
context: nafura
kind: task
feature: chiffrage-drawer
parent: ERP-16
priority: P1
assignee: me
gate: none
tags: [sektor, etudes, chiffrage, ux]
---


# Ouverture du popup chiffrage poste — double-clic

> Le drawer / popup de chiffrage d’un poste doit s’ouvrir au **double-clic**
> (pas au simple clic), pour éviter les ouvertures accidentelles.

## Critères d'acceptation
- [ ] Double-clic sur un poste (ligne / nœud tree) → ouvre le popup chiffrage
- [ ] Simple clic → sélection / focus uniquement (pas d’ouverture)
- [ ] Comportement cohérent desktop ; pas de régression clavier / accessibilité documentée
- [ ] Si un autre geste d’ouverture existe (menu, bouton), il reste disponible

## Journal
```
05/08 12:34  capturé · ouverture popup chiffrage = double-clic
05/08 21:30  framework v2 · task schema (estimate out · gate/kind)
```
