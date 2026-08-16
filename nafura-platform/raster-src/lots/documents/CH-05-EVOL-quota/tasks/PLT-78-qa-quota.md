---
id: PLT-78
status: done-agent
context: nafura
type: qa
agent_type: qa
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [PLT-77]
tags: [platform, pact, documents]
---

# QA — quota

> Preuves gelées du [`CH.md`](../../../../../pact/documents/CH-05-EVOL-quota/CH.md).

## Étapes

- [x] Rejouer les 3 scénarios quota
- [x] Rapport de livraison

## Journal

```
15/08 22:58  orch · après PLT-77 review
16/08 03:06  qa · 3/3 pass · discrimination : quotaDepasse vu rouge avant DocumentQuotaPolicy
```

## Rapport de livraison

ce qui a changé      plafond `documents.quota.bytes` · code `STORAGE_QUOTA_EXCEEDED` · dédup ne consomme pas
critères prouvés     AC-1 → `documents-quota-sous-plafond` · AC-2 → `documents-quota-depasse` · AC-3 → `documents-quota-dedup-passe`
décidé seul          aucun (QA)
écarts / dette       seau · unifier · CADRE print

