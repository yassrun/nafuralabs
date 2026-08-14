---
id: PLT-40
status: done-agent
context: nafura
type: physical
priority: P1
assignee: me
gate: none
sprint: 2026-W33
tags: [platform, documents, doc-extractor]
---

# Trancher O1 — cache de plans par tenant ou mutualisé

> Décision produit, pas technique. Mutualiser sort une empreinte de mise en page du périmètre d’un tenant.
> Choix figé dans [`LOT.md`](../LOT.md) : **par tenant**.

## Étapes

- [x] Trancher : cache **par tenant** ou **mutualisé entre tenants**
- [x] Noter la décision dans `LOT.md` (O1 fermée) — une ligne, opposable

## Journal

```
14/08 19:52  spec · bloquant archive ERP-53 · même famille que la clause CGU du catalogue
14/08 19:55  orch · sprint 2026-W33
14/08 19:57  me · valide par tenant · gate me → none
```

## Rapport de livraison

ce qui a changé      O1 fermée : cache de plans **par tenant**. `LOT.md` mis à jour. `gate: none`.
critères prouvés     n/a (physical) — décision opposable dans le lot
décidé seul          recommandation agent (isolation + réversibilité) ; me a validé
écarts / dette       catalogue éditeur opt-in (O4) hors lot
