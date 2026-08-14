---
id: PLT-37
status: done-agent
context: nafura
type: tech
priority: P0
assignee: agent
gate: none
sprint: 2026-W33
---

# Figer l'intérieur d'un projet : sources/

> Un projet Pact a `sources/` pour le code qui tourne. Un seul `backend/` dedans. Gradle vit avec.

## Étapes

- [x] `NAFURALABS.md` : squelette figé (`sources/{backend,web,mobile,packages}` + méta)
- [x] `OPS_BLUEPRINT.md` · `RASTER_BLUEPRINT.md` · `PACT_BLUEPRINT.md` · `raster/AGENTS.md` : arbres alignés, pas de 2ᵉ règle

## Preuve de fin

Le canon dit la même chose partout. Pas de `services/` ni de `… source`.

## Journal

```
14/08 01:02  tsk1  NAFURALABS.md : sources/ parent · un backend · Gradle dans backend · pas de dossier vide. Démarrage cd sektor/sources/backend.
14/08 01:02  tsk2  OPS / RASTER / PACT / raster/AGENTS.md / CLAUDE.md pointent, ne recopient pas. Plus de services/ ni « … source ».

Livré : squelette figé — SSOT NAFURALABS.md § Intérieur
```
