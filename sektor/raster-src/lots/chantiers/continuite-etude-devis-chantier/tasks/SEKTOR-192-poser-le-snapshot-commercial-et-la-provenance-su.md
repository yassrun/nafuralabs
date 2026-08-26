---
id: SEKTOR-192
status: todo
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-191]
tags: [etudes, chantiers, conversion, domain]
---

# Poser le snapshot commercial et la provenance sur le chantier

> Transmettre à la conversion une provenance commerciale immutable et un snapshot vente/coût cohérent. Le chantier devient autonome sans importer ni requêter le domaine Études.

Contrat : [`../CONTRAT.md`](../CONTRAT.md), AC-7 à AC-11, AC-17 et AC-18.

## Étapes

- [ ] Définir le DTO/port de conversion avec dossier, devis, numéro/version, date d'acceptation, vente initiale et coût initial.
- [ ] Persister sur le chantier les références source immutables et `montantVenteInitialHt`; ajouter le changelog et le seed lab nécessaires.
- [ ] Imposer avant création l'égalité entre attribution, total devis et somme future des vendus, ainsi que l'égalité du coût avec les nœuds copiés.
- [ ] Conserver les règles existantes : `GAGNE → CONVERTIE`, chantier `EN_PREPARATION`, aucun marché, aucun planning.
- [ ] Rendre la conversion idempotente et sûre face à deux requêtes concurrentes jusque dans l'arbre et le budget.
- [ ] Garder la création directe sans fausse provenance commerciale et sans dépendance à Études.

## Preuves attendues

- Tests d'architecture empêchant un import du domaine Études/Devis dans le cœur Chantiers.
- Test d'intégration exact : vente `737106.00`, coût `582600.00`, mêmes totaux dans le snapshot et les nœuds.
- Tests de refus avant toute écriture sur divergence de total ou hiérarchie non résolue.
- Test concurrence : deux appels retournent le même `chantierId`, un arbre et un budget uniques.
- Test création directe : références source absentes, jamais forgées.

## Journal

```
26/08 12:17  posée
```

## Rapport de livraison

À compléter avec schéma, frontières modifiées, preuves et dette explicite.
