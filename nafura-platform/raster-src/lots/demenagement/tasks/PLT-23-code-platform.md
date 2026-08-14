---

id: PLT-23
status: done-me
context: nafura
type: tech
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [PLT-22]
---

# platform/ vers nafura-platform/

## Étapes

- [x] `platform/backend` → `nafura-platform/backend`
- [x] `platform/web` → `nafura-platform/web`
- [x] Supprimer `platform/`

## Preuve de fin

`platform/` n'existe plus. Le code est intact.

## Journal

```
13/08 23:30  tsk1  git mv platform/backend → nafura-platform/backend (829 fichiers)
13/08 23:30  tsk2  git mv platform/web → nafura-platform/web (803 fichiers)
13/08 23:30  tsk3  rm -rf platform/ (restait build/core/features/integrations non suivis — sorties Gradle). 0 fichier suivi laissé. 1632/1632 au dest.

Livré : platform/ absent · backend + web sous nafura-platform/
```
