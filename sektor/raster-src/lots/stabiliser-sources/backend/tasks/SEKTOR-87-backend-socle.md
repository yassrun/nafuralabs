---

id: SEKTOR-87
status: done-me
context: nafura
type: tech
priority: P0
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [SEKTOR-83]
---

# Créer le module backend socle

> Kernel Sektor (onboarding, QA locale, identité print, préférence AI tenant) dans `:sektor:socle`. Pas un BC.

## Étapes

- [x] Créer `sektor/sources/backend/modules/socle/` + `include` dans `settings.gradle.kts`
- [x] Y déplacer ce que `MAPPING.md` classe socle (onboarding, `dev/config` cursor-auth, print identity, adapters AI **tenant**)
- [x] `app` dépend de `:sektor:socle`
- [x] Ne pas y mettre `etudes/*` ni `catalogue/*` encore dans `app/`

## Preuve de fin

Le module compile. Rien de métier etudes/catalogue dans socle.

## Journal

```
14/08 11:12  tsk1  module :sektor:socle (java-library) + includeSektorModule("socle")
14/08 11:14  tsk2  git mv onboarding/invitation/dev/print/ai/config + ma.nafura.sektor.ai|search → modules/socle (packages inchangés)
14/08 11:15  tsk3  resources onboarding JSON + changelogs onboarding/QA cursor suivent le kernel
14/08 11:16  tsk4  app/build.gradle implementation project(':sektor:socle')
14/08 11:17  preuve  ./gradlew.bat :sektor:socle:compileJava BUILD SUCCESSFUL
```

## Rapport de livraison

ce qui a changé      `:sektor:socle` créé ; kernel (onboarding, invitation, cursor-auth, print identity, AI tenant, demo seed, registries search/AI) sorti de `app/`
critères prouvés     n/a (tech) — `:sektor:socle:compileJava` VERT ; `app/src` ne contient plus que `ErpApplication` + `etudes/` + `catalogue/`
décidé seul          packages Java inchangés (`ma.nafura.erp.*` / `ma.nafura.sektor.*`) ; JSON onboarding + SQL onboarding/QA cursor déplacés avec les classes (classpath + liquibase ops)
écarts / dette       `etudes/` et `catalogue/` restent dans `app/` (SEKTOR-88) ; `ErpApplication` ne scanne toujours pas `ma.nafura.sektor` (préexistant)
