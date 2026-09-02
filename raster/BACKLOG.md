# BACKLOG (généré — ne pas éditer)

> Orchestrateur. Source canon = `<projet>/raster-src/lots/…`.
> Arbre = **le chemin** (lot / sous-lot / tasks) — pas un champ `parent:`.
> Lot et sous-lot sont des **dossiers** : leur état est dérivé, jamais stocké.
> Regen : `node raster/regen.mjs` / `node raster/t.mjs index`.
> Inbox : `raster/inbox.md`.

## sektor

- `consultation` lot
  - · `ux-listing-create-etude` sous-lot
    - ✓ `SEKTOR-306` spec — Consultation UX : CTA listing sans ++, filtre…
    - ◐ `SEKTOR-307` feature — Listing consultations : CTA sans ++, filtres …
    - ◐ `SEKTOR-308` feature — Create consultation : nf-action-bar, Créer in…
    - ◐ `SEKTOR-309` feature — Overlay étude : N destinataires, create panie…
    - · `SEKTOR-310` qa — Preuves listing create overlay RFQ
- `etudes` lot
  - · `raffinement-etude` sous-lot
    - ◐ `SEKTOR-303` feature — chrome etude: stepper etats + action bar
    - ◐ `SEKTOR-305` feature — Cadrage unique — revue CPS champ par champ
- `homogenisation-ux` lot
  - · `achats-residuel` sous-lot
    - ▸ `SEKTOR-296` feature — selects detail et bc-detail action-bar
    - · `SEKTOR-297` qa — Preuves homog achats
  - · `catalogue-residuel` sous-lot
    - ▸ `SEKTOR-293` feature — etat-stocks tree console line-editors nf-chrome
    - ◐ `SEKTOR-294` feature — dumps residuels vers search picker
    - · `SEKTOR-295` qa — Preuves homog catalogue
    - ◐ `SEKTOR-299` bug — nf-select lookup freeze on typeahead
    - ◐ `SEKTOR-300` feature — nf-select lookup clear X when value set
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
    - ◐ `SEKTOR-302` bug — Listing: double-clic ouvre le détail partout
    - ◐ `SEKTOR-304` bug — arbre bordereau icones lucide manquantes
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

**31 live · 2 projets**
