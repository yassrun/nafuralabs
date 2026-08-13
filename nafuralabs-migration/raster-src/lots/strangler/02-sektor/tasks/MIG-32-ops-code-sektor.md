---
id: MIG-32
status: todo
context: nafura
kind: task
type: physical
priority: P1
assignee: either
gate: me
parent: MIG-30
blocked_by: [MIG-31]
feature: sektor-move
tags: [sektor, ops]
---

# Ops + code → sektor/

> `deploy/` → `sektor/ops/` ; `products/sektor-btp/` → `sektor/`.
> Pas de bascule hybrid API platform dans cette task.

## Critères d'acceptation
- [ ] Overlay / images / ingress Sektor sous `sektor/ops/`
- [ ] Sources app sous `sektor/` (plus `products/sektor-btp/`)
- [ ] `stg-up` / Mode B QA encore verts

## Journal
```
13/08 12:10  task créée
```
