---
kind: epic-progress
app: sektor-btp
slug: chiffrage-assiste-cps
pm_feature: ERP-64
updated: 2026-08-11
---

# Progress — Chiffrage assisté CPS

**Statut :** todo
**Lot courant :** — (PLAN à valider avant découpage)
**Ticket :** ERP-64
**Next :** trancher Q1 (qui fait foi pour un rendement), puis découper le lot 0 en `kind: task`.

## Lots

| # | Lot | Status | Ticket |
|---|-----|--------|--------|
| 0 | Étalon et instrumentation | todo | — |
| 1 | Rappel CPS | todo | — |
| 2 | Provenance et gate | todo | — |
| 3 | Escalier des sources (+ branchement `catalogue`) | todo | — |
| 4 | Deux appels séparés | todo | — |
| 5 | Boucle de retour bibliothèque | todo | — |

## Notes (courtes)

- 11/08 — PLAN + ARCHITECTURE rédigés après revue de code de la chaîne CPS → composants. Aucun lot ouvert.
- 11/08 — correction : le module `catalogue` (L14–L16) est implémenté — `catalog_ouvrages` /
  `catalog_composants` portent des rendements, `RapprochementDeterministeService` fait trigram +
  règles + LLM. Mais `etudes` **ne dépend pas** de `catalogue` : le chiffrage ne le lit jamais et
  réimplémente un `LIKE`. L'escalier passe donc de 2 à 3 sources de recette, et Q1 est reformulée.
- Q1 bloquante avant le lot 3 : arbitrage rendement tenant vs rendement catalogue. Décision métier, pas technique.
- Aucun étalon chiffré sur ce périmètre — c'est l'objet du lot 0. Ne régler aucun prompt avant.
- Quatre bloquants constatés dans le code (B1–B4, cf. PLAN §2.2) ; B1 et B3 sont à faible diff et fort effet.
- Frontière `import-magique` : le CPS est forme *blocs multiples* → vague 3, non planifiée. Cet epic ne monte rien en plateforme.
