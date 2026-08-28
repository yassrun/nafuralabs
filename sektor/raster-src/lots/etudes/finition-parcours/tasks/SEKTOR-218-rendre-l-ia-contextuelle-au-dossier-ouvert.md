---
id: SEKTOR-218
status: todo
context: nafura
type: feature
agent_type: exec
priority: P2
assignee: agent
gate: none
blocked_by: [SEKTOR-217]
tags: [etudes, ia]
---

# Rendre l IA contextuelle au dossier ouvert

> L'agent affiche DE-xxxx et l'objet. Trois gestes : chiffrage, incohérences, rattachements catalogue. Journal acceptée / refusée / corrigée.

Contrat : [`../CONTRAT.md`](../CONTRAT.md) AC-16. Pas de chatbot générique.

## Étapes

- [ ] Afficher le dossier courant (numéro, objet) dans le panneau agent.
- [ ] Exposer les trois actions contextuelles, bornées au dossier ouvert.
- [ ] Journaliser chaque suggestion (état, acteur, date) et le rendre visible.
- [ ] Relier la provenance CPS → DPGF → coût sans second agent parallèle.

## Preuves attendues

- Sur DE-0103 (ou graphe de preuve) : le panneau nomme ce dossier, pas un contexte vide.
- Accepter / refuser / corriger une suggestion : états distincts après reload.
- Aucun chat hors geste métier ajouté.

## Journal

```
27/08 21:58  posée
```

## Rapport de livraison

