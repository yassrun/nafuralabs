---
id: SEKTOR-193
status: todo
context: nafura
type: bug
agent_type: exec
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-191, SEKTOR-192]
tags: [api, chantiers, budget, marge]
---

# Réconcilier vente, déboursé, budget et marge dans les lectures

> Faire lire liste, détail et budget depuis les mêmes faits canoniques. Éliminer les faux zéros, statuts divergents et confusions entre vente et déboursé.

Contrat : [`../CONTRAT.md`](../CONTRAT.md), dictionnaire financier et AC-10 à AC-14.

## Étapes

- [ ] Inventorier les champs/read models qui alimentent étude, liste chantier, détail et budget; nommer chaque sens avant modification.
- [ ] Exposer vente initiale/active, déboursé initial, budget révisé et marges valeur/taux depuis leurs agrégats propriétaires.
- [ ] Supprimer les totaux secondaires et fallbacks (`montantHt`, zéro ou statut voisin) qui créent les divergences observées.
- [ ] Appliquer les formules et l'état « non disponible » lorsque le dénominateur ou la source manque.
- [ ] Faire remonter le statut réel du chantier sur chaque lecture, notamment la page budget.
- [ ] Couvrir sérialisation, précision décimale et compatibilité des consommateurs avant retrait d'un ancien champ.

## Preuves attendues

- Tests API contractuels sur `737106.00`, `582600.00`, `154506.00` et `20,96 %` (arrondi d'affichage seulement).
- Test prouvant qu'une vente absente produit `NOT_AVAILABLE`/absence explicite et non `0`.
- Test de cohérence automatique entre endpoints liste, détail et budget pour le même chantier.
- Test statut : `EN_PREPARATION` reste identique dans tous les read models.

## Journal

```
26/08 12:17  posée
```

## Rapport de livraison

À compléter avec anciens champs retirés/conservés, preuves et impacts consommateurs.
