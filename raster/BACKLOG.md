# BACKLOG (généré — ne pas éditer)

> Orchestrateur. Source canon = `<projet>/raster-src/lots/…`.
> Arbre = **le chemin** (lot / sous-lot / tasks) — pas un champ `parent:`.
> Lot et sous-lot sont des **dossiers** : leur état est dérivé, jamais stocké.
> Regen : `node raster/regen.mjs` / `node raster/t.mjs index`.
> Inbox : `raster/inbox.md`.

## sektor

- `chantiers` lot
  - · `arbre-et-conversion` sous-lot
    - ◐ `SEKTOR-173` bug — Un sous-lot orphelin se place aussi devant l'…
  - · `planning-activites` sous-lot
    - ✕ `SEKTOR-175` spec — CONTRAT — planning activités (vague 2)
    - ◐ `SEKTOR-176` feature — Domaine et API activités — WBS zone précédenc…
    - ◐ `SEKTOR-177` feature — Avancement activité — remontée nœud et couver…
    - ◐ `SEKTOR-178` feature — Front Gantt activités — remplace coquille phases
    - ◐ `SEKTOR-179` feature — Workspace Gantt — créer et éditer l'activité …
    - ◐ `SEKTOR-180` feature — Drawer rattachement picker et avancement quan…
  - ✓ `raffinement-ux` sous-lot
    - ✓ `SEKTOR-182` spec — sektor chantiers : audit complet design, UX e…
- `etudes` lot
  - · `sync-approbation` sous-lot
    - ◐ `SEKTOR-181` bug — Validation Owner et conversion ferment la dem…
- `lookups` lot
  - ▸ `SEKTOR-169` feature — Combobox anatomy et œil fiche
  - ▸ `SEKTOR-170` feature — Client et fournisseur sur les écrans
  - ◐ `SEKTOR-171` feature — Reste lookupKeys et filtres listing
  - ✕ `SEKTOR-172` qa — Preuves lookup combobox

## raster

- `orchestration` lot
  - · `plan-et-session` sous-lot
    - · `RAS-107` spec — SPEC + geler AC — Plan, Session, front et amo…
    - · `RAS-108` tech — plan distingue clos, non decoupe, bloque et l…
    - · `RAS-109` feature — session start passe un brief sur stdin
    - · `RAS-110` qa — Preuves — une session lance et les statuts bo…
- `socle` lot
  - · `volets-plan-session` sous-lot
    - · `RAS-111` feature — Les deux volets — Plan et Session dans l'app
    - · `RAS-112` qa — Preuves — Plan et Session a l'ecran

---

**19 live · 2 projets**
