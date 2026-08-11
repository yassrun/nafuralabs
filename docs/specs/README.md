# Specs produit — epics Nafura

Convention **spec / epic** + tickets Raster.  
Orchestrateur : [`raster/AGENTS.md`](../../raster/AGENTS.md) · miroir [`docs/Raster.md`](../Raster.md).

## Décisions figées (2026-08-11)

| Sujet | Choix |
|-------|--------|
| Tickets | `products/<app>/docs/specs/epics/<slug>/tasks/` |
| Inbox | **Globale** : `raster/inbox.md` (promote vers un projet) |
| IDs | Préfixe **par projet** (`ERP`, `RAS`, `PER`, …) |
| Suivi runtime | Tickets Raster uniquement — **pas** de `00-PROGRESS.md` obligatoire |
| Raster racine | Orchestrateur (INDEX / Sprint / Backlog) — **ne stocke pas** les tasks |

## Arborescence (par app)

```
products/<app>/docs/specs/
└── epics/
    ├── _backlog/tasks/           # triage / bugs isolés
    ├── _archive/
    └── <feature-slug>/
        ├── 00-PLAN.md            # obligatoire pour une feature
        ├── 00-ARCHITECTURE.md    # si besoin
        ├── 01-ADR-….md
        ├── ux/                   # wireframe si UI
        └── tasks/
            ├── {ID}-feature-….md
            └── {ID}-….md         # task | spec
```

Templates : [`templates/`](templates/).

## Briques

```
Feature (= 1 dossier epic + 1 ticket kind:feature)
  → Spec? (ADR)
  → Task+ (exécutables, parent: + blocked_by:)
```

## Pack agent — créer une epic

1. `epics/<slug>/00-PLAN.md` (cible + table des tasks + `blocked_by`)
2. `epics/<slug>/tasks/` : feature + N tasks
3. `ux/` si UI
4. `node raster/t.mjs index`

**Ne pas** créer `00-PROGRESS.md` pour le suivi (les status sont sur les tasks).

## Flux

```
raster/inbox.md → promote → products/<app>/…/epics/<slug>/tasks
                → commit sprint (tasks)
                → check progress (tickets)
                → archive produit
```

## Anti-doublon

| Fichier | Contient | Ne contient pas |
|---------|----------|-----------------|
| `00-PLAN.md` | pourquoi, cible, découpage tasks / deps | status runtime, journal |
| `tasks/*.md` | AC, sprint, journal, status | roman PLAN |
| `ux/` | canvas SSOT | preview IDE |

## Legacy

Ancien stockage `raster/nafura/…/tasks/` — **lecture seule / migration** ; nouvelles écritures = chemins ci-dessus.  
Ancien `docs/epics/` Sektor → `docs/specs/epics/`.
