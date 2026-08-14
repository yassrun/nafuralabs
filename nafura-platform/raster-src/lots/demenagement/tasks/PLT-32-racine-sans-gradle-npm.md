---
id: PLT-32
status: done-agent
context: nafura
type: tech
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [PLT-31, SEKTOR-81]
---

# Racine sans Gradle ni npm workspaces

> La racine du workspace n'est plus un build. Chaque projet porte son wrapper Gradle et son `npm install`.

## Étapes

- [x] `venue-catalog/` : `settings.gradle.kts` + wrapper + `includeBuild("../nafura-platform")`
- [x] `:tools:lifecycle` dans le build `nafura-platform` (`repoRoot` = parent) ; plus de Gradle à la racine
- [x] `nlops.sh` / Makefile / Docker venue / recettes ops pointent vers les wrappers des projets
- [x] Plus de `package.json` workspaces à la racine ; `npm install` dans chaque `*/web`
- [x] Preuve : builds Gradle des trois projets + `collectMigrations` + build Angular Sektor sans `node_modules` racine

## Preuve de fin

`cd nafura-platform && ./gradlew build` vert. `cd sektor && ./gradlew :sektor:app:compileJava` vert. `cd venue-catalog && ./gradlew :venue-catalog:app:compileJava` vert. `cd nafura-platform && ./gradlew :tools:lifecycle:collectMigrations -PappId=sektor-btp` vert. `cd sektor/web && npm run build` compile (budget prod 3.17 > 3.00 → inbox). `npm run build:dev` vert. Pas de `settings.gradle.kts` / `package.json` / `node_modules` à la racine.

## Journal

```
14/08 00:10  tsk1  venue-catalog/settings + wrapper + includeBuild("../nafura-platform"). compileJava VERT.
14/08 00:10  tsk2  :tools:lifecycle dans nafura-platform/settings ; repoRoot = parent. collectMigrations -PappId=sektor-btp VERT (171 SQL). ./gradlew build VERT (113 tasks).
14/08 00:10  tsk3  Racine : plus de settings/build/gradlew/gradle/package.json. nlops GRADLEW_SEKTOR / GRADLEW_PLATFORM. Makefile cd sektor. Docker venue COPY venue-catalog + nafura-platform.
14/08 00:22  tsk4  npm install nafura-platform/web, venue-catalog/web, sektor/web. node_modules racine supprimé.
14/08 00:28  preuve  cd sektor && ./gradlew :sektor:app:compileJava VERT. npm run build:dev VERT. npm run build (prod) compile + budget 3.17 MB > 3.00 → inbox.

Livré : racine sans Gradle ni npm · chaque projet autonome
```
