---
id: SEKTOR-201
status: todo
context: nafura
type: qa
agent_type: qa
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-197, SEKTOR-198, SEKTOR-199, SEKTOR-200]
tags: [qa, mode-b, chantiers, cockpit]
---

# Prouver le cockpit chantier par stade et par rôle en Mode B

> Exécuter le contrat cockpit en Mode B sur un portefeuille discriminant et rendre un verdict AC par AC, par stade, rôle et viewport. Aucun correctif produit dans cette task QA.

Contrat : [`../CONTRAT.md`](../CONTRAT.md), AC-1 à AC-22.

## Étapes

- [ ] Démarrer/vérifier Mode B et créer par API au moins 8 chantiers couvrant préparation, en cours, suspendu, terminé/clôturé, retard et marge négative.
- [ ] Prouver checklist et démarrage OS sur un chantier sans planning, puis avancement et flux de facturation.
- [ ] Vérifier KPI, alertes, priorité et prochaine action avec les valeurs discriminantes du contrat.
- [ ] Jouer portefeuille, filtres, tri, pagination et retour de fiche.
- [ ] Rejouer les vues/actions avec `owner`, `conducteur`, `chef-chantier`, `daf`.
- [ ] Vérifier desktop et 390 × 844, clavier, erreurs partielles et changement concurrent d'état.
- [ ] Consigner chaque AC en PASS/FAIL avec artefact; ouvrir une Task Raster par défaut confirmé.

## Preuves attendues

- Matrice explicite AC-1 à AC-22 avec URLs, rôles, données et captures.
- Traces API du read model, checklist, OS, alertes et actions ordonnées.
- Captures des quatre statuts structurants, des quatre rôles et du mobile.
- Preuve qu'un chantier sans planning est démarré puis avancé/facturé.
- `node raster/t.mjs check` et suites ciblées vertes; liste des limites de preuve.

## Journal

```
26/08 12:17  posée
```

## Rapport de livraison

À compléter par le QA avec verdict, artefacts, anomalies et risques résiduels.
