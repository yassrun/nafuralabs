# NafuraLabs

**Statut :** à remplir  
**Pact :** [`PACT_BLUEPRINT.md`](PACT_BLUEPRINT.md)  
**Raster :** [`RASTER_BLUEPRINT.md`](RASTER_BLUEPRINT.md)  
**Ops :** [`OPS_BLUEPRINT.md`](OPS_BLUEPRINT.md)

Agents : [`raster/AGENTS.md`](raster/AGENTS.md) · Ops K8s : [`nafura-platform/ops/AGENTS.md`](nafura-platform/ops/AGENTS.md)

---

## Vision

<!-- Qui on est. Ce qu’on construit. Pour qui. -->

---

## Ambitions

<!-- Où on va. Ce qui compte. Ce qui ne compte pas. -->

---

## Démarrage rapide (staging)

```bash
make -C nafura-platform/ops stg-up SCOPE=full APP=sektor-btp
```

```bash
cd sektor/sources/backend
./gradlew :sektor:app:bootJar
cd ../web && npm run build:staging
```

Équivalent bas niveau :

```bash
BUILD_IMAGES=true KUBE_CONTEXT=docker-desktop ENV=staging \
  bash nafura-platform/ops/nlops.sh release-app sektor-btp
```

---

## Produits

| Produit | Chemin |
|---------|--------|
| Platform (SDK + infra lab) | [`nafura-platform/`](nafura-platform/) |
| Sektor BTP (ERP) | [`sektor/`](sektor/) |
| Venue Catalog | [`venue-catalog/`](venue-catalog/) |
| MBS Studio | [`mbs-studio/`](mbs-studio/) |
| Corporate | [`corporate/`](corporate/) |
| Raster | [`raster/`](raster/) |

Legacy `nf/nafura` — ne plus développer.

---

## Le workspace — structure **to-be**

`nafuralabs/` = un dossier de **projets** (monorepo polyrepo-ready).  
Vision / ambitions : sections ci-dessus (à remplir).

### Règles

Deux verbes : **raster** un projet (lui donner un endroit où le travail vit) · **pacter** un projet (lui donner un CADRE et les SPEC de ses contextes).
**On raster d'abord, on pacte ensuite** — pacter est du travail, et tout travail vit dans une task.

| Projet | `raster-src/` | `pact/` | `ops/` | `e2e/` |
|--------|---------------|---------|--------|--------|
| **rasté + pacté** (app ou site) | obligatoire | obligatoire | obligatoire | preuves des CH |
| **rasté seulement** (compta, perso) | obligatoire | — | — | — |

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
│   ├── t.mjs  INDEX.tsv  …      # moteur — pas dans sources/
│   └── sources/web/
│
├── nafura-platform/             # projet Platform (Pact)
│   ├── raster-src/              # PLT-*
│   ├── pact/                    # socle + BC Identity, Documents, Notifs…
│   ├── ops/                     # cluster, PG, Keycloak, Vault, MinIO, nlops, lifecycle
│   ├── e2e/
│   └── sources/
│       ├── backend/             # Gradle ici
│       ├── web/
│       └── packages/            # seulement s'il existe
│
├── sektor/                      # projet ERP (Pact)
│   ├── raster-src/              # SEKTOR-*
│   ├── pact/
│   ├── ops/
│   ├── e2e/
│   └── sources/
│       ├── backend/             # Gradle ici
│       └── web/
│
├── venue-catalog/               # Pact — même squelette
├── mbs-studio/                  # site → sources/web/ + ops/
├── corporate/
│
├── compta/                      # rasté seulement
│   └── raster-src/
└── perso/
    └── raster-src/
```

**Pas de projet « migration ».** Déplacer un projet, c'est du travail **sur ce projet** : les tasks vivent dans son propre `raster-src/`. Un programme transverse n'a pas de cible, donc pas de place dans le modèle.

**Hors dépôt** — `Desktop/nafuralabs-archives/` : projets en pause (`blanner`, `layali`, `beauty`, `usage-ops`, `build-intelligence`), docs historiques, canon obsolète. Git garde tout ; le disque reste léger pour les agents.

### Intérieur d’un projet Pact

Deux familles. **Méta** toujours les mêmes noms. **`sources/`** seulement les runtimes qui existent — pas de dossier vide.

```text
<projet>/
├── raster-src/                 # travail — toujours
├── pact/                       # contrat — si app ou site
├── ops/                        # deploy cette app
├── e2e/                        # preuves — par projet, pas par BC
└── sources/                    # code qui tourne
    ├── backend/                # Gradle ici. Un seul. Process (API, BFF, worker) = sous-dossiers
    ├── web/                    # package.json ici
    ├── mobile/                 # seulement s'il existe
    └── packages/               # libs — seulement s'il existe (surtout platform)
