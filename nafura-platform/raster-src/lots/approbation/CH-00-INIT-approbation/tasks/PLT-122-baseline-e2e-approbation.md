---
id: PLT-122
status: done-me
context: nafura
type: tech
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [PLT-121]
tags: [platform, approbation]
sprint: 2026-W34
---

# Baseline e2e approbation

> 2 lignes max.

## Étapes

- [x] Photographier le jar `workflow` (demande, étape, chaîne) sans le corriger
- [x] JUnit baseline inversé → voir rouge
- [x] Inverser les asserts → vert
- [x] Wrappers e2e `approbation-*` + `node --test`
- [x] Journal rouge-puis-vert · rapport de livraison · inbox des écarts

## Journal

```
16/08 14:15  posée
17/08 21:07  sprint → 2026-W34
17/08 21:13  status → doing
17/08 21:32  rouge `gradlew :platform:features:collaboration:workflow:test --tests …ApprobationBaselineTest` — 6 failed
             demander expected APPROVED but was PENDING
             accepter expected PENDING but was APPROVED
             refuser expected PENDING but was REJECTED
             deuxTenants Expecting actual not to be empty
             etapes expected APPROVED but was PENDING
             chaine Expecting actual not to be empty
17/08 21:33  asserts inversés → BUILD SUCCESSFUL · 6 tests
17/08 21:34  `node --test nafura-platform/e2e/approbation/*.test.mjs` — 6 pass / 0 fail
17/08 21:23  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `e2e/approbation/` (6 wrappers + `_gradle.mjs`) et `ApprobationBaselineTest` dans le module workflow. Comportement métier inchangé.
critères prouvés     AC-3 → `node --test nafura-platform/e2e/approbation/*.test.mjs` — 6 pass / 0 fail (demander, accepter, refuser, deux-tenants, etapes, chaine).
décidé seul          preuve JUnit + mocks `TenantContext` (forme documents), pas HTTP live ; type opaque = `record` ; refus photographié avec commentaire `null` (le back l'accepte).
écarts / dette       `getEntityTypes` catalogue produit · timeout d'étape non joué · commentaire refus obligatoire au front seulement — lignes inbox. Exceptions = message, pas de code (`POL-ERREUR-CODE`).
