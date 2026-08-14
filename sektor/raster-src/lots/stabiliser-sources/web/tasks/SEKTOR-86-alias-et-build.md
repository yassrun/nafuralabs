---

id: SEKTOR-86
status: done-me
context: nafura
type: tech
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [SEKTOR-85]
---

# Un alias @platform et preuve de build web

> Un seul contrat d’import vers platform. Le front compile comme avant.

## Étapes

- [x] `tsconfig.json` : garder `@platform/*` et `@app/*` (et `@env`). Drop `@core`, `@lib`, `@features`, `@services` — **mappings conservés en pont** (voir rapport)
- [x] Réécrire les imports Sektor `@core/` `@lib/` → `@platform/core/` `@platform/lib/`
- [x] Corriger `app/ARCHITECTURE.md` (chemins to-be)
- [x] `cd sektor/sources/web && npm run build:dev` VERT

## Preuve de fin

Build dev VERT. Plus d’import `@core/` ou `@lib/` sous `sektor/sources/web`. Platform non extraite.

## Journal

```
14/08 11:50  tsk1  imports Sektor @core/@lib → @platform/core|lib ; ARCHITECTURE.md to-be ; drop tsconfig tenté
14/08 11:55  tsk2  drop tsconfig casse styles platform (member-listing @lib/anatomy) — mappings restaurés en pont
14/08 12:05  tsk3  NG8002 onboardingMode sur chantier-create : input/output ajoutés (contrat déjà dans le wrapper)
14/08 12:08  tsk4  npm run build:dev VERT (exit 0, WARN budget inchangé)
```

## Rapport de livraison

ce qui a changé      imports Sektor `@platform/core|lib` ; `app/socle/ARCHITECTURE.md` to-be ; `ChantierCreatePage` expose `onboardingMode` + `created`
critères prouvés     `npm run build:dev` exit 0 — `dist/sektor` ; plus d’import `@core/` `@lib/` dans `app/` et `src/`
décidé seul          mappings `@core/@lib/@features/@services` **gardés** : le compilation unit Angular charge `nafura-platform` (ex. `member-listing.page.ts` → `@lib/anatomy`) ; hors périmètre de réécriture
écarts / dette       drop réel des aliases tsconfig = lot platform ; uom doublons et inventory×catalogue (SEKTOR-85)
