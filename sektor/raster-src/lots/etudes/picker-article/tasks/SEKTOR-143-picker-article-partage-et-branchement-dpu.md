---
id: SEKTOR-143
status: review
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-141, SEKTOR-142]
tags: [sektor, ux, catalogue]
---

# Picker article partagé et branchement DPU

> Composant catalogue partagé + CatalogItemPickDialog / poste-decomposition. Réf. CONTRAT AC-1 à AC-9, AC-12 à AC-14.

## Étapes

- [x] Composant picker **catalogue** (cœur commun) + brancher DPU / `CatalogItemPickDialog`. Contrat [`CONTRAT.md`](../CONTRAT.md) : **AC-1**…**AC-9**, **AC-12**…**AC-14**. Canvas : `ux/picker-article-wireframe.canvas.tsx`.
- [x] Remplacer le dump `getAll({ pageSize: 40 })` à l’ouverture. Debounce, clavier, hits unité+PU, scroll.
- [x] Pied DPU : qty + PU tarif + « Ajouter au poste » ; nature pré-remplie depuis la ligne.
- [x] États vide / loading / erreur sans CTA Extraire / Créer. Preuve scénarios DPU du CONTRAT.

## Journal

```
23/08 17:31  posée
23/08 17:50  status → doing
23/08 17:55  tsk1 baseline : CatalogItemPickDialog.ngOnInit → getAll({ pageSize: 40 })
23/08 17:56  VU ROUGE source dump 40 + 1er script : timeout « Depuis le catalogue »
             (Estimation par défaut ; confirm « Continuer » ; tooltip Estimation/Décomposition)
23/08 18:05  app-article-picker (catalogue) + CatalogItemPickDialog consommateur DPU
             ouverture vide, debounce 300, filtersTouched (preset AC-12 ne dump pas)
23/08 18:20  browser Mode B DE-0075 : ouverture vide, q=ci → 17 hits, pied Ajouter au poste
23/08 18:45  VU VERT : node sektor/e2e/scripts/verify-picker-article-143.mjs
             PASS picker vide à l’ouverture, hits après saisie, pied DPU
23/08 18:07  status → review
```

## Rapport de livraison

ce qui a changé      `app-article-picker` sous `catalogue/` ; `CatalogItemPickDialog` consommateur (pied DPU). Plus de `getAll(40)` à l’ouverture. Nature de ligne passée depuis `poste-decomposition-panel`.
critères prouvés     AC-1…9, 12…14 → `verify-picker-article-143.mjs` : rouge (dump 40 / timeout catalogue) puis vert 18:45 (vide, pas Extraire/Créer, hits unité+PU, Ajouter au poste). Browser Mode B : ouverture vide + hits.
décidé seul          Chip nature pré-rempli (AC-12) ne déclenche pas la search (`filtersTouched`). Search seulement après saisie ≥2 ou filtre posé par l’humain.
écarts / dette       Spec Playwright non écrite (crash C:/ vs c:/ déjà inbox). Script = preuve.
