---
id: PLT-90
status: done-agent
context: nafura
type: tech
agent_type: exec
priority: P1
assignee: agent
gate: none
sprint: 2026-W34
blocked_by: [PLT-89]
tags: [platform, pact, documents]
---

# Plier l'arbre documents

> Photographier le contrat. Pas changer le comportement.
> Couvre AC-1…AC-5 de [`CH.md`](../../../../../pact/documents/CH-08-TECHNICAL-plier/CH.md).

## Étapes

- [x] `documents-plier-arbre` — AC-1, AC-2, AC-3, AC-5
- [x] suite `documents-*` verte — AC-4

## Journal

```
16/08 03:31  orch · après spec CH-08
16/08 03:34  tsk1 · documents-plier-arbre rouge (pas encore sources/backend/documents)
16/08 03:36  tsk2 · module :platform:documents · web app/documents · shims compat
16/08 03:38  tsk3 · plier-arbre vert · suite documents 27/27
```

## Rapport de livraison

ce qui a changé      conservation sous `sources/backend/documents` + `sources/web/app/documents`
critères prouvés     AC-1…3, AC-5 → `documents-plier-arbre` · AC-4 → suite `documents-*` 27/27
décidé seul          `doc-manager` `api` → documents (consommateurs print gardent l'artefact) ; changelog SQL reste dans le jar impression ; shims web à l'ancien chemin
écarts / dette       impression encore dans `doc-manager` · packages Java inchangés
