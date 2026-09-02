# Études chrome

> Remettre Études (dossiers + devis-from-dpgf) sur `nf-*` et le CONTRAT actions.

Contrat : [`../CONTRAT.md`](../CONTRAT.md) AC-1…AC-6, AC-12…AC-14.

## Intention

Plus de `creer__bouton`, `<mat-icon>`, deletes bruts, Annuler HTML sur le périmètre listé.

## Périmètre

Inclus : dossier-create, pieces-marche, bordereau-arbre, dossier-summary-header, poste-decomposition-panel, dialogs selects restants, devis-from-dpgf.
Exclus : MatDialog→nf-modal, grilles input DPGF, consultation-etude métier.

## Approche

Exec fichier par fichier ; grep gate en fin de sous-lot.

## Tasks

| # | Task | agent_type | blocked_by |
|---|------|------------|------------|
| 1 | dossier-create nf-action-bar + nf-button + nf-select | exec | CONTRAT spec |
| 2 | pieces / bordereau / summary / decomposition nf-* | exec | 1 |
| 3 | devis-from-dpgf + selects dialogs restants | exec | 2 |
| 4 | Preuves études | qa | 3 |
| 5 | arbre bordereau icônes Lucide manquantes | exec | — |

## Preuves attendues

`node sektor/e2e/scripts/verify-homog-etudes.mjs` — Mode B owner.

`node sektor/e2e/scripts/verify-arbre-icones-304.mjs` — chevrons Lucide, 0 icône manquante.
