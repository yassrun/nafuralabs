# Specs produit — epics Nafura

Convention **spec / epic** avant et pendant l’implémentation.
PM (tickets, sprint, status) reste dans [`pm/`](../../pm/AGENTS.md) — jamais ici.

## Arborescence cible (par app)

```
products/<app>/docs/
├── guides/                         # guides utilisateur / ops (plus tard)
├── transverse/                     # glossaire, conventions app (plus tard)
├── ux/
│   └── wireframes/                 # canvas VALIDÉS (Git)
└── specs/
    └── epics/
        ├── _archive/               # epics done
        └── <feature-slug>/
            ├── 00-PLAN.md          # obligatoire
            ├── 00-PROGRESS.md      # obligatoire
            ├── 00-ARCHITECTURE.md  # si le modèle change
            ├── 01-ADR-….md
            ├── 02-….md …
            └── ux/                 # WIP only
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
5. **UX WIP** = `epics/<slug>/ux/` ; **validé** → sync `docs/ux/wireframes/`.
6. Epic `done` → déplacer le dossier sous `specs/epics/_archive/`.

## Flux agent-first

```
Besoin → kind:feature (pm) + dossier epic
      → 00-PLAN (+ ADR / UX WIP)
      → kind:spec tranche
      → kind:task lots
      → 00-PROGRESS à chaque check progress
      → wireframes validés → docs/ux/wireframes/
      → archive epic + archive pm
```

## Anti-doublon

| Fichier | Contient | Ne contient pas |
|---------|----------|-----------------|
| `00-PLAN.md` | pourquoi, constat, cible, **ordre** des lots | status runtime, journal |
| `00-PROGRESS.md` | lot courant, tickets, next | roman métier |
| `01-ADR-….md` | options + décision | plan d’impl |
| `ux/` | notes UX WIP | canvas Git validé |
| `pm/…/tasks/` | AC, sprint, journal, status | copie intégrale du PLAN |

## Migration Sektor

Ancien chemin : `products/sektor-btp/docs/epics/`  
Nouveau : `products/sektor-btp/docs/specs/epics/`
