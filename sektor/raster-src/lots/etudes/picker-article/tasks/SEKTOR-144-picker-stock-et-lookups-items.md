---
id: SEKTOR-144
status: review
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-141, SEKTOR-143]
tags: [sektor, ux, catalogue]
---

# Picker stock et lookups items

> Remplace selects réception/retour/transfert + lookups tarif/solde/items. Réf. CONTRAT AC-10 AC-11.

## Étapes

- [x] Brancher le picker partagé sur réception / retour / transfert (à la place des selects qui chargent tout). Contrat [`CONTRAT.md`](../CONTRAT.md) : **AC-10**.
- [x] Brancher tarif / solde / lookup `items` (même geste, pied article seul). **AC-11**.
- [x] Contexte stock : natures stockables seulement. Lookups : toutes natures, pick seul.
- [x] Preuve scénarios `picker-stock-natures-stockables` et `picker-lookup-article-seul`.

## Journal

```
23/08 17:31  posée
23/08 18:07  status → doing
23/08 18:51  VU ROUGE : node verify-picker-article-144.mjs
             dump GET /api/v1/items?page=0&size=500 à l’ouverture réception
23/08 18:55  picker stock réception/retour/transfert ; field lookup tarif/solde/tx-line
23/08 19:00  VU VERT : node sektor/e2e/scripts/verify-picker-article-144.mjs
             PASS stock natures stockables, lookup article seul, pas de dump
23/08 19:01  status → review
```

## Rapport de livraison

ce qui a changé      Selects réception/retour/transfert → picker `context:'stock'`. Tarif / solde / tx-line `itemId` → `app-article-picker-field` lookup. Plus de dump `GET /items` size 500 ni `/items/lookup` sur ces écrans.
critères prouvés     AC-10, AC-11 → `verify-picker-article-144.mjs` : rouge 18:51 (dump size 500) puis vert 19:00 (pas de dump, chips stockables, lookup toutes natures, pied Choisir). Browser Mode B réception + item-prices/new.
décidé seul          `articlesAll` réception vidé (plus de dump à l’ouverture). Facades retour/transfert ne chargent plus le catalogue pour un lookup mort. Champ partagé CVA plutôt que nf-select.
écarts / dette       Import BL réception : matching code à rebrancher sur `/search` (inbox). Sorties/pertes/inventaire/etat-stock encore `loadArticles` (inbox). Filtres listing stock-balances / tx-lines encore `lookupKey items` (inbox). Listing articles inchangé.
