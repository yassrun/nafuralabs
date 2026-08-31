# Plan — Raffinement UX pro (Chantiers · Achats · Catalogue)

## But livrable

Un conducteur / acheteur / magasinier ne voit plus d’écran « PFE » : plus de textarea `cle_stable`, plus de dump 200 partenaires, plus d’UUID article nu. Les parcours quotidiens (consultation, avancement, réception, mouvement stock) passent par combobox + picker + entity anatomy.

## Intention

Les lots fonctionnels (vie-de-chantier, consultation métier, situations Al Qods…) ont livré le **contrat API**. L’habillage Achats consultation et plusieurs coquilles Chantiers/Catalogue sont restés en **preuve labo**. Ce lot est le tour UX/design **avant** la vague chantiers v2 (planning, magasin).

## Périmètre

Inclus : sous-lots 1–6 du [`LOT.md`](LOT.md).

Exclus : finance, HSE, réception définitive, refonte visuelle globale (tokens/couleurs), mobile natif.

## Approche

1. **Spec** par sous-lot : contrat AC + wireframe `.canvas.tsx` si écran non trivial.
2. **Socle d’abord** (1 + 2 en parallèle) — sans combobox/picker, les écrans métier re-dumpent.
3. **Victoire visible** : consultation Achats (3) — pire écran utilisateur aujourd’hui.
4. **Ops chantier** (5) — alignement vie-de-chantier côté saisie.
5. **QA** indépendant par sous-lot ; agrégat final optionnel.

## Tasks

Découpage détaillé dans chaque sous-lot `00-PLAN.md`. Spec crée les Tasks via CLI au lancement de chaque sous-lot.

| Phase | Sous-lot | agent_type initial |
|-------|----------|-------------------|
| A | socle-lookups-combobox | spec → exec |
| A | picker-article (lot etudes) | spec → exec |
| B | achats-consultation-ux-pro | spec → exec → qa |
| C | achats-fournisseur-bc-ux | exec |
| C | cockpit-ux-pro | spec → exec → qa |
| C | chantiers-ops-coquilles | exec |
| D | catalogue-parc-et-lignes | spec → exec → qa |

## Preuves attendues

- Par sous-lot : script `sektor/e2e/scripts/verify-ux-pro-*.mjs`
- Consultation : picker visible sur create + libellé article (pas `ciment-cpj-45` textarea)
- Chantier avancement : combobox chantier (pas select dump)
- Catalogue perte : dialog picker (pas nf-select 500 lignes)
- `node raster/t.mjs check` sans erreur

## Décisions ouvertes

Aucune — repriorisation actée 28/08. Lookups sorti de `_archive` via sous-lot `socle-lookups-combobox` (CONTRAT inchangé).
