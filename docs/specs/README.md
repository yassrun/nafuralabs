# Specs produit — lots Nafura

Convention **lot / sous-lot / task** + tickets Raster.  
Orchestrateur : [`raster/AGENTS.md`](../../raster/AGENTS.md) · miroir [`docs/Raster.md`](../Raster.md).

## Décisions figées (2026-08-12)

| Sujet | Choix |
|-------|--------|
| Tickets | `products/<app>/docs/specs/lots/<lot-slug>/…/tasks/` |
| Inbox | **Globale** : `raster/inbox.md` (promote vers un projet) |
| IDs | Préfixe **par projet** (`ERP`, `RAS`, `PER`, …) |
| Suivi runtime | Tickets Raster uniquement — **pas** de `00-PROGRESS.md` obligatoire |
| Raster racine | Orchestrateur (INDEX / Sprint / Backlog) — **ne stocke pas** les tasks |

## Arborescence (par app)

```
products/<app>/docs/specs/
└── lots/
    ├── _backlog/tasks/              # triage orphelin
    ├── _archive/                    # flux terminés
    └── <lot-slug>/                  # chapitre (kind:lot)
        ├── tasks/
        │   └── {ID}-lot-….md
        └── <sous-lot-slug>/         # optionnel — ≥ 2 flux indépendants
            ├── 00-PLAN.md
            ├── ux/
            └── tasks/
                ├── {ID}-sous-lot-….md
                └── {ID}-….md        # task type: feature | bug | physical
```

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

1. `lots/<lot-slug>/tasks/` : ticket `kind: lot`
2. Tasks directes (`parent:` = lot) **ou** sous-lots si ≥ 2 flux
3. Sous-lot : `lots/<lot-slug>/<sous-lot-slug>/` + PLAN + tasks
4. `ux/` si UI
5. `node raster/t.mjs index`

**Ne pas** créer `00-PROGRESS.md` pour le suivi (les status sont sur les tasks).

## Flux

```
raster/inbox.md → promote → products/<app>/docs/specs/lots/…/tasks
                → commit sprint (tasks)
                → check progress (tickets)
                → archive produit (lots/_archive)
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
