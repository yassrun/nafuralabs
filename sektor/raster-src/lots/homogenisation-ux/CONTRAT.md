# Contrat — Homogénéisation UX (actions · filtres · listing)

> Lot [`homogenisation-ux`](LOT.md). Ce fichier est le **seul ancrage QA** (`AC-n` gelés).
> Canvas : [`contrat-actions-et-filtres/ux/actions-et-filtres-wireframe.canvas.tsx`](contrat-actions-et-filtres/ux/actions-et-filtres-wireframe.canvas.tsx).
> Modules : **Études, Achats, Catalogue, Chantiers**. Pas Marchés.

**Qualification : EVOL.** La vague juillet (composants + placement) a régressé ; `raffinement-ux-pro` a poussé lookups/picker/entity sur une partie des écrans, pas le contrat d’actions.

Gelé le **31/08/2026**. Les tasks exec **référencent** `AC-n` ; elles ne les recopient pas.

---

## Intention

Même geste = même anatomy partout sur les 4 modules :

| Geste | Contrôle |
|-------|----------|
| Retour liste | `nf-button` ghost/secondary + `arrow-left` lucide, **haut** |
| Create listing | `nf-page-header` `primaryAction` (ou slot `[actions]`) |
| Save + Annuler | `nf-action-bar` bas ; **sticky** si form long |
| Delete | `nf-button variant="danger"` + `ConfirmDialogService` |
| Listing + filtres | `nf-entity-listing` + config ; FK = `lookupKey` combobox |

---

## Critères gelés — Actions

**AC-1 — Retour.** Tout retour vers la liste parent est un `nf-button` (ghost ou secondary) avec icône lucide `arrow-left`, placé en **haut** (header ou première rangée d’actions). Interdit : `link-button`, `linklike`, texte seul sans icône.

**AC-2 — Create listing.** Le CTA de création d’un listing est sur `nf-page-header` (`primaryAction` ou projection `actions`). Interdit : CTA primaire dans la barre de filtres ou en chips.

**AC-3 — Save + Annuler form court.** Formulaire create/edit court : `nf-action-bar align="right"` en bas — Annuler (secondary/ghost) à gauche du primary Save. Interdit : `creer__bouton`, `nav-actions` non sticky custom, `bc-rec-form__actions` maison.

**AC-4 — Save form long.** Formulaire / saisie longue (scroll) : `nf-action-bar` avec **sticky bas** (input `sticky` anatomy ou wrapper équivalent unique). Interdit : `saisie-page__sticky-bar`, sticky CSS ad hoc divergents.

**AC-5 — Delete.** Suppression = `nf-button variant="danger"` ; confirmation via `ConfirmDialogService`. Interdit : `<button class="danger">` brut, `window.confirm`.

**AC-6 — Ordre barre.** Dans une barre d’actions : ghost/secondary puis primary à **droite**. Danger isolé (pas collé au primary sans séparation).

---

## Critères gelés — Filtres / listing

**AC-7 — Listing entity.** Dès qu’un écran a colonnes + filtres et/ou pagination sur une collection CRUD : `nf-entity-listing` (config + facade). Interdit : `<table>` HTML + chips + `<select>` maison pour le même job (ex. documents-listing custom).

**AC-8 — Filtres FK.** Filtre ou champ dont la source est un référentiel potentiellement grand (`lookupKey` carte lookups) = combobox socle (contrat lookups). Interdit : dump `pageSize: 500` / `<select>` natif peuplé en masse.

**AC-9 — Filtres enum.** Liste bornée (statut, type, motif court) : `nf-select` **ou** `<select>` natif borné documenté. Pas de chips hors anatomy pour remplacer un filtre.

**AC-10 — Placement filtres.** Filtres **sous** le header, jamais mélangés au CTA create. Tabs de vue (`nf-tabs` si besoin) séparés des filtres.

**AC-11 — États.** Chargement / vide / erreur : patterns entity-listing ou `nf-empty-state` / loading / error. Pas de faux tableau à zéro lignes sans empty-state.

---

## Critères gelés — Composants bruts

**AC-12 — Boutons.** Sur le périmètre des sous-lots chrome : **0** `<button>` feature (hors exempt documenté : input file natif, carte cliquable sémantique documentée dans le rapport). Remplacer par `nf-button`.

**AC-13 — Selects.** Sur le périmètre chrome : **0** `<select>` hors enum AC-9 exempt nommé dans le rapport de livraison. Remplacer par `nf-select` ou combobox lookup.

**AC-14 — Icônes.** **0** `<mat-icon>` dans le périmètre études dossiers / chantiers documents ciblés. Remplacer par `nf-icon` / icône de `nf-button`.

---

## Baseline → cibles (grep modules)

| Module | Baseline button | Cible | Baseline select | Cible |
|--------|----------------:|------:|----------------:|------:|
| Études (dossiers + devis-from-dpgf) | élevé | ↓ forte, 0 sur fichiers listés chrome | élevé | 0 hors enum exempt |
| Chantiers (documents, listings, edit, saisie) | 31 | ↓ forte | 29 | ↓ forte |
| Catalogue (etat-stocks, tree, line-editors) | 15 | ↓ | 8 | ↓ |
| Achats (details ciblés) | 0 | 0 | 2 | 0 |

---

## Hors v1 (dette nommée, pas AC)

- Marchés
- MatDialog → `nf-modal`
- Tous les `<input>` grilles DPGF / mètres
- OT / fiche 360 GMAO
- Remplacement massif `chip-btn` hors écrans ciblés
