---
id: ERP-14
status: todo
context: nafura
kind: task
feature: chiffrage-drawer
parent: ERP-16
priority: P1
assignee: me
gate: none
tags: [sektor, etudes, chiffrage, bug, ui]
---


# Bug affichage — commentaires d'équipe superposés au tableau (mode décomposé)

> Dans le drawer chiffrage poste (onglet **Décomposé**), le bloc
> **Commentaires d'équipe** se superpose au tableau des lignes
> (MATIÈRE / MAIN-D'ŒUVRE / MATÉRIEL) → texte illisible.

## Contexte repro
- Étude ex. DE-0007 · étape « Décomposition et consultations »
- Poste 5.2 ouvert en drawer, onglet Décomposé
- Capture : commentaires + champ « Écrire un commentaire… » par-dessus les lignes

## Critères d'acceptation
- [ ] Bloc commentaires **sous** (ou hors) le tableau — plus de chevauchement
- [ ] Tableau décomposé entièrement lisible / cliquable (unités, PU, actions)
- [ ] Scroll / layout drawer OK avec beaucoup de lignes + fil commentaires
- [ ] Pas de régression onglet Prix fourni / autres sections du drawer

## Journal
```
05/08 12:38  capturé depuis screenshot drawer 5.2 DE-0007
05/08 21:30  framework v2 · task schema (estimate out · gate/kind)
```
