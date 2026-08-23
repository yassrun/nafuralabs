# BACKLOG (généré — ne pas éditer)

> Orchestrateur. Source canon = `<projet>/raster-src/lots/…`.
> Arbre = **le chemin** (lot / sous-lot / tasks) — pas un champ `parent:`.
> Lot et sous-lot sont des **dossiers** : leur état est dérivé, jamais stocké.
> Regen : `node raster/regen.mjs` / `node raster/t.mjs index`.
> Inbox : `raster/inbox.md`.

## sektor

- `chantiers` lot
  - · `arbre-et-conversion` sous-lot
    - · `SEKTOR-146` spec — CONTRAT — arbre vendu / interne et conversion…
    - · `SEKTOR-147` tech — Nœud vendu ou interne, avec lien retour vers …
    - · `SEKTOR-148` feature — Conversion GAGNE — chantier EN_PREPARATION, s…
    - · `SEKTOR-149` tech — Un seul écran chantier — supprimer le placeho…
    - · `SEKTOR-150` qa — Preuves — arbre vendu / interne et conversion
  - · `avancement-et-attachement` sous-lot
    - · `SEKTOR-151` spec — CONTRAT — avancement en quantité, une seule v…
    - · `SEKTOR-152` tech — AvancementPhysique — la quantité fait foi, le…
    - · `SEKTOR-153` feature — L'attachement lit les quantités de la période
    - · `SEKTOR-154` qa — Preuves — avancement puis attachement sans do…
  - · `budget-et-marge` sous-lot
    - · `SEKTOR-159` feature — Marge et valeur acquise par nœud
    - · `SEKTOR-160` qa — Preuves — marge par lot et valeur acquise
    - · `SEKTOR-161` spec — CONTRAT — budget par nœud, décomposé du DPU
    - · `SEKTOR-162` feature — Copier le déboursé du DPU sur les nœuds à la …
  - · `frontieres-bc` sous-lot
    - · `SEKTOR-163` spec — CONTRAT — frontières ST et pilotage
    - · `SEKTOR-164` tech — Contrat de sous-traitance typé côté Achats
    - · `SEKTOR-165` tech — Le pilotage portefeuille remonte au socle
    - · `SEKTOR-166` qa — Preuves — frontières tenues
  - · `situation-et-retenues` sous-lot
    - · `SEKTOR-155` spec — CONTRAT — décompte cumulatif et retenues
    - · `SEKTOR-156` feature — La situation se monte depuis les attachements…
    - · `SEKTOR-157` feature — Pénalités de retard et RAS dans les retenues
    - · `SEKTOR-158` qa — Preuves — décompte cumulatif jusqu'à la facture
- `etudes` lot
  - · `picker-article` sous-lot
    - ◐ `SEKTOR-142` feature — API recherche items serveur
    - ◐ `SEKTOR-143` feature — Picker article partagé et branchement DPU
    - ◐ `SEKTOR-144` feature — Picker stock et lookups items
    - · `SEKTOR-145` qa — Preuves picker article partagé

## raster

- `orchestration` lot
  - · `CH-02-EVOL-plan-et-session` sous-lot
    - · `RAS-107` spec — SPEC + geler AC — Plan, Session, front et amo…
    - · `RAS-108` tech — plan distingue clos, non decoupe, bloque et l…
    - · `RAS-109` feature — session start passe un brief sur stdin
    - · `RAS-110` qa — Preuves — une session lance et les statuts bo…
- `socle` lot
  - · `CH-04-EVOL-volets-plan-session` sous-lot
    - · `RAS-111` feature — Les deux volets — Plan et Session dans l'app
    - · `RAS-112` qa — Preuves — Plan et Session a l'ecran

---

**31 live · 2 projets**
