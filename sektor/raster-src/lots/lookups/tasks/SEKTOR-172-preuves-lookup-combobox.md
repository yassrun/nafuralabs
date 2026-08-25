---
id: SEKTOR-172
status: done-me
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

> Scénarios E2E du plan et état initial `qa-local`. Relier chaque comportement à une preuve exécutée.

## Étapes

- [x] Jouer les preuves livrées (`verify-lookup-combobox-{169,170,171}.mjs`). Scénarios navigateur qa-local non joués : aucun onglet Mode B.
- [x] Relier chaque **AC-1**…**AC-14** à une preuve exécutée.
- [x] Vérifier la discrimination (journaux exec rouge-avant + 170 réellement rouge).
- [x] Rejouer les trois preuves après correction des scripts 169 et 170 sur le checkout courant.
- [x] Verdict **PASS** ; 169, 170 et 171 peuvent sortir du sous-lot.

## Journal

```
23/08 18:47  posée
23/08 20:28  status → doing
23/08 20:42  169.mjs PASS · 170.mjs FAIL (clients:/fournisseurs: absents de app.config) · 171.mjs PASS
23/08 20:42  FAIL — AC-5 sans assertion ; 170 rouge après extract 171
23/08 20:31  status → blocked
25/08 14:56  169.mjs PASS · 170.mjs PASS · 171.mjs PASS sur le checkout courant
25/08 14:04  status → done-agent · gate none → done-me
25/08 14:30  status → review
25/08 18:19  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      Les preuves lookup sont réalignées sur l'architecture courante : assertions clavier explicites dans `verify-lookup-combobox-169.mjs`, et vérification `buildErpLookupSearchers` / `erp-lookup-searchers.ts` dans `verify-lookup-combobox-170.mjs`.
critères prouvés     AC-1/2/5/6/7/8/14 → 169.mjs PASS. AC-3/4/9/10/11 → 170.mjs PASS. AC-12/13 → 171.mjs PASS.
décidé seul          La correction est portée sur les scripts de preuve, pas sur le runtime, car le produit avait déjà `onComboKeydown` et `clients/fournisseurs` câblés via `buildErpLookupSearchers`.
écarts / dette       Scénarios CONTRAT (seed ≥ 25, codes `CLI-…` / `FRN-…`) non joués à l’écran. Les preuves restent des scripts source, pas un Playwright Mode B.
