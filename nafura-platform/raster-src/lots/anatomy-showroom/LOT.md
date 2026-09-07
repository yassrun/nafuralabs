# Anatomy showroom — canon archétypes + sandbox

> Une **application sandbox** qui montre tous les artefacts Anatomy (archétypes d’écran + building blocks), et un **canon** gelé des patterns d’écran pour guider features et générateurs.

**Où :** `nafura-platform/sources/sandbox-web/` (mini-app Angular) · lib Anatomy `nafura-platform/sources/web/lib/anatomy/`.  
**Pas dans Sektor** : la showroom est platform, pas un écran métier BTP.

## Intention

Aujourd’hui Anatomy a des base classes et des docs (`README`, `UX_PATTERNS_*`), des sandboxes ponctuels (`nf-address-sandbox`), et quasi pas de Storybook. Il manque :

1. un **endroit unique** où ouvrir / comparer chaque archétype d’écran en live ;
2. une **taxonomie claire** listing · details · details-1N · tree · master-slave · … pour raffiner le redesign.

## Sous-lots

| # | Sous-lot | Statut |
|---|----------|--------|
| 1 | [`sandbox-v1`](sandbox-v1/00-PLAN.md) | ouvert — shell + catalog + demos core |

## Hors lot

- Refonte visuelle complète de chaque `nf-*` atom (hors démo / états).
- Storybook comme SSOT (peut coexister plus tard ; la showroom est l’app).
- Brancher la showroom sur l’API réelle / Mode B (mocks in-memory en V1).
- Migrer toutes les pages Sektor vers les nouveaux archétypes (consommation ultérieure).
