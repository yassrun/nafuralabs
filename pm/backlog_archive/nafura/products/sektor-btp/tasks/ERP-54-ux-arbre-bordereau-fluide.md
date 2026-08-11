---
id: ERP-54
status: done
context: nafura
kind: task
priority: P1
assignee: agent
gate: qa
feature: etude-gates-ux
sprint: 2026-W33
tags: [sektor, etudes, ux, frontend]
---

# UX — Arbre bordereau fluide (libellé + scroll unique)

> Libellé trop large → Unité/Qté hors viewport + double scrollbar.
> Option A : ellipsis + tooltip, métriques sticky, un seul scroll vertical.

## Critères d'acceptation
- [x] Libellé tronqué (1–2 lignes) ; texte complet au hover (`title` / tooltip)
- [x] Unité, Qté, Postes (et Actions) visibles sans scroll horizontal sur viewport desktop ~1280px
- [x] Un seul scroll vertical pour l’arbre (pas page + table)
- [x] Pas de régression étape Coût (mêmes colonnes / sticky)

## Journal
```
11/08 13:33  démarré · option A validée (ellipsis + sticky + scroll unique)
11/08 13:45  done · stickyEnd nf-tree-table + fill layout wizard bordereau · QA DE-0001 OK
```
