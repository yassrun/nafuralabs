---
id: SEKTOR-195
status: todo
context: nafura
type: qa
agent_type: qa
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-191, SEKTOR-192, SEKTOR-193, SEKTOR-194]
tags: [qa, mode-b, etudes, chantiers]
---

# Prouver le contrat Étude Devis Chantier en Mode B

> Exécuter le contrat complet en Mode B sur un graphe créé par API et rendre un verdict AC par AC. Aucun correctif produit dans cette task QA.

Contrat : [`../CONTRAT.md`](../CONTRAT.md), AC-1 à AC-18.

## Étapes

- [ ] Démarrer/vérifier Mode B (`4200`, `8082`) et obtenir les sessions des alias requis sans dépendre d'un seed métier existant.
- [ ] Créer par API les devis/études/chantiers discriminants décrits dans les scénarios du contrat.
- [ ] Jouer gain nominal, mismatch attribution, marge négative `ingenieur` puis `dg`, conversion double/concurrente et création directe.
- [ ] Vérifier en navigateur les statuts, actions figées, libellés, valeurs et trois directions de navigation.
- [ ] Vérifier qu'aucun marché ni planning n'a été créé et que le chantier reste exploitable.
- [ ] Consigner pour chaque AC : PASS/FAIL, requête ou capture, valeur observée et anomalie reproductible.

## Preuves attendues

- Rapport couvrant explicitement AC-1 à AC-18, sans « validé globalement ».
- Captures Mode B des écrans Étude, Devis, liste chantier, détail et budget.
- Traces API des statuts, identifiants source, totaux exacts et idempotence.
- `node raster/t.mjs check` et suites ciblées vertes; tout FAIL crée une Task Raster distincte avant clôture.

## Journal

```
26/08 12:17  posée
```

## Rapport de livraison

À compléter par le QA avec matrice de verdict, artefacts, anomalies et limites de preuve.
