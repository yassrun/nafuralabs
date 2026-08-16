---
id: PLT-80
status: done-agent
context: nafura
type: tech
agent_type: exec
priority: P2
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [PLT-78, PLT-79]
tags: [platform, pact, documents]
---

# Aligner le seau `documents`

> Couvre AC-1, AC-2 de [`CH.md`](../../../../../pact/documents/CH-06-TECHNICAL-seau/CH.md).

## Étapes

- [x] `documents-seau-config` — AC-1, AC-2

## Journal

```
15/08 22:58  orch · après PLT-78
16/08 03:08  tsk1 · documents-seau-config rouge (pas de app.storage.s3.bucket=documents ; init créait encore nafura-*)
16/08 03:10  tsk2 · un seau `documents` · pièces + originaux · init / vault / défaut Sektor
16/08 03:11  tsk3 · seau-config vert · suite existante verte
```

## Rapport de livraison

ce qui a changé      seau unique `documents` (config pièces + originaux, init MinIO, vault, défaut Sektor)
critères prouvés     AC-1, AC-2 → `documents-seau-config`
décidé seul          défaut Sektor `documents` (plus `nafura-erp`) ; média Venue inchangé
écarts / dette       unifier → CH-07 · créer le seau sur le MinIO déjà up (init au prochain deploy)

