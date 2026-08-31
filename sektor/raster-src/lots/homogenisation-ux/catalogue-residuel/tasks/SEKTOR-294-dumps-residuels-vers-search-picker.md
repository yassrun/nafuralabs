---
id: SEKTOR-294
status: review
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
tags: [homog, catalogue]
---

# dumps residuels vers search picker

> Couper dumps articles pour pickers ; garder article-picker / search existants.

## Étapes

- [x] inventory-tx-panel : retirer `loadArticles` / `articlesMatCons` dump
- [x] sortie.facade : plus de dump catalogue au ensureLookups ; resolve by id à la validation
- [x] article-picker-field : chrome `nf-button` (picker dialog inchangé)

## Journal

```
31/08 12:01  posée
31/08 12:02  status → doing
31/08 12:20  dumps article pickers nettoyés (facades faciles)
31/08 12:09  status → review
```

## Rapport de livraison

### Ce qui a changé

- `inventory-tx-panel.facade.ts` — `articlesMatCons: []` ; plus de `ArticleCatalogService.loadArticles` (lignes via `openCatalogItemPicker`).
- `sortie.facade.ts` — même principe ; validation chantier résout articles via `ItemsApiService.getById` (ids des lignes uniquement).
- `article-picker-field.component.ts` — trigger `nf-button` (search/picker inchangé).

### Preuves exécutées

- Grep : `loadArticles` absent de sortie + inventory-tx-panel.
- Line editors déjà sur `openCatalogItemPicker` / `searchPicker`.

### Décidé seul

- Pas de nouveau composant picker ; réutilisation patterns catalogue existants.

### Écarts / dette (résiduels)

- `ArticleCatalogService` / `erpLookup.items()` size 500 sans `q` — encore utilisé par **etat-stocks** enrichissement (pas un picker) ; hors coupe safe one-pass avec stock 5000 (exclu PLAN).
- Facades config (`uom`, `motifs`, `locations`, `costing-methods`, headers mouvement `pageSize: 500`) — pas des dumps articles pour pickers.
- `reception.facade` dump BC 500 — hors articles.
- `item-category` LIST_QUERY 500 — entity listing, non touché (consigne).
