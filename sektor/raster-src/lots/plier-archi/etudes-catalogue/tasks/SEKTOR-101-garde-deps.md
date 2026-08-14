---
id: SEKTOR-101
status: done-agent
context: nafura
type: tech
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [SEKTOR-98, SEKTOR-100]
---

# Garde : socle sans BC, Études hors item.*

> Un check qui **échoue** si on recâble. Niveau Archi « à construire » : on le pose ici pour le slice, pas pour tout Sektor.

## Étapes

- [x] Socle : `build.gradle` n’a plus de `project(':sektor:catalogue|finance|chantiers|rh')` — assert dans le check (grep CI ou test Gradle)
- [x] Études : aucun import `ma.nafura.item` / `ma.nafura.stock` — ArchUnit, Checkstyle, ou test qui parse les sources
- [x] Documenter la commande dans la preuve ; `:sektor:app:bootJar` VERT
- [x] Interdit : étendre la garde à chantiers/achats/ventes (pas encore pliés)

## Preuve de fin

La garde est rouge si on réintroduit un import `item` dans etudes ou une dep BC dans socle. bootJar VERT.

## Journal

```
14/08 15:50  promote  blocked_by SEKTOR-98 + SEKTOR-100
14/08 15:56  orch     sprint: 2026-W33
14/08 16:50  exec     tsk1 SocleNoBcDependencyTest parse socle/build.gradle
14/08 16:50  exec     tsk2 EtudesNoItemImportTest parse src/main/java (item + stock)
14/08 16:50  exec     preuve  ./gradlew :sektor:socle:test --tests ma.nafura.sektor.socle.SocleNoBcDependencyTest
                          ./gradlew :sektor:etudes:test --tests ma.nafura.etudes.EtudesNoItemImportTest
                          :sektor:app:bootJar VERT
14/08 16:50  exec     détecteurs unitaires : sneak BC dep / sneak import → assert true (la garde est rouge si recâblage)
```
