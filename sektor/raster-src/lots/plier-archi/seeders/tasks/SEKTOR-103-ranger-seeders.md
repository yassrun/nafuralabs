---
id: SEKTOR-103
status: done-agent
context: nafura
type: tech
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
---

# Ranger les seeders dans `seeders/`

> Chaque BC (et socle) a un dossier `seeders/` canonique. Les `*SeedService` sortent de `service/` / `onboarding/`. Même comportement. Garde `DemoSeed*` reste dans `socle/config`.

## Étapes

- [x] `git mv` tous les `*SeedService` (+ tests) vers `ma.nafura.<bc>.seeders`
- [x] Réécrire packages et imports
- [x] Laisser `DemoSeedProperties` / `DemoSeedRuntimeGuardAspect` dans `socle/config`
- [x] `compileJava` + `compileTestJava` VERT

## Preuve de fin

Aucun `*SeedService` hors `…/seeders/` (sauf `DemoSeed*`). `compileJava` + `compileTestJava` VERT.

## Journal

```
14/08 19:07  exec     seeders/ canonique par BC
14/08 19:20  exec     58 SeedService + 1 test ; helpers package-private rendus public (computeHash, tauxForType, totals)
```

## Rapport de livraison

ce qui a changé      `*SeedService` sous `<bc>/seeders/` (y compris `TenantReferenceDataSeedService`). DemoSeed* reste config.
critères prouvés     n/a (tech) — compileJava + compileTestJava VERT
décidé seul          package `seeders` (mot demandé) ; visibilité public sur 4 helpers qui étaient package-private
écarts / dette       seeders appellent encore `service/` (calculateurs, notes ST) — pas un repli métier
```
