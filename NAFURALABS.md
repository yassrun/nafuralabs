# NafuraLabs

**Statut :** à remplir  
**Pact :** [`PACT_BLUEPRINT.md`](PACT_BLUEPRINT.md)  
**Raster :** [`RASTER_BLUEPRINT.md`](RASTER_BLUEPRINT.md)  
**Ops :** [`OPS_BLUEPRINT.md`](OPS_BLUEPRINT.md)

---

## Vision

<!-- Qui on est. Ce qu’on construit. Pour qui. -->

---

## Ambitions

<!-- Où on va. Ce qui compte. Ce qui ne compte pas. -->

---

## Le workspace — structure **to-be**

`nafuralabs/` = un dossier de **projets** (monorepo polyrepo-ready).  
Vision / ambitions : sections ci-dessus (à remplir).

### Règles

| Projet | `raster-src/` | `pact/` | `ops/` | `e2e/` |
|--------|---------------|---------|--------|--------|
| **Pact** (app ou site) | obligatoire | obligatoire | obligatoire | preuves des CH |
| **Raster-only** (compta, perso) | obligatoire | — | — | — |

- **`raster/`** = projet Raster (moteur INDEX/CLI + app), pas un dossier magique hors-projet.
- Pas de peer `ops/`, `platform/` SDK, `products/`.
- Hors-projet (pas des apps) : rien — infra/CLI vivent dans `nafura-platform/ops/`.

### Racine to-be

```text
nafuralabs/
├── NAFURALABS.md
├── PACT_BLUEPRINT.md
├── RASTER_BLUEPRINT.md
├── OPS_BLUEPRINT.md
│
├── raster/                      # projet Raster (Pact)
│   ├── raster-src/
│   ├── pact/
│   ├── ops/                     # deploy UI Raster seulement
│   ├── e2e/
│   ├── t.mjs  INDEX.tsv  …      # moteur
│   └── web/
│
├── nafura-platform/             # projet Platform (Pact)
│   ├── raster-src/              # PLT-*
│   ├── pact/                    # socle + BC Identity, Documents, Notifs…
│   ├── ops/                     # cluster, PG, Keycloak, Vault, MinIO, nlops, lifecycle
│   ├── e2e/
│   ├── services/
│   └── packages/                # contracts-* / client-* / ui-*
│
├── sektor/                      # projet ERP (Pact)
│   ├── raster-src/              # SEKTOR-*
│   ├── pact/                    # SPEC app + socle (rôles/matrice) + BCs
│   ├── ops/                     # overlay / images / ingress Sektor
│   ├── e2e/
│   ├── backend/
│   └── web/
│
├── venue-catalog/               # Pact
├── mbs-studio/                  # site → Pact + ops
├── corporate/
├── zenith/
│
├── compta/                      # Raster-only
│   └── raster-src/
├── perso/
│   └── raster-src/
│
└── nafuralabs-migration/        # Raster-only — programme strangler (temporaire)
    └── raster-src/              # MIG-*
```

### Intérieur d’un projet Pact (ex. sektor)

```text
sektor/
├── raster-src/lots/<lot>/CH-nn-EVOL-…/tasks/   # lot · sous-lot (= CH) · task
├── pact/
│   ├── SPEC.md                                 # carte socle + BCs
│   ├── socle/  SPEC.md + ux + CH…              # rôles + matrice
│   └── <bc>/   SPEC.md + ux + CH-00-INIT-…
├── ops/                                        # deploy cette app
├── e2e/                                        # par projet, pas par BC
└── … source
```

### As-is → to-be (strangler, pas `nafuralabsv2/`)

| Aujourd’hui | Demain |
|-------------|---------|
| `products/sektor-btp/` | `sektor/` |
| `platform/` + `tools/lifecycle` + `infra/` + `toolchain/ops` | `nafura-platform/` (+ `ops/`) |
| `products/raster/` | `raster/` (déjà le moteur à la racine — fusionner) |
| `marketing/corporate/` | `corporate/` |
| ~~`products/*/docs/specs/lots/`~~ **sorti du dépôt** | `<projet>/pact/` + `<projet>/raster-src/` — **Raster part du vide** |
### Ordre de migration

**Oui : `nafura-platform` → `sektor`.** Sektor consomme la platform ; l’ops lab (PG, IAM, nlops, lifecycle) **est** platform.

Ne pas mélanger dans la même tranche : **move de dossiers** vs **découplage libs → API/packages**.

| # | Tranche | Quoi | Pas |
|---|---------|------|-----|
| 0 | Squelettes | Créer `nafura-platform/{raster-src,pact,ops}` et `sektor/{raster-src,pact,ops,e2e}` **vides** (canon). Walker `raster-src`. | git-mv du code |
| 1 | **nafura-platform** Pact | SPEC app + socle + BC Identity / Documents… (baseline `DISCOVERED` → `INIT`) | refactor conso |
| 2 | **nafura-platform** ops | `infra/` + `toolchain/ops` + `tools/lifecycle` → `nafura-platform/ops/` ; aliases `nlops` | casser `stg-up` |
| 3 | **nafura-platform** code | `platform/` → `nafura-platform/` (Gradle paths). Apps **pointent encore** `project(":platform:…")` un temps | packages Maven/npm |
| 4 | **sektor** Pact + Raster | **pacter** puis **raster** sektor — CADRE d'abord, SPEC par BC ensuite | rewrite ERP |
| 5 | **sektor** ops + code | `deploy/` → `sektor/ops/` ; `products/sektor-btp/` → `sektor/` | hybrid API platform |
| 6 | Conso platform | `PLATFORM_CONSUMED` + `client-*` versionnés ; drop path aliases | tout d’un coup |
| 7 | Reste | venue-catalog, sites, raster UI ; drop `products/` | |

**Interdit :** `nafuralabsv2/` · move Sektor avant que platform ait un `ops/` + un `pact/` lisibles · packages versionnés comme *premier* pas.

**Pact ou Raster ?** La **migration** = **Raster seul** (tasks, pas un BC). Pas de projet Pact « move ».  
Les tranches 1 et 4 (écrire les SPEC) = du **Pact sur le projet cible** (`nafura-platform`, `sektor`), pas un Pact de la migration.

Tickets du programme : `nafuralabs-migration/raster-src/` (`MIG-*`). Les SPEC s’écrivent ensuite **sur** les projets cibles (`PLT-*` / `SEKTOR-*`).

## Produits

<!-- Sektor, platform, sites, ops, … — une ligne chacun quand ce sera le moment. -->

---

## Notes

<!-- Libre. -->
