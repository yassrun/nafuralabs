# Cadre v1 — header, breadcrumbs, body

> Un composant `nf-screen` platform. Les cinq modules métier (catalogue, études, achats, ventes, chantiers) s’y calent. Les specials nommés restent hors v1.

Contrat : [`CONTRAT.md`](CONTRAT.md).
Canvas : [`ux/nf-screen-cadre-wireframe.canvas.tsx`](ux/nf-screen-cadre-wireframe.canvas.tsx).
Lot : [`../LOT.md`](../LOT.md).

## Intention

Quand ce sous-lot est livré, une route de ces modules n’assemble plus `nf-page-shell` + `nf-page-header` à la main. Elle pose `nf-screen` (titre, fil d’Ariane, body). Les onglets de fiche restent **dans** le body.

## Périmètre

Inclus :

- Composant `nf-screen` anatomy (compose shell + header existants).
- Fil toujours visible s’il y a `data.breadcrumb` (y compris listing).
- Helper / templates `ConfigDrivenListingPage`, `ConfigDrivenDetailPage`, `ConfigDrivenDashboardPage`, `ConfigDrivenMasterSlavePage`.
- Adoption : pages catalogue, études, achats, ventes, chantiers qui avaient déjà shell + header.
- Preuve Mode B owner (listing + fiche Achats, un listing Études, une fiche Chantiers).

Exclus :

- Dossier étude create/detail, budget, saisie avancement, magasin chantier, scanner, guest.
- Slot actions / tabs / footer d’écran (hors projection `[actions]` déjà portée par le header).
- Bouton retour header.
- Create dans le header.
- RH, finance, HSE, marchés, socle.

## Approche

Anatomy d’abord : le composant + une seule règle de crumbs (sortir le `length > 1` du listing). Ensuite le cadre sur les cinq modules. Les chips listing (Actifs / Comparateur) restent dans le **body** pour cette v1 ; les déplacer vers le filtre listing n’est pas le cadre.

Risque : homogenisation `AC-2` (create sur `nf-page-header`). Tranché : **AC-5** de ce contrat, create listing = toolbar `nf-entity-listing`.

## Tasks

| # | Task | agent_type | blocked_by |
|---|---|---|---|
| 1 | PLT-136 Plan + contrat + canvas cadre | spec | — |
| 2 | PLT-137 Composant `nf-screen` + fil listing | exec | 1 |
| 3 | PLT-138 Cadre sur les 5 modules + preuves | exec | 2 |

## Validation technique

Mode B owner : `make -C nafura-platform/ops mode-b`, `qa@nafuralabs.local`.

| Preuve | Couvre |
|--------|--------|
| Source : plus de `<nf-page-shell` / `<nf-page-header` dans les 5 modules | AC-1, AC-6 |
| UI listing `/achats/fournisseurs` : header + fil + tableau, create dans la toolbar listing | AC-3, AC-5 |
| UI fiche fournisseurs : onglets Contacts / Contrats sous le header, dans le body | AC-4 |
| UI listing Études + fiche Chantiers : même chrome `nf-screen` | AC-6 |

## Blocages extérieurs

Aucun. Mode B déjà en place.
