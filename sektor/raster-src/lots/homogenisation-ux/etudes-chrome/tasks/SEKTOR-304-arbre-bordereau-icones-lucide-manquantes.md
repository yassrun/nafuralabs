---
id: SEKTOR-304
status: review
context: nafura
type: bug
agent_type: exec
priority: P0
assignee: agent
gate: none
tags: [homog, etudes]
---

# arbre bordereau icones lucide manquantes

> Chevrons arbre superposes (mat-icon interpolé) + unfold_more/unfold_less/subdirectory_arrow_right/refresh absents du provider Lucide.

## Étapes

- [x] nf-tree-table : chevrons Lucide séparés (plus de ligature Material)
- [x] Registry + aliases Lucide (unfold, fold, corner-down-right, refresh)
- [x] bordereau-arbre + refresh décomposition sur noms Lucide
- [x] Preuve source + browser Mode B

## Preuves attendues

- `node sektor/e2e/scripts/verify-arbre-icones-304.mjs`
- Arbre : un chevron Lucide par ligne expansible ; 0 erreur console `icon has not been provided`

## Journal

```
01/09 13:02  posée
01/09 13:02  status → doing
01/09 13:10  lucide tree + aliases ; preuve 304 source et browser OK
01/09 13:12  status → review
```

## Rapport de livraison

### Ce qui a changé

- `nf-tree-table` affiche `chevron-down` / `chevron-right` Lucide (un seul nœud DOM), plus `expand_more`/`chevron_right` interpolés dans un `mat-icon`.
- Registry app : `UnfoldVertical`, `FoldVertical`, `CornerDownRight`. Aliases `nf-button` pour les anciens noms Material, dont `refresh` → `refresh-cw`.
- Arbre : tout déplier / replier / ajouter un enfant en Lucide. Refresh prix décomposition → `refresh-cw`.

### Preuves exécutées

- `node sektor/e2e/scripts/verify-arbre-icones-304.mjs` → OK source + browser (0 icône manquante, 1 lucide-icon par toggler)

### Décidé seul

- Cause visuelle = ligature Material sur un `mat-icon` interpolé (v et > superposés), pas un bug métier d’arbre.
- Aliases gardés pour le chrome encore en noms Material.

### Écarts / dette

- `npx playwright test` casse ici sur un double-load Windows (`c:\` vs `C:\`) ; la preuve Raster est le script node + Chromium.
- i18n `${tenant.logo}` et 404 `/api/v1/erp/chrome.ico` hors périmètre.
