---

id: PLT-81
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P2
assignee: agent
gate: me
sprint: 2026-W33
tags: [platform, pact, cadre]
---

# Trancher : imprimer dans le CADRE ?

> A = owns « produire une page / un PDF » (contexte à pacter ensuite).
> B = reste au produit.
> Couvre [`CH.md`](../../../../../pact/CH-02-EVOL-imprimer/CH.md).

## Étapes

- [x] Toi : A
- [x] Spec : patcher le CADRE selon le choix

## Journal

```
15/08 22:58  spec · gate me · pas d'exec tant que le CADRE n'owns pas « imprimer »
16/08 03:19  toi · A
16/08 03:19  spec · CADRE owns impression · modèles métier = not_owns produit
```

## Rapport de livraison

ce qui a changé      CADRE : owns « produire une page ou un PDF » · not_owns modèles métier · vocabulaire Impression
critères prouvés     AC-1 A · AC-2 owns + templates au produit · revue humaine (toi : A)
décidé seul          pas de BC print maintenant (hors CH)
écarts / dette       pacter le contexte print quand tu le demandes · jar documents encore chargé
