# Socle — lookup combobox

> Tout FK métier = combobox inline, recherche serveur ≥ 2 car., œil fiche. Fini le dump 200.

Contrat : [`CONTRAT.md`](CONTRAT.md) (AC-1…AC-14).
Canvas : [`ux/lookup-combobox-wireframe.canvas.tsx`](ux/lookup-combobox-wireframe.canvas.tsx).

## Verdict

L’atome d’abord (`nf-select` + `lookupKey` → combobox + carte fiche). Client / fournisseur ensuite. Puis sweep AC-12.

## Périmètre

**AC-11 :** client + fournisseur + chantier — devis, BC, contrat, création chantier, filtres situation/avancement, consultation create.

**AC-12 :** employé, dépôt, devis, facture, locations — `ERP_LOOKUP_LIST_ROUTES` + filtres listing.

Exclus : picker article (`etudes/picker-article`), enums natifs, CTA créer v2.

## Tasks

| # | Task | agent_type | blocked_by |
|---|------|------------|------------|
| 1 | SEKTOR-250 Contrat + canvas | spec | — |
| 2 | SEKTOR-251 Combobox anatomy + œil fiche | exec | 250 |
| 3 | SEKTOR-252 Client / fournisseur P0 | exec | 250, 251 |
| 4 | SEKTOR-253 Reste lookupKeys + filtres | exec | 250, 252 |
| 5 | SEKTOR-254 Preuves | qa | 251, 252, 253 |

## Preuves attendues

`verify-ux-pro-lookups-combobox.mjs` — scénarios CONTRAT : ouverture-vide, recherche-code-exact, clavier, oeil-fiche, oeil-liste-si-vide.

## Décisions ouvertes

Aucune — gel 23/08 repris tel quel.
