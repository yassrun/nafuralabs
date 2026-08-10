# Specs produit — epics Nafura

Convention **spec / epic** avant et pendant l’implémentation.
PM (tickets, sprint, status) reste dans [`pm/`](../../pm/AGENTS.md) — jamais ici.

## Arborescence cible (par app)

```
products/<app>/docs/
├── guides/                         # guides utilisateur / ops (plus tard)
├── transverse/                     # glossaire, conventions app (plus tard)
├── ux/
│   ├── METHODE-CANVAS-WIREFRAMES.md
│   └── wireframes/                 # LEGACY redirect only — SSOT = epic/ux/
└── specs/
    └── epics/
        ├── _archive/
        └── <feature-slug>/
            ├── 00-PLAN.md
            ├── 00-PROGRESS.md
            ├── 00-ARCHITECTURE.md
            ├── 01-ADR-….md
            ├── 02-….md …
            └── ux/                 # SSOT canvas + notes WIP
                ├── <name>-wireframe.canvas.tsx
                └── notes.md
```

Templates : [`templates/`](templates/).

## Briques (rappel)

```
Platform → (core | lib | capabilities)
Application (`products/<app-id>/`)
  → app-shell / shared (transverse app)
  → Module (domaine)
    → Feature (= 1 dossier epic + `kind:feature` PM)
      → Spec / Task (PM)
```

- **Feature platform** (`platform/web/features/…`) = *capability* SDK — autre monde.
- **Feature produit** = parapluie backlog + dossier sous `docs/specs/epics/`.

## Règles

1. **1 epic folder = 1 `kind: feature` PM** — même `slug` / champ `feature:`.
2. **Tasks / sprint / status** uniquement dans `pm/…/tasks/`.
3. **Progress** = `00-PROGRESS.md` (tableau de bord). Pas de `JOURNAL.md` dans l’epic.
4. **Journal détaillé** = tickets PM (`## Journal` append-only).
5. **UX canvas SSOT** = `epics/<slug>/ux/*.canvas.tsx` ; preview = copie `~/.cursor/…/canvases/` (pas de 2ᵉ copie sous `docs/ux/wireframes/`).
6. Epic `done` → déplacer le dossier sous `specs/epics/_archive/`.

## Flux agent-first

```
Besoin → kind:feature (pm) + dossier epic
      → 00-PLAN (+ ADR / UX WIP)
      → kind:spec tranche
      → kind:task lots
      → 00-PROGRESS à chaque check progress
      → canvas dans epics/<slug>/ux/ (+ sync preview canvases/)
      → archive epic + archive pm
```

## Anti-doublon

| Fichier | Contient | Ne contient pas |
|---------|----------|-----------------|
| `00-PLAN.md` | pourquoi, constat, cible, **ordre** des lots | status runtime, journal |
| `00-PROGRESS.md` | lot courant, tickets, next | roman métier |
| `01-ADR-….md` | options + décision | plan d’impl |
| `ux/` | **SSOT** canvas `.canvas.tsx` + notes WIP | copie preview hors repo |
| `pm/…/tasks/` | AC, sprint, journal, status | copie intégrale du PLAN |

## Migration Sektor

Ancien chemin : `products/sektor-btp/docs/epics/`  
Nouveau : `products/sektor-btp/docs/specs/epics/`
