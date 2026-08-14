---

id: SEKTOR-95
status: done-me
context: nafura
type: tech
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [SEKTOR-94]
---

# ng update Sektor 19 → 20

> App Angular 20, TypeScript ≥ 5.8, PrimeNG 20. `npm run build:dev` VERT.

## Étapes

- [x] `cd sektor/sources/web && npx ng update @angular/core@20 @angular/cli@20 --allow-dirty`
- [x] `npx ng update @angular/material@20 --allow-dirty` si le CLI le propose
- [x] PrimeNG + `@primeng/themes` → 20 (garder `import Aura from '@primeng/themes/aura'` — pas de rewrite primeuix)
- [x] TypeScript ≥ 5.8 (ng update le pose)
- [x] Corriger les migrations cassantes (DOCUMENT, afterRender, etc.) seulement si le build les exige
- [x] `npm run build:dev` VERT

## Preuve de fin

`@angular/core` 20.x. `typescript` ≥ 5.8. `build:dev` VERT.

## Journal

```
14/08 14:00  tsk1  ng update core/cli@20 --force (Storybook 8 peer <20)
14/08 14:17  tsk1b node_modules cassé (ng serve lock) → wipe + npm install --legacy-peer-deps
14/08 14:24  tsk2  ng update material/cdk@20
14/08 14:33  tsk3  primeng + @primeng/themes 20.4 — Aura inchangé
14/08 14:36  tsk4  TS 5.9.3 ; paths @angular/* + @ngx-translate/* → sektor node_modules
14/08 14:40  tsk5  platform npm i NG20 + animations ; firstValueFrom extractStateless as StatelessExtractionResponse (TS18046)
14/08 14:43  preuve  npm run build:dev VERT (62.8s)
```

## Rapport de livraison

ce qui a changé      Sektor Angular 20.3.28 / CLI 20.3.34 / TS 5.9.3 / Material 20.2.14 / PrimeNG 20.4 ; platform contrat + node_modules alignés
critères prouvés     n/a (tech) — `npm run build:dev` VERT
décidé seul          `--force` / `--legacy-peer-deps` à cause de Storybook 8 ; pas de rewrite `@primeuix/themes` ; tsconfig pin @angular sur la copie Sektor
écarts / dette       Storybook 8 incompatible NG20 ; venue-catalog NG19 ; ngx-scanner encore 19
