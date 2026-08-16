---
id: PLT-77
status: done-agent
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [PLT-75, PLT-76]
tags: [platform, pact, documents]
---

# Appliquer le quota

> Couvre AC-1…AC-3 de [`CH.md`](../../../../../pact/documents/CH-05-EVOL-quota/CH.md).

## Étapes

- [x] `documents-quota-sous-plafond` — AC-1
- [x] `documents-quota-depasse` — AC-2
- [x] `documents-quota-dedup-passe` — AC-3

## Journal

```
15/08 22:58  orch · après PLT-75
16/08 03:10  tsk1 · quotaDepasse rouge (pas de StorageQuotaExceeded)
16/08 03:12  tsk2 · DocumentQuotaPolicy + R-8 pièce et original · code STORAGE_QUOTA_EXCEEDED
16/08 03:13  tsk3 · suite documents verte
```
