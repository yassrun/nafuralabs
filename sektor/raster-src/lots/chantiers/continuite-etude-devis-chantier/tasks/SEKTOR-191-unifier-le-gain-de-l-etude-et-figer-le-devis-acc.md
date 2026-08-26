---
id: SEKTOR-191
status: todo
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: me
tags: [etudes, devis, lifecycle]
---

# Unifier le gain de l'étude et figer le devis accepté

> Livrer une commande atomique qui gagne l'étude, approuve la version de devis correspondante et la fige. Refuser toute incohérence d'attribution ou de marge sans laisser d'état partiel.

Contrat : [`../CONTRAT.md`](../CONTRAT.md), AC-1 à AC-6.

## Étapes

- [ ] Cartographier les commandes/transitions actuelles de `DossierEtude` et `Devis`; supprimer les portes qui permettent `GAGNE` sans devis accepté.
- [ ] Implémenter une commande atomique et idempotente de gain avec devis/version explicites et contrôle du tenant.
- [ ] Vérifier `montantAttribueHt = total devis HT` à 0,01 MAD près, sans réécriture silencieuse.
- [ ] Calculer la marge avant gain; autoriser l'exception négative uniquement à `owner`/`dg`, avec motif et audit.
- [ ] Verrouiller côté domaine/API toute mutation, annulation, suppression ou nouvelle version du devis `APPROUVE` faisant foi.
- [ ] Journaliser les deux transitions avec un identifiant de corrélation commun et tester rollback/concurrence.

## Preuves attendues

- Tests domaine : transitions valides/invalides, mauvais tenant, devis absent ou terminal, mismatch `737106.00 / 500000.00`.
- Tests sécurité : refus `ingenieur`, succès `dg` avec motif pour vente `500000.00` et coût `582600.00`.
- Test d'intégration prouvant qu'une panne après la première mutation ne laisse ni étude gagnée seule, ni devis approuvé seul.
- Test API prouvant que toutes les écritures du devis accepté sont refusées après gain.

## Journal

```
26/08 12:17  posée
```

## Rapport de livraison

À compléter avec changements, commandes exécutées, décisions prises et écarts restants.
