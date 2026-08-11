---
id: ERP-50
status: done
context: nafura
kind: task
priority: P1
assignee: agent
gate: qa
parent: ERP-47
feature: etude-gates-ux
sprint: 2026-W33
tags: [sektor, etudes, bug, ux]
---

# Bug — KPI Anomalies = somme toutes gates (401) non actionnable

> L’en-tête dossier affiche **Anomalies 401** (rouge) alors qu’on est en
> Bordereau avec ~37 points locaux. Le total mélange bordereau + coût + chiffrage
> (37+182+182). Non cliquable → panique sans diagnostic.

## Repro
1. DE-0001 après extraction, gates peuplées sur étapes 2/3/5
2. Lire KPI « Anomalies » dans `dossier-summary-header`

## Attendu / obtenu
- **Attendu** : compteur de l’étape courante (ou répartition par étape) + clic → focus gate / 1er problème
- **Obtenu** : total multi-étapes ; Total HT 0 MAD à côté → sensation dossier cassé

## Critères d'acceptation
- [x] KPI anomalies = problèmes **bloquants de l’étape UI courante** (ou breakdown clair 2 / 3 / 4)
- [x] Clic KPI → scroll bannière gate ou 1er nœud (si ERP-48 livré)
- [x] Pas d’affichage d’un total multi-étapes sans légende

## Journal
```
11/08 11:25  QA Mode B DE-0001 OK · done (agent gate:qa)
11/08 11:06  capturé QA DE-0001 · KPI 401 = 37+182+182
```
