# Homogénéisation UX — Études · Achats · Catalogue · Chantiers

> Unifier composants `nf-*`, placement des actions (retour / save / create / delete) et filtres listing.
> Distinct de [`raffinement-ux-pro`](../raffinement-ux-pro/) (combobox / picker / entity lab — bouclé 28/08).

**Contrat lot :** [`CONTRAT.md`](CONTRAT.md) · canvas [`contrat-actions-et-filtres/ux/actions-et-filtres-wireframe.canvas.tsx`](contrat-actions-et-filtres/ux/actions-et-filtres-wireframe.canvas.tsx).

**Baseline mesurée 31/08** (avant ce lot) :

| Module | `<button>` | `<select>` | Notes |
|--------|----------:|----------:|-------|
| Études | 81 | 17 | régression vs vague juillet |
| Achats | 0 | 2 | quasi OK |
| Catalogue | 15 | 8 | partiel |
| Chantiers | 31 | 29 | documents-listing custom |

`nf-action-bar` / `nf-filter-bar` / `nf-tabs` / `nf-pagination` hors entity-listing : **0** dans les features.

## Sous-lots

| # | Sous-lot | Statut |
|---|----------|--------|
| 1 | [`contrat-actions-et-filtres`](contrat-actions-et-filtres/00-PLAN.md) | livré (CONTRAT + canvas + sticky action-bar) |
| 2 | [`etudes-chrome`](etudes-chrome/00-PLAN.md) | review (285–287) |
| 3 | [`chantiers-chrome`](chantiers-chrome/00-PLAN.md) | review (289–291) |
| 4 | [`catalogue-residuel`](catalogue-residuel/00-PLAN.md) | review (293–294) |
| 5 | [`achats-residuel`](achats-residuel/00-PLAN.md) | review (296) |
| 6 | [`preuves-homog`](preuves-homog/00-PLAN.md) | scripts verts (298) |

## Hors lot

- Marchés, Finance, RH, HSE, shell
- MatDialog → `nf-modal`
- Grilles `<input>` DPGF / mètres
- OT / fiche 360 GMAO, stock-balances pageSize 5000
