---

id: SEKTOR-97
status: done-agent
context: nafura
type: tech
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
---

# Angular 21 → 22

> TypeScript 6. PrimeNG 22 : `@primeng/themes` → `@primeuix/themes`. `build:dev` VERT.

## Étapes

- [x] Bump platform package.json Angular/PrimeNG `^22`
- [x] `npx ng update @angular/core@22 @angular/cli@22 --allow-dirty --force`
- [x] `npx ng update @angular/material@22 --allow-dirty --force`
- [x] TypeScript ≥ 6 (ng update)
- [x] PrimeNG 22 : remplacer `@primeng/themes` par `@primeuix/themes` (Aura)
- [x] Corriger uniquement ce que le build exige (OnPush/Eager, pTemplate, animations)
- [x] `npm run build:dev` VERT

## Preuve de fin

`@angular/core` 22.x. `typescript` ≥ 6. `build:dev` VERT.

## Journal

```
14/08 15:40  tsk1  platform peers/deps Angular+PrimeNG ^22
14/08 15:41  tsk1b npm i platform a suivi la junction @angular et a vidé CLI Sektor — wipe + réinstall NG21
14/08 15:51  tsk2  ng update 22 bloqué : CLI exige Node ≥ 22.22.3 (avait 22.15.0)
14/08 15:54  tsk2b winget upgrade OpenJS.NodeJS.22 → 22.23.2
14/08 16:11  tsk2c ng update core/cli@22 — TS 6.0.3 ; Eager CD 173 fichiers ; withXhr
14/08 16:17  tsk3  ng update material/cdk@22.1.2
14/08 16:18  tsk4  primeng@22 + @primeuix/themes ; Aura import ; uninstall @primeng/themes
14/08 16:22  tsk5  kebab selectors filter-bar ; ignoreDeprecations 6.0 ; declare module '*.css'
14/08 16:24  preuve  npm run build:dev VERT (~100s)
```

## Rapport de livraison

ce qui a changé      Sektor Angular 22.1.2 / CLI 22.1.4 / TS 6.0.3 / Material 22.1.2 / PrimeNG 22 ; Aura via `@primeuix/themes` ; Node machine 22.23.2
critères prouvés     n/a (tech) — `npm run build:dev` VERT
décidé seul          Node 22.15 → 22.23.2 (exigence CLI) ; pas de migrate-karma-to-vitest ni use-application-builder ; `ignoreDeprecations: "6.0"` pour garder `baseUrl`/`paths`
écarts / dette       junction @angular locale ; Storybook 8 ; lucide-angular peer ≤21 ; ngx-scanner 19 ; venue-catalog NG19
