# BACKLOG (généré — ne pas éditer)

> Orchestrateur. Source canon = `<projet>/raster-src/lots/…`.
> Arbre = **le chemin** (lot / sous-lot / tasks) — pas un champ `parent:`.
> Lot et sous-lot sont des **dossiers** : leur état est dérivé, jamais stocké.
> Regen : `node raster/regen.mjs` / `node raster/t.mjs index`.
> Inbox : `raster/inbox.md`.

## sektor

- `chantiers` lot
  - · `arbre-et-conversion` sous-lot
    - ◐ `SEKTOR-183` bug — UI chantiers — EN_PREPARATION et dates contra…
  - · `avancement-et-attachement` sous-lot
    - ◐ `SEKTOR-187` bug — Exposer la chaîne Arbre → Avancement → Attach…
  - · `budget-et-marge` sous-lot
    - ◐ `SEKTOR-185` bug — Réconcilier les montants chantier sur une seu…
  - · `planning-activites` sous-lot
    - ◐ `SEKTOR-176` feature — Domaine et API activités — WBS zone précédenc…
    - ◐ `SEKTOR-177` feature — Avancement activité — remontée nœud et couver…
    - ◐ `SEKTOR-178` feature — Front Gantt activités — remplace coquille phases
    - ◐ `SEKTOR-179` feature — Workspace Gantt — créer et éditer l'activité …
    - ◐ `SEKTOR-180` feature — Drawer rattachement picker et avancement quan…
    - ◐ `SEKTOR-184` bug — Supprimer l'onglet Phases et unifier le plann…
  - · `situation-et-retenues` sous-lot
    - ◐ `SEKTOR-186` bug — Autoriser la situation sans marché depuis la …

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

**16 live · 2 projets**
