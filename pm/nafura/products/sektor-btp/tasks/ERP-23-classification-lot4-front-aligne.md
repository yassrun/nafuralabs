---
id: ERP-23
status: todo
context: nafura
assignee: me
parent: ERP-18
feature: classification-article
priority: P1
estimate: 8h
blocked_by: [ERP-22]
tags: [sektor, inventory, frontend]
---

# Classification article — Lot 4 · Front aligné (9 natures)

> Spec §4 Lot 4. Inclut dialogue création article depuis chiffrage.

## Critères d'acceptation
- [ ] Type TS `ArticleType` → 9 natures alignées back
- [ ] Select natures via `GET /api/v1/article-natures` ; posteBudget dérivé (dérogation explicite)
- [ ] Listing / filtres / mappers / mouvements / smart-import / i18n renommés
- [ ] Créer un article `MAIN_DOEUVRE` depuis l’écran article bout-en-bout

## Journal
```
05/08 13:32  balayage · capturé depuis 00-PLAN Lot 4
```
