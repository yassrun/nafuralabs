---
id: ERP-49
status: done
context: nafura
kind: task
priority: P0
assignee: agent
gate: qa
parent: ERP-47
feature: etude-gates-ux
sprint: 2026-W33
tags: [sektor, etudes, bug, i18n]
---

# Bug — Messages gate affichés en clé i18n brute

> La bannière montre `etudes.gate.bordereau.code_duplique` au lieu d’un texte FR.
> Les clés `etudes.gate.*` sont absentes des bundles i18n front.

## Repro
1. Dossier DE-0001 · étape Bordereau avec gate active
2. Lire la bannière rouge sous le stepper

## Attendu / obtenu
- **Attendu** : message FR lisible (ex. « Code article en double »)
- **Obtenu** : clé brute `etudes.gate.bordereau.code_duplique` (idem `lot_vide`, `cout_unitaire_manquant`, `prix_absent`, …)

## Critères d'acceptation
- [x] Toutes les clés émises par `GatesEtude` (backend) ont une entrée FR (EN/AR si le module les charge)
- [x] Bannière + listes Synthèse / consultation affichent le libellé traduit
- [x] Aucune clé `etudes.gate.*` visible en UI sur DE-0001 (bordereau + coût + synthèse)

## Journal
```
11/08 11:25  QA Mode B DE-0001 OK · done (agent gate:qa)
11/08 11:06  capturé QA DE-0001 · i18n gates manquantes
```
