---
id: ERP-08
status: todo
context: nafura
kind: task
feature: etude-parcours
parent: ERP-17
priority: P1
assignee: me
gate: me
tags: [sektor, etudes, devis, versioning]
---


# Nouvelle version d'étude depuis une étude terminée (devis généré) — corrections

> Pouvoir repartir d'une étude **déjà terminée** (devis généré) pour créer une
> **nouvelle version** destinée aux corrections, sans tout resaisir.

## Critères d'acceptation
- [ ] Action explicite depuis une étude terminée / devis généré : « Nouvelle version » (ou équivalent)
- [ ] Nouvelle étude (ou version) créée, liée à la source (traçabilité parent → enfant)
- [ ] Données utiles reprises (structure chiffrage / postes / contexte) — périmètre copy à figer à l’impl
- [ ] L’étude source reste terminée / inchangée (historique conservé)
- [ ] La nouvelle version est éditable pour corrections jusqu’à regénération devis
- [ ] Fallback manuel : si copie partielle, l’utilisateur peut compléter à la main

## Journal
```
05/08 11:59  capturé depuis besoin produit (corrections post-devis)
05/08 21:30  framework v2 · task schema (estimate out · gate/kind)
```
