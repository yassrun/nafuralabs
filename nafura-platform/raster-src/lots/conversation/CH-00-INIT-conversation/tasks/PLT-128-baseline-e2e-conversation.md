---
id: PLT-128
status: done-me
context: nafura
type: tech
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [PLT-127]
tags: [platform, conversation]
---

# Baseline e2e conversation

> 2 lignes max.

## Étapes

- [x] status doing via CLI
- [x] lire CH + SPEC + code session
- [x] écrire les 5 e2e ; preuve rouge→vert pour chacun
- [x] `node --test nafura-platform/e2e/conversation/*.test.mjs` vert
- [x] journal + rapport de livraison (4 lignes)
- [x] status done-agent via CLI (gate none → done-me, CLI)
- [x] index && check

## Journal

```
16/08 14:15  posée
17/08 21:08  sprint → 2026-W34
17/08 21:15  status → doing
17/08 21:20  CH+SPEC+ConversationService lus. Tests existants (ConversationTitleServiceTest, AiSchemaContextTest, runtime intent) n'assertent pas R-1/R-2/R-3/INV-1 → harnais ConversationBaselineTest.
17/08 21:28  ROUGE (assert inverse)
             .\gradlew.bat :platform:features:ai:ai-conversation:test --tests ma.nafura.platform.ai.conversation.ConversationBaselineTest
             ConversationBaselineTest > sessionIntrouvable() FAILED  ResponseStatusException
             ConversationBaselineTest > messagesVides() FAILED  AssertionError
             ConversationBaselineTest > deuxTenants() FAILED  AssertionError
             ConversationBaselineTest > creerEtLister() FAILED  AssertionError
             4 tests completed, 4 failed
             node --test conversation-frontiere-produit.test.mjs
             not ok 1 — Expected "actual" not to be strictly deep-equal to: []  (scan vide)
17/08 21:32  VERT (asserts inversés)
             même gradle → BUILD SUCCESSFUL  4 tests
             node --test nafura-platform/e2e/conversation/*.test.mjs
             # tests 5  # pass 5  # fail 0
17/08 21:21  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé — 5 wrappers `e2e/conversation/conversation-*.test.mjs` + `_gradle.mjs` ; harnais JUnit `ConversationBaselineTest` (creerEtLister, deuxTenants, sessionIntrouvable, messagesVides). Pas de changement métier.
critères prouvés — AC-3 : gradle ConversationBaselineTest vert puis `node --test nafura-platform/e2e/conversation/*.test.mjs` → 5 pass (R-1 liste/lire personne×tenant, R-2 B ne liste pas A, R-3 messages vides, INV-2 session.tenantId). AC-5 : scan FACTURE/CHANTIER/DpgfNoeud vide sur ai-conversation, ai-agent-api, ai-agent-runtime, web ai-conversation (pas llm-provider).
décidé seul — harnais JUnit in-memory (TenantContext A/B, pas d'HTTP ni LLM). Lire A depuis B photographié comme `ResponseStatusException` (code actuel 403 tenant mismatch, pas le 404 d'un id inconnu). R-3 actions : create n'écrit que la session ; pas de harnais `AgentRuntimeService.listConversationActions` (pas de tour). Frontière = scan sources, pas JUnit.
écarts / dette — tests existants titre/schéma ne couvrent pas les AC ; 403 vs 404 R-1 non corrigé (baseline). Actions d'une session nouvelle non listées via l'API agent.
