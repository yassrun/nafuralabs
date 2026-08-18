---
id: PLT-116
status: done-me
context: nafura
type: tech
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [PLT-115]
tags: [platform, identite]
---

# Baseline e2e identite

> 2 lignes max.

## Étapes

- [x] tsk1 — Motif e2e impression/documents + jars owned identity/iam
- [x] tsk2 — IdentiteBaselineTest (deuxTenants, inviterMembre, accepterInvitation, retirerMembre) + scan frontière
- [x] tsk3 — Vu rouge (assert contraire) puis invert ; journaler les deux runs
- [x] tsk4 — Vert `node --test nafura-platform/e2e/identite/*.test.mjs` ; rapport ; done-agent

## Journal

```
16/08 14:15  posée
17/08 21:15  sprint → 2026-W34
17/08 21:17  status → doing
17/08 21:20  tsk1–tsk2  motif gradle JUnit iam + 5 scénarios CH ; assertions inversées d'abord
17/08 21:22  tsk3 ROUGE  gradlew :platform:features:administration:iam:test --tests …IdentiteBaselineTest
             4 tests completed, 4 failed
             deuxTenants: B list=["admin-b@example.test"] n'a pas member-m@example.test
             inviterMembre: expected "active" but was "invited"
             accepterInvitation: expected "INVITED" but was "ACTIVE"
             retirerMembre: Expecting value to be true but was false
             node --test …/identite-frontiere-produit.test.mjs → fail
             assert.ok(hits("Devis").length > 0) actual false
17/08 21:23  tsk3 invert + VERT  node --test nafura-platform/e2e/identite/*.test.mjs
             tests 5 pass 5 fail 0  (XML IdentiteBaselineTest tests=4 failures=0)
17/08 21:24  status → done-agent · gate none → done-me
```

## Rapport de livraison

changé — `e2e/identite/` (5 `.test.mjs` + `_gradle.mjs`) · `IdentiteBaselineTest` dans le jar iam. Pas de prod.
critères prouvés — AC-3 → `node --test nafura-platform/e2e/identite/*.test.mjs` vert (R-1 R-2 R-3 R-5 R-7 INV-1). AC-5 scan Devis/Chantier/Paie = [].
décidé seul — isolation sur l'argument `tenantId` (IamService n'utilise pas TenantContext) · rôle `OWNER` · invite lab `emailStatus=FAILED` sans envoi · accept IdP off, `loginRequired=true` · même email chez B = autre appartenance (R-2) dans `inviterMembre`.
écarts / dette — erreurs invite/retrait = texte `IllegalArgumentException`, pas un code (`POL-ERREUR-CODE` non tenu par le actuel) · `P-IDENTITE-*` non assertés (hors matrice) · settings/app-settings non scannés (not_owns) · UI non codée.
