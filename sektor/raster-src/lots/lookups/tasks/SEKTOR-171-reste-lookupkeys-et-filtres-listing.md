---
id: SEKTOR-171
status: review
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-168, SEKTOR-170]
tags: [sektor, ux]
---

# Reste lookupKeys et filtres listing

> Tous les `lookupKey` de `ERP_LOOKUP_LIST_ROUTES` + filtres listing. Pas `items` / picker. Réf. CONTRAT AC-12 AC-13.

## Étapes

- [x] Remplacer les selects dump restants dont le `lookupKey` est dans `ERP_LOOKUP_LIST_ROUTES` (chantier, employé, dépôt, devis, facture, …) par le combobox 169. Contrat [`CONTRAT.md`](../CONTRAT.md) : **AC-12**.
- [x] Filtres listing : mêmes clés, même combobox (pas un natif de 500). Œil optionnel, mêmes règles fiche / liste.
- [x] `lookupKey: items` / picker article **inchangé**. **AC-13**.
- [x] Preuve scénario `lookup-filtre-listing`.

## Journal

```
23/08 18:47  posée
23/08 19:55  status → doing
23/08 20:40  tsk1 LOOKUP_SEARCHERS = toutes les clés ERP_LOOKUP_LIST_ROUTES sauf items
23/08 20:41  tsk2 nf-filter-builder : lookupKey (≠ items) → nf-select + lookupSearch
23/08 20:42  tsk3 dumps restants vidés (offre, bcc, avoir, facture, aoc, ao, demande, situation, paie, congé, article famille/uom, uomCategory, réception lookups, HSE chantier context)
23/08 20:43  tsk4 listing situations : nf-select chantier toujours visible ; préremplissage TVA/RG via getById
23/08 20:44  preuve verify-lookup-combobox-171.mjs VERT
             (discriminerait LOOKUP_SEARCHERS sans chantiers, filter-builder sans nf-select, dumps pageSize 500, listing situations caché si dump vide, picker items absent)
23/08 20:25  status → review
```

## Rapport de livraison

ce qui a changé      Tous les `lookupKey` de `ERP_LOOKUP_LIST_ROUTES` sauf `items` passent par le combobox 169 (typeahead ≥ 2 car., pas de dump à l'ouverture). Filtres listing (`nf-filter-builder`) : même contrôle. Listing situations : combobox chantier toujours visible. Préremplissage situation : GET chantier par id (défaut TVA 20 / RG 7 si échec).
critères prouvés     AC-12, AC-13 → `sektor/e2e/scripts/verify-lookup-combobox-171.mjs` VERT. Scénario `lookup-filtre-listing`. Discrimination : searchers sans `chantiers` / filter-builder sans `nf-select` / dump `pageSize: 500` / listing caché si options vides ferait échouer le script. Picker article inchangé.
décidé seul          Préremplissage situation : GET chantier par id, fallback TVA 20 % / RG 7 % si échec. `conditionPaiementType` / `ouvrageCategory` / `tauxChangeSource` ont un searcher (payment-terms / ouvrages / devises) donc combobox listing comme les autres clés. Convertisseur taux de change : GET devises conservé pour le widget, `deviseCode` du combobox reste vide. Avancement : `ensureBaseData` dump encore les chantiers pour l'espace de saisie (pas le filtre listing). Réception : cache locations pour libellés de lignes, lookups combobox vides.
écarts / dette       GET collections encore présents hors combobox : cache noms de dépôts (mouvements), convertisseur devises, workspace avancement. Hors AC-12.

