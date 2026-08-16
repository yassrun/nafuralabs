---
id: PLT-74
status: done-agent
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [PLT-73]
tags: [platform, pact, documents]
---

# Refuser au-delà de 50 Mio

> Pièce et original.
> Couvre AC-1…AC-3 de [`CH.md`](../../../../../pact/documents/CH-04-EVOL-taille-max/CH.md).

## Étapes

- [x] `documents-taille-max-accepte` — AC-1
- [x] `documents-taille-max-refuse-piece` — AC-2
- [x] `documents-taille-max-refuse-original` — AC-3

## Journal

```
15/08 22:58  orch · après spec taille-max
15/08 23:05  tsk1 · preuves d'abord : refuse-piece + refuse-original rouges (pas de PayloadTooLarge)
15/08 23:06  tsk2 · DocumentLimits 50 Mio · pièce + original · getSize puis octets
15/08 23:07  tsk3 · suite verte (taille-max + baseline + usage + octets + download)
```
