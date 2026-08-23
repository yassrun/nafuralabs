# Picker article partagé

> Un picker catalogue, trois pieds. Pas de dump. Filtres serveur. Extraire reste le chemin IA.
> **Pas de Pact.** Contrat [`CONTRAT.md`](CONTRAT.md) · journal [`DECISIONS-PRODUIT.md`](../../../DECISIONS-PRODUIT.md) § 23/08.

## Verdict

L’API d’abord : sans query serveur (nature / famille / usageLot / page), le front ne peut que re-filtrer une page. Le composant ensuite (DPU). Stock et lookups réutilisent le même geste.

## Constat

- `CatalogItemPickDialog` : `ngOnInit` → `getAll({ page: 1, pageSize: 40 })`. Seul consommateur : `poste-decomposition-panel`.
- Selects stock (`reception-lines-editor`, `retour-lines-editor`, `transfert-lines-editor`) : `ArticleCatalogService.loadArticles({ activeOnly: true })` — tout le catalogue.
- Lookups CRUD `lookupKey: 'items'` : tarifs, stock-balances, inventory-tx-lines.
- API `ItemService.searchPage` : `searchFields` code/name/sku/cleStable — **pas** de query nature / famille / usageLot. Listing articles a les 3 filtres UI, filtrés **client**.

## Approche technique

Back `ItemService.searchPage` : params `q`, `nature`, `familleId` (arbre, parent → enfants), `usageLot`, `page` ; searchFields v1 = `code` + `name` ; sans q ≥ 2 et sans filtre → page vide. Front : un composant sous `catalogue/` (pas un dialog études). `CatalogItemPickDialog` devient consommateur. Pied DPU / stock / lookup. Lab : pas de dual-write.

## Tasks

| # | Task | blocked_by | // OK |
|---|------|------------|-------|
| 1 | SEKTOR-142 API recherche items serveur | SEKTOR-141 | — |
| 2 | SEKTOR-143 Picker partagé + DPU | 141, 142 | non |
| 3 | SEKTOR-144 Stock + lookups | 141, 143 | non |
| 4 | SEKTOR-145 Preuves | 142, 143, 144 | non |

`// OK` : 143 a besoin de 142 ; 144 a besoin du composant 143. Features `todo` jusqu’à approbation humaine de 141 (`gate: me`).

## Couverture

[`CONTRAT.md`](CONTRAT.md) **AC-1**…**AC-14**. Hors v1 (pas AC) : SKU/`cleStable` barre, filtre fournisseur, filtre unité, listing articles encore client.

## Décisions ouvertes

Aucune dans ce sous-lot — prêt après approbation canvas / contrat (SEKTOR-141).
