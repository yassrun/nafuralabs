# Achats résiduel

> Petits restes Achats déjà quasi pro.

Contrat : [`../CONTRAT.md`](../CONTRAT.md) AC-3, AC-13.

## Intention

0 `<select>` natif sur consultation-detail / attestation fournisseur ; BC détail utilise `nf-action-bar` ; plus de classes `btn btn--primary` sur `nf-button`.

## Périmètre

Inclus : consultation-detail, fournisseur-detail attestations/catalogue, bc-detail réception form, chip-btn hors entity si encore sur écrans ciblés.
Exclus : refonte listings Achats déjà entity.

## Tasks

| # | Task | agent_type | blocked_by |
|---|------|------------|------------|
| 1 | selects detail + bc-detail action-bar | exec | CONTRAT spec |
| 2 | Preuves achats | qa | 1 |

## Preuves attendues

`node sektor/e2e/scripts/verify-homog-achats.mjs` — Mode B owner.
