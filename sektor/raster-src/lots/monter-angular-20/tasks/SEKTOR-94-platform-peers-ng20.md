---

id: SEKTOR-94
status: done-me
context: nafura
type: tech
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
---

# Platform web : peers Angular 20

> `nafura-platform/sources/web/package.json` aligne le contrat sur Angular 20 + PrimeNG 20. Pas de `ng update` ici (pas une app).

## Étapes

- [x] Bump `@angular/*` (core, common, cdk, forms, material, platform-browser, router) → `^20.0.0` (material au patch 20 courant)
- [x] Bump `primeng` → `^20.0.0` (peers + dependencies)
- [x] Ne pas toucher Sektor `node_modules` dans cette task

## Preuve de fin

package.json platform : Angular 20, plus de `^19`.

## Journal

```
14/08 13:58  tsk1  peerDependencies + dependencies Angular ^20.0.0, material ^20.0.0, primeng ^20.0.0
```

## Rapport de livraison

ce qui a changé      contrat `nafura-platform/sources/web/package.json` Angular 20 / PrimeNG 20
critères prouvés     n/a (tech) — plus de `^19` sur @angular/* et primeng
décidé seul          material aligné `^20.0.0` comme les autres (plus de pin 19.2.19)
écarts / dette       venue-catalog reste NG19 (inbox)
