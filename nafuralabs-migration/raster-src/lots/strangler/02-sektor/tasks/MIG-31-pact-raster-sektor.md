---
id: MIG-31
status: todo
context: nafura
kind: task
type: feature
priority: P1
assignee: either
gate: me
parent: MIG-30
blocked_by: [MIG-23]
feature: sektor-pact
tags: [sektor, pact, raster]
---

# Pact + Raster → sektor/

> `docs/specs/lots` (et équivalent) → `sektor/pact/` + `sektor/raster-src/`.
> Mapping : lot Raster ← socle|BC ; sous-lot ← CH. Écrire les SPEC **sur** sektor.

## Critères d'acceptation
- [ ] Arbre Pact sektor (app + socle + BC existants, pas de nested BC)
- [ ] Tickets Raster sous `sektor/raster-src/lots/`
- [ ] Socle sektor : `PLATFORM_CONSUMED` (pas de BC Identity/docs locaux)

## Journal
```
13/08 12:10  task créée
```
