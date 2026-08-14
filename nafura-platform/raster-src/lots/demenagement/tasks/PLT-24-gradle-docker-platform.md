---

id: PLT-24
status: done-me
context: nafura
type: tech
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [PLT-23]
---

# settings.gradle.kts et contextes Docker

> **Déplacement seul.** La scission des builds est `SEKTOR-81` — ne pas mélanger, sinon un build rouge n'est plus attribuable.

## Étapes

- [x] `settings.gradle.kts` : `projectDir` de `:platform:*`
- [x] `Dockerfile.jar` / `Dockerfile.web` : contextes
- [x] Imports front qui référencent `platform/web`

## Preuve de fin

Même résultat qu'au lot 0. **Rien de neuf en rouge.**

## Journal

```
13/08 23:32  tsk1  includePlatform → nafura-platform/backend/$relative. 28 modules, build.gradle présents.
13/08 23:32  tsk2  Dockerfile.jar/web : aucun COPY platform/ (JAR pré-build / dist nginx, contexte $ROOT). Rien à changer.
13/08 23:32  tsk3  tsconfig sektor+venue, eslint, styles.scss @use, package.json + lock workspaces → nafura-platform/web.
13/08 23:32  décision  Pas de `./gradlew build` : OOM déjà au lot 0. Pas de scission (SEKTOR-81). :tools:lifecycle + lifecycle/build.gradle hors étapes → inbox.

Livré : projectDir platform + imports front. Docker contextes inchangés.
```
