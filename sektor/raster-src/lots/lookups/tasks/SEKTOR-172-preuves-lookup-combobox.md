---
id: SEKTOR-172
status: blocked
context: nafura
type: qa
agent_type: qa
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-169, SEKTOR-170, SEKTOR-171]
tags: [sektor, ux]
---

# Preuves lookup combobox

> Scénarios e2e nommés dans CONTRAT.md + état initial qa-local. Relier AC-1…AC-14.

## Étapes

- [x] Jouer les preuves livrées (`verify-lookup-combobox-{169,170,171}.mjs`). Scénarios navigateur qa-local non joués : aucun onglet Mode B.
- [x] Relier chaque **AC-1**…**AC-14** à une preuve exécutée.
- [x] Vérifier la discrimination (journaux exec rouge-avant + 170 réellement rouge).
- [x] Verdict **FAIL** ; pas de `done-agent`. 169 et 170 → `doing` ; 171 reste `review`.

## Journal

```
23/08 18:47  posée
23/08 20:28  status → doing
23/08 20:42  169.mjs PASS · 170.mjs FAIL (clients:/fournisseurs: absents de app.config) · 171.mjs PASS
23/08 20:42  FAIL — AC-5 sans assertion ; 170 rouge après extract 171
23/08 20:31  status → blocked
```

## Rapport de livraison

ce qui a changé      Combobox `nf-select` + searchers Sektor (clients/fournisseurs extraits dans `erp-lookup-searchers.ts`). Preuves = 3 scripts source, pas Playwright.
critères prouvés     AC-1/2/6/7/14 → 169.mjs PASS. AC-12/13 → 171.mjs PASS. **AC-3/4/9/10/11 → 170.mjs FAIL** (`LOOKUP_SEARCHERS missing clients/fournisseurs factories` : le script cherche `clients:` / `fournisseurs:` dans `app.config.ts` ; 171 a déplacé les factories, shorthand `clients,` / `fournisseurs,` dans `erp-lookup-searchers.ts`). **AC-5 FAIL trou** : `lookup-clavier` n’est pas dans 169.mjs (pas `onComboKeydown` / ↑↓ / Entrée / Échap). **AC-8 faible** : 169.mjs vérifie les libellés œil, pas « enum sans bouton » ; util spec AC-8 = route absente, non exécuté ici.
décidé seul          171 reste `review` (171.mjs VERT). 169 → `doing` (trou AC-5). 170 → `doing` (preuve rouge). QA n’a pas réécrit 170.mjs. Mode B : 0 onglet, pas de devis/BC live.
écarts / dette       `lookup-clavier` absent. 170.mjs figé sur `app.config` inline. Scénarios CONTRAT (seed ≥ 25, codes `CLI-…` / `FRN-…`) non joués à l’écran. Discrimination 169/171 = commentaires exec, pas rejouée sur checkout avant.
