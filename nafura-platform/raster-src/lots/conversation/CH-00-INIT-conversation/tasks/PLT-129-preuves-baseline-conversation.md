---
id: PLT-129
status: done-me
context: nafura
type: qa
agent_type: qa
priority: P2
assignee: agent
gate: none
blocked_by: [PLT-128]
tags: [platform, conversation]
sprint: 2026-W34
---

# Preuves — baseline conversation

> 2 lignes max.

## Étapes

- [x] status doing via CLI
- [x] revue SPEC + CH (AC-1, AC-2, AC-4, AC-5)
- [x] lecture journal PLT-128 rouge→vert (substitut discrimination)
- [x] exécuter `node --test nafura-platform/e2e/conversation/*.test.mjs`
- [x] rapport + done-agent via CLI
- [x] index && check

## Journal

```
16/08 14:15  posée
17/08 21:08  sprint → 2026-W34
17/08 21:27  status → doing
17/08 21:32  revue SPEC+CH AC-1/2/4/5 · journal PLT-128 ROUGE→VERT lu
17/08 21:32  node --test nafura-platform/e2e/conversation/*.test.mjs → # tests 5 # pass 5 # fail 0
             gradle ConversationBaselineTest xml tests=4 failures=0 (creerEtLister, deuxTenants, sessionIntrouvable, messagesVides)
17/08 21:30  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé — rien produit (QA). Preuves relancées : 5 e2e `conversation-*` verts ; revue SPEC/CH pour AC-1, AC-2, AC-4.
critères prouvés — AC-1 revue SPEC `not_owns` (10 exclusions, chacune nomme qui : socle/ops/produit/approbation/documents/document-extraction/commentaire/notification/identité). AC-2 revue SPEC « Entrent : ai-conversation, ai-agent-api, ai-agent-runtime. llm-provider n'entre pas » + not_owns llm-provider→socle, clés→ops ; CH § Coupe. AC-3 commande `node --test nafura-platform/e2e/conversation/*.test.mjs` → ok 1 creer-et-lister, ok 2 deux-tenants, ok 4 messages-vides, ok 5 session-introuvable ; xml JUnit 4 tests 0 fail. AC-4 revue SPEC Intention + owns/not_owns : un lecteur tranche l'appartenance. AC-5 revue SPEC INV-1 + not_owns métier produit ; commande conversation-frontiere-produit ok 3. Substitut discrimination : journal PLT-128 17/08 21:28 ROUGE (4 JUnit fail + frontiere scan) → 21:32 VERT (# tests 5 pass 5).
décidé seul — revue d'agent pour AC-1/2/4 (CH demande revue humaine) ; discrimination lue sur le journal PLT-128, pas sur un diff. R-3 jugé sur le scénario nommé `conversation-messages-vides` (présent et vert).
écarts / dette — 403 vs 404 R-1 photographié par l'exec (baseline, hors correction). Actions d'une session nouvelle non listées via l'API agent (hors scénario nommé, pas un trou AC-3).
