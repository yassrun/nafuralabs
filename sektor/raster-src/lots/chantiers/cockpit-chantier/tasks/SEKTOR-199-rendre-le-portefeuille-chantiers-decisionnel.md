---
id: SEKTOR-199
status: todo
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-196, SEKTOR-197]
tags: [web, chantiers, portefeuille]
---

# Rendre le portefeuille chantiers décisionnel

> Refondre la liste pour prioriser les chantiers à traiter avec les mêmes faits que le cockpit. Filtres, tri, pagination et retour de fiche conservent le contexte.

Contrat : [`../CONTRAT.md`](../CONTRAT.md), AC-2, AC-4, AC-18 et AC-19.

## Étapes

- [ ] Étendre le read model serveur de liste avec responsable, échéance/retard, KPI autorisés, alerte principale et prochaine action.
- [ ] Implémenter filtres serveur statut, sévérité, responsable, retard et marge négative; tris contractuels et pagination stable.
- [ ] Présenter les colonnes décisionnelles sans confondre vente/budget et sans afficher zéro pour absence/interdiction.
- [ ] Ouvrir fiche/action depuis une ligne et restaurer filtres, tri, page et position au retour.
- [ ] Prévoir état vide filtré, erreur et chargement sans effacer les critères actifs.
- [ ] Tester coût/requêtes pour éviter un N+1 sur les agrégats cockpit.

## Preuves attendues

- Tests API de chaque filtre/tri et combinaisons avec pagination déterministe.
- Test sécurité prouvant absence des colonnes/valeurs financières non autorisées.
- Parcours sur 8 chantiers discriminants : filtre → fiche → retour intact.
- Mesure/log de requêtes sur une page complète, sans N+1.

## Journal

```
26/08 12:17  posée
```

## Rapport de livraison

À compléter avec contrat liste, performances, captures et cas limites.
