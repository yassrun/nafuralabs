# Web — suivre l’arbre backend

> `app/<nom>` = `backend/<nom>`. Plus d’`inventory/`. bibliotheque-prix dans catalogue.

## Verdict

Le web doit coller à la cible figée, pas à l’historique nafgen.

## Constat

`app/inventory/` + `app/catalogue/` + `etudes/bibliotheque-prix`. `approbations/`, `analytics/`, `pilotage/`, `pilotage-analyses/` encore hors socle. Fournisseurs déjà sous `achats/`, clients sous `ventes/`.

## Approche technique

Moves + retarget imports/routes. Pas de rewrite UI. Doublons uom : fusionner **dans** catalogue si les deux dossiers bougent ensemble ; ne pas inventer un 3ᵉ nom.

## Tasks

| # | Task | blocked_by | // OK |
|---|------|------------|-------|
| 1 | SEKTOR-92 tout vers `app/catalogue/` | — | — |
| 2 | SEKTOR-93 socle (approbations, pilotage*) + build:dev | SEKTOR-92 | non |

## Couverture

Pas de CH. Preuve = `npm run build:dev`. Parallèle au sous-lot backend.

## Décisions ouvertes

Aucune — `DECISIONS.md`.
