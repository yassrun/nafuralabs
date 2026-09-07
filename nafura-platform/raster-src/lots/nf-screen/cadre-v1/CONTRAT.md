# Contrat — nf-screen cadre v1

> Canvas : [`ux/nf-screen-cadre-wireframe.canvas.tsx`](ux/nf-screen-cadre-wireframe.canvas.tsx).
> Plan : [`00-PLAN.md`](00-PLAN.md).
> Lot : [`../LOT.md`](../LOT.md).

**Qualification : EVOL.** Chrome platform. Amende [`sektor/raster-src/lots/homogenisation-ux/CONTRAT.md`](../../../../../sektor/raster-src/lots/homogenisation-ux/CONTRAT.md) **AC-2** pour les écrans qui adoptent `nf-screen` : le create listing n’est **pas** dans le header d’écran.

Gelé le **04/09/2026**. Amendé le même jour : périmètre = cinq modules, plus un proto fournisseur seul.

---

## Grain

| Objet | Grain | Rôle |
|--------|--------|------|
| **App shell** | nav + tenant + module | Autour de la route |
| **nf-screen** | une route | Header + fil + body |
| **Archétype** | body du screen | listing / detail / dashboard / special |
| **Feature** | config métier | colonnes, champs, routes |

`nf-screen` n’est **pas** un `UxPatternType`. Il enveloppe. `listing` | `detail` | `dashboard` restent les patterns du body.

---

## Critères gelés

**AC-1 — Composition.** `nf-screen` est un composant anatomy. Il réutilise `nf-page-shell` + `nf-page-header`. Pas un deuxième header. Pas un wrapper CSS feature.

**AC-2 — Slots v1.** Uniquement : **header** (titre + sous-titre optionnel), **breadcrumbs**, **body**. Pas de tabs, pas de footer dans ce sous-lot. La projection `[actions]` du header existant reste possible (date, export) — ce n’est pas un slot d’écran nouveau.

**AC-3 — Fil.** Le fil oriente (parents). Interdit : un crumb qui répète le H1. Listing racine sans parent = pas de fil. Détail : parents visibles, le titre porte la page courante.

**AC-4 — Rien entre header et body.** Interdit : chips, KPI, `nav.tabs` maison **entre** le header et le body du screen. Onglets de fiche → dans le body. Filtres rapides → dans le body ou `nf-entity-listing`.

**AC-5 — Create listing.** Reste l’action `new` de `nf-entity-listing`. Pas `nf-page-header.primaryAction` sur un écran listing `nf-screen`.

**AC-6 — Cinq modules.** Catalogue, études, achats, ventes, chantiers : les pages qui composaient shell + header rendent via `nf-screen`. Preuve source (plus de `<nf-page-shell` / `<nf-page-header` dans ces dossiers) + Mode B owner (listing + fiche Achats, un listing Études, une fiche Chantiers).

**AC-7 — Scroll.** Un défaut platform unique, opt-in explicite. Listing : le tableau scrolle / pagine **dans** le body. Fiche : `scroll` d’écran si le formulaire dépasse. Pas un attribut posé au feeling par page.

---

## Hors v1

- Retour ghost `arrow-left` dans le header (fil = orientation).
- Pied `nf-action-bar` comme slot d’écran (reste dans le body detail).
- Dossier étude create/detail, budget, saisie avancement, magasin chantier, scanner, guest.
- RH, finance, HSE, marchés, socle.
- Déplacer les chips listing (Actifs / Comparateur) vers le panneau filtre.

---

## Scénarios e2e

Mode B owner.

| Scénario | Couvre | Preuve |
|----------|--------|--------|
| `screen-modules-source` | AC-1, AC-6 | grep 5 modules |
| `screen-fournisseur-listing` | AC-3, AC-5 | UI listing Achats |
| `screen-fournisseur-detail` | AC-4 | UI fiche (onglets dans le body) |
| `screen-etudes-chantiers` | AC-6 | UI listing Études + fiche Chantiers |
