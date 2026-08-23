# Lookup combobox

> Un combobox anatomy, pas un picker. Œil → fiche si id, liste si vide. Client / fournisseur d’abord.
> **Pas de Pact.** Contrat [`CONTRAT.md`](CONTRAT.md) · journal [`DECISIONS-PRODUIT.md`](../../DECISIONS-PRODUIT.md) § 23/08 lookups.

## Verdict

L’atome d’abord (`nf-select` quand `lookupKey` d’entité) : sans combobox + carte fiche, le branchement Sektor ne fait que recoller des dumps. Client / fournisseur ensuite (la douleur). Le reste des clés et les filtres listing réutilisent le même geste.

## Constat

- `nf-select` = `<select>` HTML. Pas de champ de recherche. Œil si `lookupKey` + route **liste**.
- `nf-entity-detail` : `searchable: true` **opt-in**, filtre **local** d’un dump déjà chargé. BC / contrat fournisseur : pas le flag.
- Facades : `listByRole(..., { pageSize: 500 })` ou `partnersByRole` size 200. `ErpLookupService.partnersByRole(role, search)` existe, non branché sur la saisie.
- Œil : `LookupReferenceNavigationService.openListingInNewTab` — toujours la liste, jamais `/{id}`.
- `nf-form` et `nf-filter-bar` : pas d’œil.
- Picker article : **autre geste**, déjà gelé. Hors de ce lot (AC-13).

## Approche technique

Anatomy (`nafura-platform`) : `nf-select` + `lookupKey` d’entité → combobox (input + liste). Sans `lookupKey` / enum → select natif inchangé. Carte **fiche** à côté de `ERP_LOOKUP_LIST_ROUTES` (`/{id}`). Œil : id → fiche, vide → liste.

Sektor : plus de dump `pageSize: 500` sur ces champs. Debounce → `partnersByRole(role, q)` (et équivalents chantier / employé). Premiers écrans : devis, BC, contrat, chantier, facture vente. Puis les autres `lookupKey` de la carte + filtres listing.

Lab : pas de dual-write. Article = picker, pas ce combobox.

## Tasks

| # | Task | blocked_by | // OK |
|---|------|------------|-------|
| 1 | SEKTOR-168 Contrat + canvas | — | — |
| 2 | SEKTOR-169 Combobox anatomy + œil fiche | 168 | — |
| 3 | SEKTOR-170 Client / fournisseur (écrans) | 168, 169 | non |
| 4 | SEKTOR-171 Reste lookupKeys + filtres listing | 168, 170 | non |
| 5 | SEKTOR-172 Preuves | 169, 170, 171 | non |

`// OK` : 170 a besoin du contrôle 169. Features `todo` jusqu’à approbation humaine de 168 (`gate: me`).

## Couverture

[`CONTRAT.md`](CONTRAT.md) **AC-1**…**AC-14**. Hors v1 : CTA créer, ICE dédié, `partnerContacts`, picker article.

## Décisions ouvertes

Aucune dans ce lot — prêt après approbation canvas / contrat (SEKTOR-168).
