---

id: SEKTOR-96
status: done-me
context: nafura
type: tech
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
---

# Angular 20 → 21

> Platform peers + Sektor `ng update` + PrimeNG 21. `build:dev` VERT. Pas de saut vers 22.

## Étapes

- [x] Bump `nafura-platform/sources/web/package.json` Angular/PrimeNG `^21`
- [x] `cd sektor/sources/web && npx ng update @angular/core@21 @angular/cli@21 --allow-dirty --force`
- [x] `npx ng update @angular/material@21 --allow-dirty --force`
- [x] PrimeNG + `@primeng/themes` → 21 (Aura inchangé)
- [x] `npm install --legacy-peer-deps` si node_modules cassé
- [x] `npm run build:dev` VERT

## Preuve de fin

`@angular/core` 21.x. `build:dev` VERT.

## Journal

```
14/08 15:14  tsk1  platform peers/deps Angular+PrimeNG ^21 ; npm i --legacy-peer-deps
14/08 15:25  tsk2  ng update core/cli@21 --allow-dirty --force (158 fichiers control-flow)
14/08 15:27  tsk3  ng update material@21 : package.json 21.2.14, npm install schematic FAILED (peer primeng)
14/08 15:32  tsk3b wipe implicite → npm install --legacy-peer-deps
14/08 15:33  tsk4  primeng@21.1.9 + @primeng/themes@21.0.4 — Aura inchangé
14/08 15:36  tsk5  build ROUGE TS2322 Signal unique symbol (2 copies @angular 21.2.20)
14/08 15:37  tsk5b junction platform node_modules/@angular + @ngx-translate → copie Sektor
14/08 15:39  preuve  npm run build:dev VERT (~140s)
```

## Rapport de livraison

ce qui a changé      Sektor Angular 21.2.20 / CLI 21.2.21 / Material 21.2.14 / PrimeNG 21.1.9 ; platform contrat ^21
critères prouvés     n/a (tech) — `npm run build:dev` VERT
décidé seul          `--force` / `--legacy-peer-deps` (Storybook 8) ; junction locale des copies Angular (Signal NG21)
écarts / dette       junction node_modules non durable (`npm i` platform la casse) ; Storybook 8 ; ngx-scanner 19
