# Achats — fournisseur & BC UX

> Plus d’UUID article nu. Réception BC avec combobox dépôt.

Contrat : [`CONTRAT.md`](CONTRAT.md) (AC-1…AC-16).
Canvas : [`ux/fournisseur-bc-ux-wireframe.canvas.tsx`](ux/fournisseur-bc-ux-wireframe.canvas.tsx).
Lookups : [`../socle-lookups-combobox/CONTRAT.md`](../socle-lookups-combobox/CONTRAT.md) (**bouclé** — on branche).
Picker : [`../../etudes/picker-article/CONTRAT.md`](../../etudes/picker-article/CONTRAT.md) (**bouclé** — on branche).

## Intention

Quand ce sous-lot est livré : l’onglet Catalogue fournisseur affiche code + désignation et saisit l’article via `app-article-picker` (UOM en combobox) ; le comparateur ne demande plus d’UUID ; la réception inline BC utilise un combobox dépôt avec option vide = livraison directe chantier.

## Périmètre

Inclus :

- Fiche fournisseur onglet Catalogue — libellés + picker + UOM combobox (AC-1…AC-8).
- Comparateur — pick article, plus champ UUID (AC-9…AC-12).
- BC détail — réception inline, combobox locations (AC-13…AC-16).
- Script e2e `verify-ux-pro-fournisseur-bc.mjs`.

Exclus : onglet Attestations ; refonte listing/create fournisseur ; réception hors fiche BC.

## Approche

1. **SEKTOR-270 (exec, gate: me)** — catalogue fournisseur. Fichiers typiques : `fournisseur-detail.page.*`, services catalogue.
2. **SEKTOR-271 (exec)** — parallèle après gate 270 (ou série si orch serialise). Comparateur + réception BC. Fichiers : `comparateur-fournisseurs.page.*`, `bc-detail.page.*`.
3. **SEKTOR-272 (qa)** — scénarios CONTRAT ; verdict indépendant.

### Dépendances externes

| Sous-lot | Statut Spec | Effet |
|----------|-------------|--------|
| `socle-lookups-combobox` | **bouclé** | AC-5, AC-6, AC-13…AC-14 = branchement |
| `etudes/picker-article` | **bouclé** | AC-3, AC-10 = câblage `app-article-picker` |

Soft-note seulement — **pas** de `blocked_by` externe. Si picker absent : exec → `status: blocked` + Question.

Risque : `erpLookup.locations()` sans `q` rend `[]` (anti-dump). Le `<select>` actuel est déjà cassé / vide — la cible est le combobox, pas restaurer le dump.

## Tasks

| # | Task | agent_type | blocked_by | Scope AC |
|---|------|------------|------------|----------|
| 1 | SEKTOR-270 Catalogue fournisseur sans UUID | exec | — · `gate: me` | AC-1…AC-8 |
| 2 | SEKTOR-271 Comparateur + réception BC combobox | exec | — | AC-9…AC-16 |
| 3 | SEKTOR-272 Preuves fournisseur & BC UX | qa | 270, 271 | tous scénarios |

270 et 271 sont parallèles après approbation gate 270 (ou en série si orch serialise).

## Preuves attendues (SEKTOR-272)

Détail dans [`CONTRAT.md`](CONTRAT.md) § scénarios.

- `node sektor/e2e/scripts/verify-ux-pro-fournisseur-bc.mjs` — Mode B owner.
- Pas de clôture sur grep seul d’un symbole.
- Constat API : pas de GET `/api/v1/locations` sans `q` depuis l’ouverture réception.

## Décisions ouvertes

Aucune — picker vs combobox article déjà gelé 23/08 (article = picker). Soft-deps lookups + picker documentées.
