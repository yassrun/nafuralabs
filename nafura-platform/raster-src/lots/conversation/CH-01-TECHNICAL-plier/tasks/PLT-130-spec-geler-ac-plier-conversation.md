---
id: PLT-130
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P2
assignee: agent
gate: none
blocked_by: [PLT-129]
tags: [platform, conversation]
---

# SPEC + geler AC — plier conversation

> Geler les AC du plier conversation. Pas de patch SPEC.

## Étapes

- [x] Status `doing` via CLI
- [x] Lire CADRE · SPEC conversation (sans patch) · CH squelette · forme commentaire / approbation
- [x] Relever les 3 jars owned (includes, chemins backend/web/e2e, FQCN, routes, `test("conversation-…")`)
- [x] Trancher AC-2 (web de ce BC vs chrome shell / consommateur) — décidé seul
- [x] Préciser AC-1…5 + table Preuves (includes sous `:platform:conversation`)
- [x] Pas de patch SPEC · pas de canvas · pas de 00-PLAN · pas de nouvelle task
- [x] Journal + rapport de livraison
- [x] Status `done-agent` via CLI
- [x] `node raster/t.mjs index && node raster/t.mjs check`

## Journal

```
16/08 14:15  posée
18/08 10:13  sprint → 2026-W34
18/08 10:15  status → doing
18/08 10:22  AC précisés (3 jars sous conversation/, includes :platform:conversation:*, FQCN, 3 routes) · coupe web tranchée · SPEC intacte
18/08 10:17  status → done-agent · gate none → done-me
18/08 10:42  constat écart PLT-131 : aucun écart · SPEC intacte · pas de dette
```

## Rapport de livraison

- **ce qui a changé** — `pact/conversation/CH-01-TECHNICAL-plier/CH.md` : « Aujourd'hui » relève les 3 jars owned (`ai-conversation` · `ai-agent-api` · `ai-agent-runtime`) ; AC précisés (includes `:platform:conversation:*`, 3 routes HTTP, noms `conversation-*`) ; coupe web AC-2 écrite. SPEC intacte. Pas de canvas, pas de 00-PLAN.
- **critères prouvés** — AC gelés pour l'exec : `conversation-plier-arbre` → AC-1,2,3,5 ; suite `conversation-*` → AC-4. État initial : backend encore sous `features/ai/`.
- **décidé seul** — includes cibles = `:platform:conversation:ai-conversation` · `:platform:conversation:ai-agent-api` · `:platform:conversation:ai-agent-runtime` (`projectDir` `conversation/<jar>`). Web de ce BC = API + blocs `features/ai/ai-conversation`. Consommateur (n'entre pas) = chrome shell · `features/ai-assistant/` entier. `llm-provider` hors périmètre. Dossiers Java `ma/nafura/ai_conversation/` et `ma/nafura/ai_agent_runtime/` et FQCN `ma.nafura.platform.ai.conversation` / `ma.nafura.platform.ai.agent` restent.
- **écarts / dette** — aucun. Exec = PLT-131. Pas de question bloquante.
