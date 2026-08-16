---
id: PLT-76
status: done-agent
context: nafura
type: spec
agent_type: spec
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
tags: [platform, pact, documents]
---

# SPEC — quota

> Plafond sur l'usage unique. Pas l'offre.
> Couvre [`CH.md`](../../../../../pact/documents/CH-05-EVOL-quota/CH.md).

## Étapes

- [x] Qualifier EVOL
- [x] Geler AC-1…AC-3

## Journal

```
15/08 22:58  spec · quota après taille-max · plafond config lab · SPEC inchangée tant que CH-05 n'est pas actif
16/08 03:08  spec · CH-05 actif · SPEC R-8 + owns quota
16/08 03:06  constat · livré = R-8 : plafond config, dédup ne consomme pas, STORAGE_QUOTA_EXCEEDED. SPEC juste.
```

## Rapport de livraison

ce qui a changé      `CH-05` + SPEC R-8 · owns quota · qui *fixe* le plafond reste non spécifié
critères prouvés     qualification
décidé seul          dédup ne consomme pas ; plafond = `documents.quota.bytes` ; absent ou ≤ 0 = pas de plafond ; HTTP 409
écarts / dette       offre / abonnement plus tard
