# BACKLOG (généré — ne pas éditer)

> Orchestrateur. Source canon = `<projet>/raster-src/lots/…`.
> Arbre = **le chemin** (lot / sous-lot / tasks) — pas un champ `parent:`.
> Lot et sous-lot sont des **dossiers** : leur état est dérivé, jamais stocké.
> Regen : `node raster/regen.mjs` / `node raster/t.mjs index`.
> Inbox : `raster/inbox.md`.

## sektor

- `homogenisation-ux` lot
  - · `achats-residuel` sous-lot
    - ▸ `SEKTOR-296` feature — selects detail et bc-detail action-bar
    - · `SEKTOR-297` qa — Preuves homog achats
  - · `catalogue-residuel` sous-lot
    - ▸ `SEKTOR-293` feature — etat-stocks tree console line-editors nf-chrome
    - ◐ `SEKTOR-294` feature — dumps residuels vers search picker
    - · `SEKTOR-295` qa — Preuves homog catalogue
  - · `chantiers-chrome` sous-lot
    - ◐ `SEKTOR-289` feature — documents-listing rewrite nf-chrome
    - ◐ `SEKTOR-290` feature — listings et toolbars selects vers nf-select
    - ◐ `SEKTOR-291` feature — edit et avancement-saisie nf-action-bar sticky
    - · `SEKTOR-292` qa — Preuves homog chantiers
  - · `etudes-chrome` sous-lot
    - ▸ `SEKTOR-285` feature — dossier-create nf-action-bar nf-button nf-select
    - ◐ `SEKTOR-286` feature — pieces bordereau summary decomposition nf-chrome
    - ◐ `SEKTOR-287` feature — devis-from-dpgf et selects dialogs restants
    - · `SEKTOR-288` qa — Preuves homog etudes
  - · `preuves-homog` sous-lot
    - · `SEKTOR-298` qa — Scripts verify-homog Mode B et gates rg

## raster

- `orchestration` lot
  - · `plan-et-session` sous-lot
    - · `RAS-107` spec — Planifier les vues Plan, Session et l’amorçage
    - · `RAS-108` tech — plan distingue clos, non decoupe, bloque et l…
    - · `RAS-109` feature — session start passe un brief sur stdin
    - · `RAS-110` qa — Preuves — une session lance et les statuts bo…
- `socle` lot
  - · `volets-plan-session` sous-lot
    - · `RAS-111` feature — Les deux volets — Plan et Session dans l'app
    - · `RAS-112` qa — Preuves — Plan et Session a l'ecran

---

**20 live · 2 projets**
