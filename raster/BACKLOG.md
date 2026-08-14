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
  - ✓ `seeders` sous-lot
    - ✓ `SEKTOR-103` tech — Ranger les seeders dans `seeders/`
  - ✓ `socle` sous-lot
    - ✓ `SEKTOR-98` tech — Socle compile sans jars BC

---

**8 live · 1 projets**
