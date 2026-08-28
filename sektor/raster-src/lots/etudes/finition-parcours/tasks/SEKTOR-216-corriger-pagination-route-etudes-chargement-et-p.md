---
id: SEKTOR-216
status: todo
context: nafura
type: bug
agent_type: exec
priority: P2
assignee: agent
gate: none
blocked_by: [SEKTOR-215]
tags: [etudes, chantiers, ux]
---

# Corriger pagination, route /etudes, chargement et pourcentages

> Une pagination française par liste. Pas de faux état vide. Pourcentages à une décimale.

Contrat : [`../CONTRAT.md`](../CONTRAT.md) AC-11 à AC-13. `/etudes` est dans SEKTOR-214.

## Étapes

- [ ] Études et Devis : un seul paginator serveur, libellés FR, une taille.
- [ ] Portefeuille chantiers (et études) : état chargement distinct du vide ; erreur ≠ 0 lignes.
- [ ] Arrondir avancement / taux à l'affichage (1 décimale), pas dans le calcul.

## Preuves attendues

- Une seule mention de pagination sur Études et sur Devis.
- Fetch lent simulé : pas de « 0 chantier » avant la réponse.
- `4.1846` affiché `4,2 %`.
- Captures desktop.

## Journal

```
27/08 21:58  posée
```

## Rapport de livraison

