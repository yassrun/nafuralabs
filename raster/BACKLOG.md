# BACKLOG (généré — ne pas éditer)

> Orchestrateur. Source canon = `<projet>/raster-src/lots/…`.
> Arbre = **le chemin** (lot / sous-lot / tasks) — pas un champ `parent:`.
> Lot et sous-lot sont des **dossiers** : leur état est dérivé, jamais stocké.
> Sprint = champ `sprint:` sur la **task** seulement.
> Regen : `node raster/regen.mjs` / `node raster/t.mjs index`.
> Inbox : `raster/inbox.md`.

## sektor

- `monter-angular-22` lot
  - ✓ `SEKTOR-104` tech — Drop PrimeNG — nf-tree-table en mat-table
  - ✓ `SEKTOR-97` tech — Angular 21 → 22
- `plier-archi` lot
  - ✓ `domain-objets` sous-lot
    - ✓ `SEKTOR-102` tech — Ranger les objets domain par agrégat
  - ✓ `etudes-catalogue` sous-lot
    - ✓ `SEKTOR-100` tech — Études consomme catalogue.api seulement
    - ✓ `SEKTOR-101` tech — Garde : socle sans BC, Études hors item.*
    - ✓ `SEKTOR-99` tech — Catalogue publie api lookup + snapshot
  - ✓ `ports-adapters` sous-lot
    - ✓ `SEKTOR-105` tech — Ranger ports / adapters par exécuteur
  - ✓ `seeders` sous-lot
    - ✓ `SEKTOR-103` tech — Ranger les seeders dans `seeders/`
  - ✓ `socle` sous-lot
    - ✓ `SEKTOR-98` tech — Socle compile sans jars BC

## nafura-platform

- `document-reader` lot
  - ✓ `PLT-39` tech — Socle grille dans doc-extractor
  - ✓ `PLT-40` physical — Trancher O1 — cache de plans par tenant ou mu…
  - ✓ `PLT-41` feature — Plan, cascade, cache
  - ✓ `PLT-42` feature — Plan ↔ Definition
  - ◐ `PLT-43` feature — Carte des doutes
  - · `PLT-44` feature — Bascule vague 1 — liste puis arbre
  - ✓ `PLT-45` qa — QA — Plan, cascade, cache
  - ✓ `PLT-46` qa — QA — Plan ↔ Definition

---

**17 live · 2 projets**
