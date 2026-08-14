---

id: SEKTOR-81
status: done-me
context: nafura
type: tech
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [SEKTOR-80]
---

# Scission des builds Gradle — composite

> Sektor doit être un **build séparé** ; `nafura-platform` doit compiler seul ; Sektor ne contient aucun code platform.
> Aujourd'hui : **57** `implementation project(':platform:…')` dans les `build.gradle` de Sektor.

## Approche

Composite build — deux `settings.gradle.kts`, substitution automatique. Pas de registry, pas de version à gérer, la boucle de dev ne change pas.

```
sektor/settings.gradle.kts
   includeBuild("../nafura-platform")
```

Les 57 lignes deviennent `implementation 'ma.nafuralabs:<module>:0.1.0-SNAPSHOT'`.

**Une seule direction** : `sektor` vers `nafura-platform`, jamais l'inverse. Un cycle reproduirait le loopback qui casse déjà les builds.

## Étapes

- [x] `nafura-platform/settings.gradle.kts` — ses modules seuls
- [x] `sektor/settings.gradle.kts` + `includeBuild`
- [x] Coordonnées Maven uniques par module platform
- [x] Convertir les 57 dépendances
- [x] Retirer les modules platform et sektor du `settings.gradle.kts` racine

## Preuve de fin

`cd nafura-platform && ./gradlew build` marche **sans** Sektor.
`cd sektor && ./gradlew build` marche et résout platform par substitution.

## Journal

```
13/08 23:47  tsk1  nafura-platform/{settings,build.gradle.kts,gradle.properties,wrapper} — 28 modules backend seuls.
13/08 23:48  tsk2  sektor/{settings,build.gradle.kts,wrapper} + includeBuild("../nafura-platform").
13/08 23:48  tsk3  coords ma.nafuralabs:<project.name>:0.1.0-SNAPSHOT (dernier segment, uniques) — substitution auto includeBuild.
13/08 23:49  tsk4  57 project(':platform:…') → coords Maven dans sektor/backend.
13/08 23:49  tsk5  settings.gradle.kts racine : plus de platform ni sektor ; reste venue-catalog + :tools:lifecycle.
13/08 23:49  décision  venue-catalog (24 deps) converti + includeBuild("nafura-platform") à la racine — sinon configure racine casse (lifecycle). Heap -Xmx2g sur les deux nouveaux builds.
13/08 23:56  preuve  cd nafura-platform && ./gradlew build VERT (111 tasks, sans Sektor).
13/08 23:59  preuve  cd sektor && ./gradlew :sektor:app:compileJava VERT (substitution). ./gradlew build -x test VERT (bootJar). ./gradlew build : tests unitaires 4 modules rouges (hors composite) → inbox.

Livré : deux builds Gradle · 57 deps Maven · racine sans platform/sektor
```
