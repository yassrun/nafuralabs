# Specs produit — lots Nafura

Convention **lot / sous-lot / task** + tickets Raster.  
Orchestrateur : [`raster/AGENTS.md`](../../raster/AGENTS.md) · miroir [`docs/Raster.md`](../Raster.md).

## Décisions figées (2026-08-12)

| Sujet | Choix |
|-------|--------|
| Tickets (canon) | `<projet>/raster-src/lots/<lot-slug>/…/tasks/` |
| Tickets (legacy) | `<projet>/raster/lots/` · `products/<app>/docs/specs/lots/…` |
| Inbox | **Globale** : `raster/inbox.md` (projet Raster) |
| IDs | Préfixe **par projet** (`SEKTOR`, `PLT`, `RAS`, `PER`, …) |
| Suivi runtime | Tickets uniquement — **pas** de `00-PROGRESS.md` obligatoire |
| `raster/` | **Projet** Raster (moteur INDEX / Sprint / CLI + `raster-src/`) |
| `<projet>/raster-src/` | Fichiers Raster du projet — **obligatoire** |
| `<projet>/pact/` | Pact — **si app ou site** |

## Arborescence (par app — canon)

```
<projet>/raster-src/                 # obligatoire
└── lots/
    ├── _backlog/tasks/
    ├── _archive/
    └── <lot-slug>/
        ├── tasks/
        │   └── {ID}-….md
        └── <sous-lot-slug>/         # optionnel ; si Pact = un CH
            ├── 00-PLAN.md
            └── tasks/
                └── {ID}-….md
```

Exemple : `raster/raster-src/lots/…` · `sektor/raster-src/lots/…`.  
Legacy encore valide en lecture : `products/<app>/docs/specs/lots/`.
Templates : [`templates/`](templates/).

**Pas** de dossier `epics/` ni `features/` — canon = `lots/` seulement.

## Briques

```
Lot (= chapitre d’app, kind:lot)          # draft tant que pas de task
  → Task+  type: feature | bug | physical  # seul item backlog / sprint
  → Sous-lot? → Task+                      # seulement si ≥ 2 flux indépendants
```

Critère sous-lot : [`raster/AGENTS.md`](../../raster/AGENTS.md) §0.2.

## Pack agent — créer un lot

1. `raster-src/lots/<lot-slug>/tasks/` : ticket `kind: lot`
2. Tasks directes (`parent:` = lot) **ou** sous-lots si ≥ 2 flux
3. Sous-lot : `raster-src/lots/<lot-slug>/<sous-lot-slug>/` + PLAN + tasks
4. `ux/` si UI
5. `node raster/t.mjs index`

**Ne pas** créer `00-PROGRESS.md` pour le suivi (les status sont sur les tasks).

## Flux

```
raster/inbox.md → promote → <projet>/raster-src/lots/…/tasks
                → commit sprint (tasks)
                → check progress (tickets)
                → archive produit (raster/lots/_archive)
```

## Anti-doublon

| Fichier | Contient | Ne contient pas |
|---------|----------|-----------------|
| `00-PLAN.md` | pourquoi, cible, découpage tasks / deps | status runtime, journal |
| `tasks/*.md` | AC, sprint, journal, status | roman PLAN |
| `ux/` | canvas SSOT | preview IDE |

## Legacy

Ancien stockage `raster/nafura/…/tasks/` — **lecture seule / migration**.  
Ancien `docs/specs/epics/` et `docs/specs/features/` → `docs/specs/lots/`.
