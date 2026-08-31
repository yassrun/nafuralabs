# Catalogue — parc & lignes mouvement

> Perte / inventaire / sortie : picker stock, plus de dump catalogue. Emplacements : combobox socle. Parc GMAO MVP : pointage / pleins / affectation hors FormsModule UUID.

Contrat : [`CONTRAT.md`](CONTRAT.md) (AC-1…AC-17).
Canvas : [`ux/catalogue-parc-et-lignes-wireframe.canvas.tsx`](ux/catalogue-parc-et-lignes-wireframe.canvas.tsx).
Lookups : [`../socle-lookups-combobox/CONTRAT.md`](../socle-lookups-combobox/CONTRAT.md) — **bouclé 28/08** (soft dep).
Picker : [`../../etudes/picker-article/CONTRAT.md`](../../etudes/picker-article/CONTRAT.md) — **bouclé 28/08** (soft dep).

## Intention

Réception / retour / transfert ont le picker. Perte et inventaire dumpent encore via `ArticleCatalogService.loadArticles` dans les line editors. Les champs `lookupKey` emplacement sont soit vides (anti-dump non branché), soit d’anciens caches. Le parc GMAO saisit des UUID en texte.

Quand ce sous-lot est livré : magasinier choisit un article perte comme en réception ; filtre / fiche emplacement = combobox ; pointage engin + chantier = combobox.

## Périmètre

Inclus :

- `perte-lines-editor`, `inventaire-lines-editor` (+ sortie) → picker stock partagé (AC-1…AC-7).
- Filtres / champs emplacement perte & inventaire → combobox locations (AC-8…AC-12).
- Parc MVP : pointage, pleins carburant, affectation — combobox `materiels` + `chantiers` (AC-13…AC-17). Brancher `materiels` dans la carte lookup si absent.
- Script e2e `verify-ux-pro-catalogue-lignes.mjs`.

Exclus : `stock-balances` pageSize 5000, refonte arbre familles, entity-listing complet `materiel-parc/**`, homogénéisation cosmétique item-prices / inventory-tx-lines.

## Approche

1. **Spec** — geler CONTRAT + canvas (cette découpe, `gate: me`).
2. **Lignes** — aligner perte / inventaire / sortie sur le geste réception (`openCatalogItemPicker` / field, contexte stock) ; retirer `loadArticles` dump.
3. **Emplacements** — brancher combobox socle ; nettoyer facades (`chantierLocations: []`, dumps).
4. **Parc MVP** — pointage / pleins / affectation ; ajouter searcher `materiels` si besoin.
5. **QA** — scénarios CONTRAT ; Mode B owner (magasinier si besoin).

Risque : API materiels sans `q` typeahead — l’exec étend `ErpLookupService` / searchers, ne restaure pas un dump. Soft deps lookups/picker déjà done : **pas** de `blocked_by` externe.

## Tasks

| # | Task | agent_type | blocked_by | Scope AC |
|---|------|------------|------------|----------|
| 1 | SEKTOR-273 Plan + CONTRAT + canvas | spec | — · `gate: me` | gèle AC-1…17 |
| 2 | SEKTOR-274 Lignes perte/inventaire/sortie → picker | exec | 273 | AC-1…AC-7 |
| 3 | SEKTOR-275 Emplacements combobox perte/inventaire | exec | 273 | AC-8…AC-12 |
| 4 | SEKTOR-276 Parc GMAO MVP pointage/pleins/affectation | exec | 273 | AC-13…AC-17 |
| 5 | SEKTOR-277 Preuves catalogue lignes + parc | qa | 274, 275, 276 | tous scénarios |

274 / 275 / 276 parallèles après 273. (IDs 270–272 = sous-lot `achats-fournisseur-bc-ux`, pas ici.)

## Preuves attendues (SEKTOR-277)

Détail dans [`CONTRAT.md`](CONTRAT.md) § scénarios.

- `node sektor/e2e/scripts/verify-ux-pro-catalogue-lignes.mjs` — Mode B.
- Pas de clôture sur grep seul : au moins un parcours UI perte **ou** inventaire + un geste parc.
- API : locations / materiels avec `q ≥ 2` → hits ; pas de collection dump à l’ouverture champ.

## Décisions ouvertes

Aucune — picker vs combobox déjà gelé 23/08. Article = picker ; emplacement / engin / chantier = combobox.
