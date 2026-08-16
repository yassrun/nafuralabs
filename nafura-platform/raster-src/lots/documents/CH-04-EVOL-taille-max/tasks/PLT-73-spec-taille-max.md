---
id: PLT-73
status: done-agent
context: nafura
type: spec
agent_type: spec
priority: P0
assignee: agent
gate: none
sprint: 2026-W33
tags: [platform, pact, documents]
---

# SPEC — taille max

> 50 Mio, code `PAYLOAD_TOO_LARGE`.
> Couvre [`CH.md`](../../../../../pact/documents/CH-04-EVOL-taille-max/CH.md).

## Étapes

- [x] Qualifier EVOL
- [x] Geler AC-1…AC-3
- [x] Patch SPEC R-7

## Journal

```
15/08 22:58  spec · 50 Mio · widget 10 Mo = produit, hors CH
16/08 02:58  constat · livré = R-7 : 50 Mio, PayloadTooLarge, pas de ligne / pas d'octets. SPEC juste. Dette : aucune sur CH-04.
```

## Rapport de livraison

ce qui a changé      `CH-04` + SPEC R-7
critères prouvés     qualification
décidé seul          50 Mio (plus large que le widget / l'extraction) ; code déjà `PAYLOAD_TOO_LARGE`
écarts / dette       quota / seau / CADRE print = CH suivants
