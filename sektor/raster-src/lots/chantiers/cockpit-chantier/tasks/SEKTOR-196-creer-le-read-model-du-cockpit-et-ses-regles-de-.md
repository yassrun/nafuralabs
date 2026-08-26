---
id: SEKTOR-196
status: todo
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: me
blocked_by: [SEKTOR-195]
tags: [api, chantiers, cockpit]
---

# Créer le read model du cockpit et ses règles de décision

> Livrer l'API de synthèse qui compose faits, checklist, alertes et prochaines actions sans nouvelle vérité stockée. Les règles et l'ordre sont testés côté serveur.

Contrat : [`../CONTRAT.md`](../CONTRAT.md), read model et AC-2 à AC-13, AC-22.

## Étapes

- [ ] Définir le DTO `cockpit` avec états de disponibilité, fraîcheur, sources, codes stables et permissions.
- [ ] Composer identité, provenance, calendrier, finance, avancement et flux mensuel depuis les agrégats propriétaires.
- [ ] Implémenter la checklist exacte d'AC-5, y compris planning non bloquant et création directe sans référence de vente.
- [ ] Implémenter alertes et priorité déterministe; documenter les seuils financiers/temps sans logique dupliquée au frontend.
- [ ] Produire une action primaire et au plus trois secondaires compatibles avec rôle et statut.
- [ ] Gérer absence, interdiction et indisponibilité partielle sans faux zéro ni valeur périmée.
- [ ] Vérifier les frontières de BC et la non-persistance des agrégats cockpit.

## Preuves attendues

- Tests domaine paramétrés sur tous les statuts chantier et chaque item de checklist.
- Tests de priorité avec plusieurs alertes simultanées et tie-break par ancienneté.
- Tests finance/date : marge négative, baisse de marge, date absente, jours restants et jours de retard.
- Tests RBAC sur les actions/données de `owner`, `conducteur`, `chef-chantier`, `daf`.
- Test d'architecture et contrat JSON documenté pour le frontend.

## Journal

```
26/08 12:17  posée
```

## Rapport de livraison

À compléter avec contrat API final, règles/seuils, commandes et écarts.
