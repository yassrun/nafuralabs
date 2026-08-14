---

id: PLT-38
status: done-me
context: nafura
type: tech
priority: P0
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [PLT-37]
---

# Aligner les projets sur sources/

> Le code rejoint le squelette figé. Gradle dans `sources/backend/`. Sites dans `sources/web/`. `deploy/` → `ops/`.

## Étapes

- [x] `nafura-platform` : `backend/`+`web/`+Gradle → `sources/` ; lifecycle = Gradle à part dans `ops/lifecycle/`
- [x] `sektor` · `venue-catalog` : idem + `includeBuild` vers `nafura-platform/sources/backend`
- [x] `mbs-studio` · `corporate` : Next → `sources/web/` ; `deploy/` → `ops/`
- [x] `raster` : `web/` → `sources/web/` (moteur reste à la racine)
- [x] Chemins : nlops, Dockerfiles, tsconfig, QA, démarrage `NAFURALABS.md`

## Preuve de fin

`./gradlew :sektor:app:bootJar` depuis `sektor/sources/backend` compile. `npm run build` depuis `sources/web` des sites compile. Overlays kustomize inchangés (juste le dossier `ops/`).

## Journal

```
14/08 01:16  tsk1  nafura-platform : code déjà dans sources/{backend,web} ; drop leftover platform/ web/ raster/ tools/ à la racine. lifecycle standalone ops/lifecycle.
14/08 01:16  tsk2  sektor + venue : Gradle dans sources/backend (includeBuild ../../../nafura-platform/sources/backend, projectDir app/ + modules/). Drop leftover web/ (node_modules) et sektor/sektor/build.
14/08 01:16  tsk3  mbs-studio + corporate : Next dans sources/web ; ops/k8s (plus deploy/). Drop copies Next à la racine.
14/08 01:16  tsk4  raster/web → sources/web ; moteur (t.mjs …) reste à la racine. tsconfig allowJs pour importer agent-type.mjs.
14/08 01:16  tsk5  nlops / Dockerfiles / tsconfig / QA déjà retargetés sources/. .dockerignore jar exception. lifecycle venue → sources/backend/app/build.gradle. raster-src/.gitkeep venue · mbs · corporate.
14/08 01:16  décision  e2e reste à la racine du projet (preuves), pas dans sources/ — figé PLT-37 / NAFURALABS.md.
14/08 01:32  preuve  cd sektor/sources/backend && ./gradlew :sektor:app:bootJar VERT. venue compileJava VERT. npm run build:dev sektor VERT. npm run build corporate VERT · mbs-studio VERT (WARN img) · venue VERT (ajout @angular/animations, plus hoisté) · raster VERT.

Livré : chaque projet Pact a sources/{backend?,web} + raster-src. Pas de web/ ni Gradle à la racine d’un projet.
```
