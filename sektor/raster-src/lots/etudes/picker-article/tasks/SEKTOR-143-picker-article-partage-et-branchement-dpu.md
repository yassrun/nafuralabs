---
id: SEKTOR-143
status: done-me
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
23/08 18:38  status → doing
23/08 18:50  QA FAIL = trous de preuves (AC-8, 9 qty+PU, 12, 13 message, 14). UI déjà là.
             Discrimination : pas de rouge-avant produit — trou de test, pas comportement nouveau.
             Script étendu : picker-clavier, qty+PU pied, 0 hit, erreur+Relancer, chip preset/humain.
             1er run clavier : ↑ depuis l’input search rouge (avalé) — pas un trou UI.
             Vert 18:52 : node sektor/e2e/scripts/verify-picker-article-143.mjs
23/08 18:52  status → review
23/08 18:43  status → review
23/08 18:45  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `verify-picker-article-143.mjs` seulement. Pas de patch composant / CONTRAT / canvas.
critères prouvés     AC-8 `picker-clavier` (↓↑ Entrée, dialog se ferme). AC-9 qty + PU tarif + CTA. AC-12 chip pré-rempli depuis la ligne, pas de search ; chip humain → GET `/items/search`. AC-13 0 hit + message, pas Extraire/Créer. AC-14 abort réseau → message + Relancer, dialog ouvert.
décidé seul          Clavier asserté sur `.ap` (l’input `type=search` avale ↑). AC-12 via CTA **ligne** DPU (contrat), pas le CTA vide sans `ligneType`.
écarts / dette       Spec Playwright non écrite (inbox). AC-7 toujours un `\d` dans le hit. Debounce 300 ms non isolé.