```

| Slot | Règle |
|------|--------|
| **`sources/`** | Parent des runtimes. Pas un peer de `backend/` à la racine. |
| **`backend/`** | Un par projet. Un 2ᵉ backend à la racine = autre CADRE = autre projet. |
| **Gradle** | Vit dans `sources/backend/` — comme `package.json` dans `sources/web/`. |
| **Absent** | Le projet n'a pas cette surface. Interdit : dossier vide « au cas où ». |
| **Dockerfile** | Racine du projet ou `ops/` — pas du source Java. |
| **`ops/lifecycle`** | Gradle à part (outil ops). Pas un `settings.gradle.kts` parapluie à la racine du projet. |

Un site (MBS, corporate) n'a que `sources/web/`. Raster : `sources/web/` + le moteur (`t.mjs`, …) à la racine du projet Raster.

Exemple Sektor :

```text
sektor/
├── raster-src/lots/<lot>/CH-nn-TYPE-…/tasks/
│                        └── 00-PLAN.md         # si ≥ 2 tasks exec
├── pact/
│   ├── CADRE.md
│   ├── CH-00-INIT-cadre/CH.md
│   ├── socle/  SPEC.md + ux + CH…
│   └── <bc>/   SPEC.md + ux + CH-nn-…
├── ops/
├── e2e/
└── sources/
    ├── backend/                # settings.gradle.kts · gradlew · app/ · modules/
    └── web/
```

Lot ← `CADRE` | socle | BC · sous-lot ← **CH** (nom identique des deux côtés) · task ← work.
Lot et sous-lot sont des **dossiers** : leur état se dérive, il ne se stocke pas.

### As-is → to-be (strangler, pas `nafuralabsv2/`)

| Aujourd’hui | Demain |
|-------------|---------|
| `sektor/` | `sektor/` |
| `platform/` + `tools/lifecycle` + `infra/` + `nafura-platform/ops` | `nafura-platform/` (+ `ops/`) |
| `raster/` | `raster/` (déjà le moteur à la racine — fusionner) |
| `corporate/` | `corporate/` |
| ~~`products/*/docs/specs/lots/`~~ **sorti du dépôt** | `<projet>/pact/` + `<projet>/raster-src/` — **Raster part du vide** |
| ~~`blanner`, `layali`, `beauty`, `usage-ops`, `build-intelligence`~~ | `Desktop/nafuralabs-archives/` — en pause, récupérables via Git |

### Ordre

**`nafura-platform` avant `sektor`.** Sektor consomme la platform, et son socle déclare des `PLATFORM_CONSUMED` qui pointent sur les BC de la platform : écrire Sektor d'abord, c'est déclarer consommer un contrat qui n'existe pas.

Ne pas mélanger dans la même tranche : **move de dossiers** vs **découplage libs → API/packages**.

| # | Tranche | Quoi | Pas |
|---|---------|------|-----|
| 0 | Squelettes | `nafura-platform/{raster-src,pact,ops}` et `sektor/{raster-src,pact,ops,e2e}` **vides** | git-mv du code |
| 1 | **raster** platform | son lot `cadre` + la task qui écrira le CADRE | pacter avant de raster |
| 2 | **pacter** platform | CADRE, puis SPEC **+ preuves** de chaque BC touché (`spec` + `tech` + `qa`) | tout baseliner d'un coup |
| 3 | platform ops | `infra/` + `nafura-platform/ops` + `tools/lifecycle` → `nafura-platform/ops/` | casser `stg-up` |
| 4 | platform code | `platform/` → `nafura-platform/`. Les apps pointent encore `:platform:…` un temps | packages Maven/npm |
| 5 | **raster** puis **pacter** sektor | CADRE d'abord — c'est lui qui décide du découpage en BC | rewrite ERP |
| 6 | sektor ops + code | `deploy/` → `sektor/ops/` ; `sektor/` → `sektor/` | hybrid API platform |
| 7 | Conso platform | `PLATFORM_CONSUMED` + `client-*` versionnés ; drop des alias de chemins | tout d'un coup |
| 8 | Reste | venue-catalog, sites, raster UI ; drop `products/` | |

**Un seul BC de bout en bout d'abord** (tranches 2 et 5) — celui sur lequel on allait travailler de toute façon. On sait en une semaine si la méthode tient, au lieu de le découvrir en six mois. « Toutes les SPEC » puis « toutes les QA » est un waterfall : il meurt au troisième BC.

**Interdit :** `nafuralabsv2/` · déplacer Sektor avant que platform ait un `ops/` et un `pact/` lisibles · les packages versionnés comme *premier* pas.

**Quelle nature de Change ?** Un déplacement de code qui ne change aucune règle est un **`TECHNICAL`** — et sa preuve est déjà la bonne : *la suite e2e existante reste verte*. D'où la règle : **on ne migre pas ce qu'on ne sait pas prouver.** La baseline (SPEC + preuves) est le prérequis, pas une option.

**Où vivent les tickets ?** Dans le `raster-src/` du **projet concerné** — `PLT-*` sur `nafura-platform`, `SEKTOR-*` sur `sektor`. Pas de projet « migration » : il n'aurait pas de cible.

---

## Notes

<!-- Libre. -->
