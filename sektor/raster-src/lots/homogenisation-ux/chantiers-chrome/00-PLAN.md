# Chantiers chrome

> Documents, listings filtres, action-bar sticky edit/saisie — CONTRAT actions/filtres.

Contrat : [`../CONTRAT.md`](../CONTRAT.md) AC-1…AC-14.

## Intention

`documents-listing` n’est plus un clone custom ; portefeuille / attachements / journal / gantt utilisent `nf-select` ; edit et avancement-saisie utilisent `nf-action-bar` sticky.

## Périmètre

Inclus : documents-listing, chantiers-listing, attachement-listing, journal, gantt-toolbar, activite-drawer, lot-form-dialog, chantier-edit, avancement-saisie, chantier-lots-tab.
Exclus : refonte cockpit métier, MatDialog→nf-modal, planning métier.

## Tasks

| # | Task | agent_type | blocked_by |
|---|------|------------|------------|
| 1 | documents-listing rewrite nf-* | exec | CONTRAT spec |
| 2 | listings + toolbars selects → nf-select | exec | 1 |
| 3 | edit + avancement-saisie nf-action-bar sticky | exec | 1 |
| 4 | Preuves chantiers | qa | 2, 3 |

## Preuves attendues

`node sektor/e2e/scripts/verify-homog-chantiers.mjs` — Mode B owner.
