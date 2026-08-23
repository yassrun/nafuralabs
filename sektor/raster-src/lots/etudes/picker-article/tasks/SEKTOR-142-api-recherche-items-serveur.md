---
id: SEKTOR-142
status: review
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-141]
tags: [sektor, ux, catalogue]
---

# API recherche items serveur

> q + nature + familleId + usageLot + page ; filtres serveur ; code+name ; min query ou filtre. Réf. CONTRAT AC-1 AC-2 AC-3 AC-5 AC-6.

## Étapes

- [x] Étendre la recherche items (q, nature, familleId, usageLot, page) — filtres **serveur**. Contrat [`CONTRAT.md`](../CONTRAT.md) : **AC-1**, **AC-2**, **AC-3**, **AC-5**, **AC-6**.
- [x] Refuser le dump : sans q ≥ 2 **et** sans filtre → page vide, pas de scan.
- [x] SearchFields v1 = `code` + `name` seulement ; code exact en tête. Famille parent → enfants.
- [x] Preuve unitaire / API du contrat (e2e nommé dans CONTRAT, implémenté ici ou avec 145).

## Journal

```
23/08 17:31  posée
23/08 17:35  status → doing
23/08 17:40  tsk1 baseline verify-picker-article-142.mjs
23/08 17:41  VU ROUGE : GET /api/v1/items/search → 500 INTERNAL_ERROR (/{id} « search »)
             search sans q 500 {"code":"INTERNAL_ERROR",...correlationId":"3a10033a-..."}
23/08 17:43  GET /search dédié + ItemService.searchPicker (code+name, exact first, famille parent→enfants)
23/08 17:44  ItemServiceTest : vide sans q/filtre, pas de scan repo
23/08 17:49  bootRun relancé (catalogue jar)
23/08 17:50  VU VERT : node sektor/e2e/scripts/verify-picker-article-142.mjs
             PASS search vide=0 exact=ART-P142-mt61lg4t nature=1 pageTotal=39
23/08 17:49  status → review
```

## Rapport de livraison

ce qui a changé      Surface `GET /api/v1/items/search` (ItemController + ItemService.searchPicker). Listing `GET /api/v1/items` inchangé. Index lab `009_items_picker_search_idx.sql`.
critères prouvés     AC-1,2,3,5,6 → `verify-picker-article-142.mjs` : rouge 17:41 (500 sur /search) puis vert 17:50 (vide=0, code exact en tête, nature/famille/usageLot serveur, page 0≠1, listing intact). Unitaires searchPicker sans scan.
décidé seul          Endpoint `/search` plutôt que d’override CrudController.list. Page 0-indexée Spring, size cap 50. `isActive` défaut true n’est pas un filtre déclencheur. Famille = self + enfants directs (`parent_id`).
écarts / dette       Index 009 pas joué par bootRun local (lifecycle hors process) — search OK sans. SKU/cleStable hors SearchFields (hors v1). `GET /lookup` inchangé jusqu’à 144.
