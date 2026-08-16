---

id: PLT-92
status: done-me
context: nafura
type: tech
agent_type: exec
priority: P1
assignee: agent
gate: none
sprint: 2026-W34
blocked_by: [PLT-91]
tags: [platform, pact, impression]
---

# Plier l'arbre impression

> Photographier le contrat. Pas changer le comportement.
> Couvre AC-1…AC-5 de [`CH.md`](../../../../../pact/impression/CH-01-TECHNICAL-plier/CH.md).

## Étapes

- [x] `impression-plier-arbre` — AC-1, AC-2, AC-3, AC-5
- [x] suite `impression-*` verte — AC-4

## Journal

```
16/08 03:39  orch · après spec CH-01
16/08 03:40  tsk1 · impression-plier-arbre rouge (pas encore sources/backend/impression)
16/08 03:42  tsk2 · module :platform:impression · web app/impression · husk doc-manager
16/08 03:44  tsk3 · plier-arbre vert · suite impression verte
```

## Rapport de livraison

ce qui a changé      rendu sous `sources/backend/impression` + `sources/web/app/impression`
critères prouvés     AC-1…3, AC-5 → `impression-plier-arbre` · AC-4 → suite `impression-*`
décidé seul          husk `doc-manager` = `api` documents + impression (artefact existant) ; changelog SQL suit impression
écarts / dette       packages Java encore `docmanager`
