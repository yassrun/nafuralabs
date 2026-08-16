---
id: RAS-86
status: done-me
context: nafura
type: tech
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [RAS-85]
tags: [raster, skill, agents]
---

# Skill `orchestration` + agents

> La boucle, et les rôles qu'elle lance. Aucune règle recopiée.
> Couvre AC-3 · AC-4 de [`CH.md`](../../../../../pact/orchestration/CH-00-INIT-conduite/CH.md).

## Étapes

- [x] `.claude/skills/orchestration/SKILL.md` — les six étapes de `AGENTS.md` §7, par renvoi
- [x] `.claude/agents/exec.md` — un sous-lot, tasks en série, pose `review` sur feature/bug
- [x] `.claude/agents/spec.md` — SPEC + UX, jamais de code
- [x] `.claude/agents/qa.md` — preuves et verdict, seul à poser `done-agent`
- [x] Vérifier : aucune règle d'`AGENTS.md` recopiée, uniquement des renvois

## Journal

```
16/08  posée
16/08 13:32  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      `.claude/skills/orchestration/SKILL.md` · `.claude/agents/{exec,spec,qa}.md` — quatre fichiers neufs
critères prouvés     AC-3 le skill ne contient aucune règle : il renvoie à `AGENTS.md` §7 et à `pact/orchestration/SPEC.md`, et ouvre en le disant · AC-4 les trois rôles portent leur interdit — l'exec ne pose pas `done-agent` sur feature/bug, le qa ne corrige pas, le spec ne code pas
décidé seul          le skill dit explicitement qu'une fenêtre vide est un **arrêt normal**, pas une panne — sans ça un agent zélé chercherait à élargir lui-même · les agents renvoient aux règles par lien relatif, donc un fichier déplacé casse visiblement au lieu de diverger en silence
écarts / dette       `skillForAgentType` dans `agent-type.mjs` et `sources/web/src/api.ts` pointe encore `nafura-spec` / `nafura-exec` / `nafura-qa`, qui n'existent pas — à corriger avec l'UI (lot `socle`)
