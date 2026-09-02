---
id: SEKTOR-299
status: review
context: nafura
type: bug
agent_type: exec
priority: P0
assignee: agent
gate: none
tags: [homog, lookup]
---

# nf-select lookup freeze on typeahead

> Saisie dans un combobox lookup (ex. Famille article) fige l'écran : ngOnChanges relance le typeahead à chaque CD parent.

## Étapes

- [x] Couper le re-fire HTTP dans `nf-select.ngOnChanges` quand `lookupSearch` est bound
- [x] Stabiliser `options[]` et `lookupSearchFn` dans `nf-entity-detail`
- [x] Preuve `verify-lookup-combobox-299.mjs` + specs util

## Preuves attendues

- `node sektor/e2e/scripts/verify-lookup-combobox-299.mjs`
- Saisie ≥ 2 car. dans Famille (fiche article) : une requête lookup, pas de freeze, liste de hits

## Journal

```
01/09 10:50  posée
01/09 10:50  status → doing
01/09 10:56  fix nf-select + entity-detail ; preuve 299 OK ; front rebuilt
01/09 10:57  status → review
```

## Rapport de livraison

### Ce qui a changé

- `nf-select` ne relance plus le typeahead serveur quand le parent passe un nouveau `options[]` à chaque CD.
- `nf-entity-detail` réutilise le même tableau d'options et le même wrapper `lookupSearch` si le contenu n'a pas changé.
- `filterLookupHits` / commit blur tolèrent un label ou value manquant.

### Preuves exécutées

- `node sektor/e2e/scripts/verify-lookup-combobox-299.mjs` → OK
- Front Mode B recompilé (bundle 10:56)

### Décidé seul

- Root cause = boucle CD (`toNfSelectOptions` → `ngOnChanges` → HTTP → CD), pas l'API lookup (200).
- Garde dans le combobox (tous les écrans), pas seulement la fiche article.

### Écarts / dette

- Karma `--include` n'a pas chargé le spec platform (0 tests) ; la preuve Raster reste le script node.
- Pas de clic browser MCP sur la fiche article dans cette session.
