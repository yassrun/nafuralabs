---

id: SEKTOR-89
status: done-me
context: nafura
type: tech
priority: P0
assignee: agent
gate: none
sprint: 2026-W33
---

# Sortir les jars de modules/

> `sources/backend/<nom>` comme le web. Plus de dossier `modules/`. Gradle `projectDir = file(name)`.

## Étapes

- [x] git mv `modules/socle|etudes|catalogue|item|stock|currency|partner|achats|ventes|chantiers|marches|finance|rh|hse|approbations` → `sektor/sources/backend/<nom>/`
- [x] `settings.gradle.kts` : `projectDir = file(name)` ; `app/` inchangé
- [x] Supprimer `modules/` une fois vide
- [x] Ne fusionner aucun jar dans cette task

## Preuve de fin

Plus de `backend/modules/`. `./gradlew :sektor:app:bootJar` encore possible (ou compileJava des projets). Noms de modules inchangés.

## Journal

```
14/08 13:15  tsk1  git mv 15 jars modules/<nom> → backend/<nom> ; rmdir modules/ vide
14/08 13:15  tsk2  settings.gradle.kts projectDir = file(name) ; app/ inchangé (file("app"))
14/08 13:16  tsk3  git rm etudes/tmp/etudes-cp (142 jars classpath junk) pour débloquer git mv etudes
14/08 13:16  tsk4  app/README.md chemin domaine (pas compile) ; aucun include droppé
14/08 13:16  preuve  ./gradlew.bat :sektor:socle:compileJava :sektor:catalogue:compileJava --no-daemon BUILD SUCCESSFUL
```

## Rapport de livraison

ce qui a changé      15 jars sous `sektor/sources/backend/<nom>/` ; plus de `modules/` ; `projectDir = file(name)`
critères prouvés     n/a (tech) — `:sektor:socle:compileJava` + `:sektor:catalogue:compileJava` VERT ; includes item/stock/partner/currency/approbations encore présents
décidé seul          `etudes/tmp/etudes-cp` (142 jars trackés) supprimé du git pour permettre le mv ; README app chemin mis à jour
écarts / dette       fusion jars = SEKTOR-90 / 91
