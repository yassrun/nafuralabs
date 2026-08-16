---
id: PLT-87
status: done-agent
context: nafura
type: tech
agent_type: exec
priority: P1
assignee: agent
gate: none
sprint: 2026-W34
blocked_by: [PLT-85, PLT-86]
tags: [platform, pact, impression]
---

# Baseline impression

> Photographier le rendu. Pas changer le comportement.
> Couvre AC-1…AC-3 de [`CH.md`](../../../../../pact/impression/CH-00-INIT-impression/CH.md).

## Étapes

- [x] `impression-rendre-pdf` — AC-1
- [x] `impression-deux-tenants` — AC-2
- [x] `impression-frontiere-produit` — AC-3

## Journal

```
16/08 03:20  orch · après spec impression
16/08 03:23  tsk1 · 3/3 rouges (asserts inversés : pas %PDF · B voit A · FACTURE attendu)
16/08 03:26  tsk2 · asserts droits · JUnit + e2e verts · zéro changement de comportement
```

## Rapport de livraison

ce qui a changé      preuves only : `ImpressionBaselineTest` + `e2e/impression/`
critères prouvés     AC-1 → `impression-rendre-pdf` · AC-2 → `impression-deux-tenants` · AC-3 → `impression-frontiere-produit`
décidé seul          PDF photographié via mock Gotenberg (`%PDF`) — l'engin est `not_owns` ops ; `PrintDocument` exclu du scan (hors contrat)
écarts / dette       le rendu reste dans le jar `doc-manager`
