# BACKLOG (généré — ne pas éditer)

> Orchestrateur. Source canon = `<projet>/raster-src/lots/…`.
> Arbre = **le chemin** (lot / sous-lot / tasks) — pas un champ `parent:`.
> Lot et sous-lot sont des **dossiers** : leur état est dérivé, jamais stocké.
> Sprint = champ `sprint:` sur la **task** seulement.
> Regen : `node raster/regen.mjs` / `node raster/t.mjs index`.
> Inbox : `raster/inbox.md`.

## nafura-platform

- `document-reader` lot
  - ✓ `PLT-39` tech — Socle grille dans doc-extractor
  - ✓ `PLT-40` physical — Trancher O1 — cache de plans par tenant ou mu…
  - ✓ `PLT-41` feature — Plan, cascade, cache
  - ✓ `PLT-42` feature — Plan ↔ Definition
  - ✓ `PLT-43` feature — Carte des doutes
  - ✓ `PLT-44` feature — Bascule vague 1 — liste puis arbre
  - ✓ `PLT-45` qa — QA — Plan, cascade, cache
  - ✓ `PLT-46` qa — QA — Plan ↔ Definition
  - ✓ `PLT-47` qa — QA — Carte des doutes
  - ✓ `PLT-48` qa — QA — Bascule vague 1
- `documents` lot
  - ✓ `CH-04-EVOL-taille-max` sous-lot
    - ✓ `PLT-73` spec — SPEC — taille max
    - ✓ `PLT-74` feature — Refuser au-delà de 50 Mio
    - ✓ `PLT-75` qa — QA — taille max
  - ✓ `CH-05-EVOL-quota` sous-lot
    - ✓ `PLT-76` spec — SPEC — quota
    - ✓ `PLT-77` feature — Appliquer le quota
    - ✓ `PLT-78` qa — QA — quota
  - ✓ `CH-06-TECHNICAL-seau` sous-lot
    - ✓ `PLT-79` spec — SPEC — un seau documents
    - ✓ `PLT-80` tech — Aligner le seau `documents`
  - ✓ `CH-07-EVOL-unifier` sous-lot
    - ✓ `PLT-82` spec — SPEC — unifier pièce et original
    - ✓ `PLT-83` feature — Unifier les deux formes
    - ✓ `PLT-84` qa — QA — unifier
  - ✓ `CH-08-TECHNICAL-plier` sous-lot
    - ✓ `PLT-89` spec — SPEC — plier documents
    - ✓ `PLT-90` tech — Plier l'arbre documents
- `impression` lot
  - ✓ `CH-00-INIT-impression` sous-lot
    - ✓ `PLT-86` spec — SPEC — INIT impression
    - ✓ `PLT-87` tech — Baseline impression
    - ✓ `PLT-88` qa — QA — INIT impression
  - ✓ `CH-01-TECHNICAL-plier` sous-lot
    - ✓ `PLT-91` spec — SPEC — plier impression
    - ✓ `PLT-92` tech — Plier l'arbre impression
- `socle` lot
  - ✓ `CH-04-EVOL-consommateur-impression` sous-lot
    - ✓ `PLT-85` spec — SPEC — consommateur impression

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

---

**38 live · 2 projets**
