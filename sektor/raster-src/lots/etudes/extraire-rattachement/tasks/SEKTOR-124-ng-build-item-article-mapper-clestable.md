---
id: SEKTOR-124
status: done-me
context: nafura
type: tech
agent_type: exec
priority: P1
assignee: agent
gate: none
tags: [etudes, extraire]
---

# ng build item-article mapper cleStable

> ng build bloque par item-article.mapper.ts cleStable hors type Article.

Même comportement, le build Angular doit passer. Type `Article` / mapper Extraire.

## Étapes

- [x] `cleStable` typé sur le modèle Article (ou mapping explicite) pour que `ng build` compile.
- [x] Pas de changement de flux Extraire. Suite existante verte.
- [x] Preuve : `ng build` (erp) ne cite plus `item-article.mapper.ts` / `cleStable`.

## Journal

```
20/08 21:12  posée
20/08 21:24  status → doing
20/08 21:26  cleStable ajouté sur Article (catalogue/models) — mapper Extraire inchangé
20/08 21:26  ng build production OK — plus de TS sur item-article.mapper.ts / cleStable
20/08 21:26  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `cleStable?: string` sur `Article` dans `catalogue/models` — le mapper `itemToArticle` compile. Flux Extraire inchangé.
critères prouvés     `npx ng build --configuration=production` exit 0, aucune erreur `item-article.mapper.ts` / `cleStable`.
décidé seul          Typage sur le modèle `catalogue/models` (import du mapper), pas un cast dans le mapper.
écarts / dette       Warnings NG8113 / budget initial — hors périmètre.
