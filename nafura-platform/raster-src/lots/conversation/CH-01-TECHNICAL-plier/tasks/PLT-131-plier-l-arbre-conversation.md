---
id: PLT-131
status: done-me
context: nafura
type: tech
agent_type: exec
priority: P2
assignee: agent
gate: none
blocked_by: [PLT-130]
tags: [platform, conversation]
---

# Plier l arbre conversation

> 2 lignes max.

## Étapes

- [x] tsk1 — e2e `conversation-plier-arbre` avant le move (vu-rouge)
- [x] tsk2 — déplacer backend `features/ai/ai-conversation` · `ai-agent-api` · `ai-agent-runtime` → `conversation/` + includes `:platform:conversation:*`
- [x] tsk3 — déplacer web `features/ai/ai-conversation` → `app/conversation` ; supprimer barrel `features/ai/index.ts` (pas de shim)
- [x] tsk4 — consommateurs Gradle / import web qui nomment l'ancien chemin ; lifecycle mapping
- [x] tsk5 — e2e `_gradle.mjs` + ROOTS frontière ; suite `conversation-*` verte

## Journal

```
16/08 14:15  posée
18/08 10:34  sprint → 2026-W34
18/08 10:35  status → doing
18/08 10:36  vu-rouge conversation-plier-arbre : false !== true — nafura-platform/sources/backend/conversation/ai-conversation/build.gradle n'existe pas (avant move)
18/08 10:37  move backend 3 jars + web ; includes :platform:conversation:ai-conversation · ai-agent-api · ai-agent-runtime ; llm-provider reste :platform:features:ai:llm-provider ; e2e Gradle :platform:conversation:ai-conversation:test
18/08 10:38  6/6 verts (5 CH-00 + plier-arbre) — gradle :platform:conversation:ai-conversation:test réel après purge du build/
18/08 10:39  status → done-agent · gate none → done-me
```

## Rapport de livraison

- **ce qui a changé** — backend `sources/backend/conversation/ai-conversation/` · `ai-agent-api/` · `ai-agent-runtime/` inclus `:platform:conversation:*` ; web `sources/web/app/conversation/` (API + blocs) ; anciens `features/ai/ai-conversation` · `ai-agent-api` · `ai-agent-runtime` (back) et `features/ai/ai-conversation/` + barrel `features/ai/index.ts` (web) disparus (pas de shim). Consommateurs : shell `platform-app-shell.component.ts` repointe `app/conversation` ; Sektor `sub("ai-*")` ; lifecycle `'ai-*' → platform:conversation:ai-*`.
- **critères prouvés** — AC-1,2,3,5 → `conversation-plier-arbre` (vu-rouge puis vert). AC-4 → suite `conversation-*` inchangée, 6/6 verts (`node --test` sur `e2e/conversation/*.test.mjs` ; JUnit via `:platform:conversation:ai-conversation:test` après purge `build/`).
- **décidé seul** — `includePlatform` (projectDir = `conversation/ai-conversation` · `conversation/ai-agent-api` · `conversation/ai-agent-runtime`). Mapping lifecycle + rangs SQL conversation=95/10 · runtime=95/20 (même geste que commentaire/notification/identite). GAV `ma.nafuralabs:ai-conversation` / `ai-agent-api` / `ai-agent-runtime` inchangés. `llm-provider` reste `:platform:features:ai:llm-provider`. Web : `git mv` permission denied → copie + `git rm` (même arbre). Imports relatifs web `../../../../core` → `../../../core`.
- **écarts / dette** — packages Java `ma/nafura/ai_conversation/` et `ma/nafura/ai_agent_runtime/` vs FQCN inchangés (hors périmètre). Chrome shell et `features/ai-assistant/` restent consommateurs. `llm-provider` non déplacé.
