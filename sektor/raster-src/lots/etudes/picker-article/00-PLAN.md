# Picker article partagé

> Un picker catalogue, trois pieds. Pas de dump. Filtres serveur. Extraire reste le chemin IA.

Contrat : [`CONTRAT.md`](CONTRAT.md) (AC-1…AC-14).
Canvas : [`ux/picker-article-wireframe.canvas.tsx`](ux/picker-article-wireframe.canvas.tsx).
Journal : [`DECISIONS-PRODUIT.md`](../../../DECISIONS-PRODUIT.md) § 23/08.

## Intention

Remplacer le dump catalogue (dialog DPU 40 items, selects stock full load, lookups `items`) par **une recherche serveur à la demande** et **un composant partagé** sous `catalogue/`, avec pied selon le contexte (DPU / stock / lookup).

## Périmètre

**Inclus**

- API `items/search` : `q`, `nature`, `familleId` (arbre, parent → enfants), `usageLot`, `page` ; sans `q ≥ 2` et sans filtre → page vide ; searchFields v1 = `code` + `name`.
- Composant picker partagé + câblage DPU (`CatalogItemPickDialog` consommateur ; CTA header « Ajouter depuis le catalogue »).
- Câblage réception / retour / transfert (natures stockables) + lookups CRUD `lookupKey: 'items'`.
- Preuves e2e Mode B couvrant AC-1…AC-14.

**Exclus (dette nommée, hors AC)**

- SKU / `cleStable` dans la barre
- Filtre fournisseur / unité
- Listing articles (`/inventory/catalogue/articles`) : filtres UI restent client

## Approche

1. **API d’abord** — sans query serveur, le front ne peut que re-filtrer une page.
2. **Picker + DPU** — cœur UI sous `catalogue/` (pas un dialog études).
3. **Stock + lookups** — réutilisent le même geste ; natures stockables en stock.
4. **QA agrégé** — scénarios CONTRAT ; graphe métier fabriqué dans la preuve.

Lab : pas de dual-write. Contrat et canvas déjà gelés — **pas de gate humaine** (`gate: none`).

## Tasks

| # | Task | agent_type | blocked_by |
|---|---|---|---|
| 1 | SEKTOR-259 API recherche items serveur | exec | — |
| 2 | SEKTOR-260 Picker partagé + DPU | exec | 259 |
| 3 | SEKTOR-261 Stock + lookups items | exec | 260 |
| 4 | SEKTOR-262 Preuves picker article | qa | 259, 260, 261 |

Chaîne : API → picker → stock ; QA en dernier.

## Preuves attendues

Script agrégé `sektor/e2e/scripts/verify-picker-article.mjs` (ou scripts ciblés par task, puis agrégat QA) sous Mode B (`make -C nafura-platform/ops mode-b`, owner `qa@nafuralabs.local`).

Scénarios CONTRAT : `picker-ouverture-vide`, `picker-recherche-code-exact`, `picker-filtres-serveur`, `picker-pagination`, `picker-dpu-ajouter-au-poste`, `picker-stock-natures-stockables`, `picker-lookup-article-seul`, `picker-aucun-resultat`, `picker-erreur-reseau`, `picker-clavier`.

État initial : tenant `qa-local` ; ≥ 30 articles actifs ; 2 familles (parent + enfant) ; natures distinctes (MATIERE, MAIN_DOEUVRE, autre stockable) ; 1 code exact `ART-…` ; ≥ 1 inactif ; assez de hits pour > 1 page.

## Décisions ouvertes

Aucune — contrat / canvas gelés 23/08. Anciennes refs SEKTOR-141…145 obsolètes ; découpe relancée 28/08 (SEKTOR-259…262).
