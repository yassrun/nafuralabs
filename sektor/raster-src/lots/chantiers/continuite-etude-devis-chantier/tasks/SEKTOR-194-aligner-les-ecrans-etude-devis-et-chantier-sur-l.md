---
id: SEKTOR-194
status: todo
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-191, SEKTOR-192, SEKTOR-193]
tags: [web, etudes, devis, chantiers]
---

# Aligner les écrans Étude, Devis et Chantier sur le contrat

> Rendre le cycle et les montants compréhensibles sur les trois modules : gain contrôlé, devis figé, sources navigables et vocabulaire identique.

Contrat : [`../CONTRAT.md`](../CONTRAT.md), AC-3 à AC-5 et AC-12 à AC-18.

## Étapes

- [ ] Sur Étude, remplacer le gain/conversion ambigu par un récapitulatif devis, attribution, déboursé et marge avec erreurs actionnables.
- [ ] Implémenter la confirmation de marge négative réservée, motif obligatoire, sans proposer le geste aux autres rôles.
- [ ] Sur Devis approuvé, retirer édition/émission/annulation/suppression/version et conserver les actions de consultation autorisées.
- [ ] Ajouter les liens exacts Étude ↔ Devis ↔ Chantier à partir des identifiants, avec états absents explicites.
- [ ] Uniformiser les libellés vente, déboursé, budget et marge, ainsi que le format HT/MAD et les valeurs indisponibles.
- [ ] Corriger les actions proposées selon statut/permission et traiter un changement concurrent par message métier + rechargement.
- [ ] Ne pas entreprendre la refonte du cockpit : limiter la fiche chantier aux faits/source indispensables à ce contrat.

## Preuves attendues

- Tests composants des états brouillon, approuvé, gagné, converti, interdit et donnée indisponible.
- Parcours navigateur : aucune action d'écriture sur le devis approuvé, navigation bidirectionnelle exacte.
- Capture avant gain montrant `737106 / 582600 / 154506`, puis mêmes valeurs après conversion.
- Vérification qu'aucun écran ne libelle `582600` comme vente ni `737106` comme budget.

## Journal

```
26/08 12:17  posée
```

## Rapport de livraison

À compléter avec écrans touchés, captures, commandes et écarts laissés au lot cockpit.
