# Raffinement UX pro — Chantiers · Achats · Catalogue

> Passer des écrans **labo** (dump select, textarea `cle_stable`, coquilles HTML) à l’anatomie **pro** (entity-listing/detail, combobox FK, picker article).
> Modèle d’exécution : même esprit que `chantiers/vie-de-chantier` — tour du module, contrat, preuves e2e, pas de vert superficialiste.

**Journal produit :** [`DECISIONS-PRODUIT.md`](../../DECISIONS-PRODUIT.md) § picker 23/08 · § lookups 23/08.

**Statut lot : bouclé 28/08** — les 7 sous-lots sont livrés + prouvés.

## Constat (28/08 — après tour)

| Module | Déjà pro | Encore labo / hors v1 |
|--------|----------|------------------------|
| **Chantiers** | Situations, planning, cockpit, ops Équipe/ST/journal | — |
| **Achats** | DA, BC, AO, contrats, consultations, catalogue fournisseur, comparateur, réception dépôt | — |
| **Catalogue** | Articles, stock lines picker, locations combobox, parc MVP | OT / fiche 360 GMAO (hors v1) |

Leviers transverses livrés :

1. **Combobox lookup** — [`socle-lookups-combobox`](socle-lookups-combobox/00-PLAN.md)
2. **Picker article** — [`../etudes/picker-article/`](../etudes/picker-article/00-PLAN.md)

## Sous-lots

| # | Sous-lot | Statut |
|---|----------|--------|
| 1 | [`socle-lookups-combobox`](socle-lookups-combobox/00-PLAN.md) | **bouclé** |
| 2 | [`picker-article`](../etudes/picker-article/00-PLAN.md) | **bouclé** |
| 3 | [`achats-consultation-ux-pro`](achats-consultation-ux-pro/00-PLAN.md) | **bouclé** |
| 4 | [`achats-fournisseur-bc-ux`](achats-fournisseur-bc-ux/00-PLAN.md) | **bouclé** |
| 5 | [`cockpit-ux-pro`](cockpit-ux-pro/00-PLAN.md) | **bouclé** |
| 6 | [`chantiers-ops-coquilles`](chantiers-ops-coquilles/00-PLAN.md) | **bouclé** |
| 7 | [`catalogue-parc-et-lignes`](catalogue-parc-et-lignes/00-PLAN.md) | **bouclé** |

## Hors lot (dette nommée, pas ce cycle)

- Budget / documents chantier (dashboards custom P2)
- Attestations fournisseur (enum natif OK)
- Filtres listing articles côté client (P2)
- Planning chantier (déjà pro)
- Sorties / pertes / inventaire inventory-tx-panel residual dump (inbox)
- OT listing / fiche 360 GMAO

## Preuve globale

Chaque sous-lot : script e2e dédié (`verify-ux-pro-*.mjs` / `verify-picker-article-*.mjs`). Pas de clôture sur grep seul.
