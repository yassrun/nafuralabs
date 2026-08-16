---
id: PLT-75
status: done-agent
context: nafura
type: qa
agent_type: qa
priority: P0
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [PLT-74]
tags: [platform, pact, documents]
---

# QA — taille max

> Preuves gelées du [`CH.md`](../../../../../pact/documents/CH-04-EVOL-taille-max/CH.md).

## Étapes

- [x] Rejouer les 3 scénarios taille-max
- [x] Rapport de livraison

## Journal

```
15/08 22:58  orch · après PLT-74 review
16/08 03:02  qa · 3/3 pass (node --test taille-max-*) · discrimination : refuse-* vus rouges avant DocumentLimits
```

## Rapport de livraison

ce qui a changé      plafond 50 Mio, pièce et original, code `PAYLOAD_TOO_LARGE`
critères prouvés     AC-1 → `documents-taille-max-accepte` · AC-2 → `documents-taille-max-refuse-piece` · AC-3 → `documents-taille-max-refuse-original`
décidé seul          aucun (QA)
écarts / dette       quota / seau / unifier / CADRE print — CH suivants

