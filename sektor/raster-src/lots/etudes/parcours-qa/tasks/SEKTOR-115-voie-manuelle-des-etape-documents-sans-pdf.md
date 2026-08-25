---
id: SEKTOR-115
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: none
tags: [etudes, qa-parcours]
---

# Voie manuelle des etape Documents sans PDF

> Sans BDP+CPS, Continuer reste bloque, le stepper refuse de sauter, Corriger le bordereau no-op, Manuel n existe qu a letape 2. Fallback manuel des letape 1.

Contrat : [`DECISIONS-PRODUIT.md`](../../../../DECISIONS-PRODUIT.md) — AI-first, **manuel en fallback**. Raster autonome.

## Étapes

- [x] Étape 1 Documents : CTA explicite « Bordereau manuel » (ou équivalent) qui appelle `init-bordereau-manuel` **sans** exiger BDP+CPS uploadés.
- [x] Après init, Continuer vers le bordereau (étape 2) est possible ; le stepper n’interdit plus `ui > maxUi` pour cette voie.
- [x] « Corriger le bordereau » à l’étape 1 n’est plus un no-op (soit il initie Manuel, soit il disparaît jusqu’à ce qu’un DPGF existe).
- [x] Preuve e2e : créer un dossier QA **sans PDF**, initier le bordereau à la main, arriver à l’étape 2 avec un arbre éditable. Vu rouge avant le correctif.

## Journal

```
20/08 21:12  posée
20/08 21:30  status → doing
20/08 21:32  e2e rouge : bouton Bordereau manuel absent
20/08 21:36  e2e vert : parcours-qa-voie-manuelle.spec.ts
20/08 21:33  status → review
20/08 21:40  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      Étape Documents : CTA « Bordereau manuel » → `init-bordereau-manuel`. Gate 1 passe si DPGF déjà là. Stepper autorise l’étape 2. « Corriger le bordereau » initie le DPGF si besoin.
critères prouvés     Dossier sans PDF → CTA → Continuer → arbre « Ajouter un lot ». Vu rouge (CTA absent), vert après.
décidé seul          Gate documents : `dpgfId` présent = BDP+CPS optionnels (voie manuelle). Pas de nouvel endpoint.
écarts / dette       Restart bootRun local pour charger le Java. Autres slots obligatoires (hors BDP/CPS) restent bloquants.
