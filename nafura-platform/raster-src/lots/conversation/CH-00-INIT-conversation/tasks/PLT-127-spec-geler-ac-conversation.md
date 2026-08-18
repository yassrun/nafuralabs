---
id: PLT-127
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P1
assignee: agent
gate: none
tags: [platform, conversation]
---

# SPEC + geler AC — conversation

> Premier contrat du BC conversation : SPEC de baseline + AC gelés. Pas de code.

## Étapes

- [x] Status `doing` via CLI
- [x] Lire CADRE · CH · socle · un SPEC existant (documents) · le code des 4 jars
- [x] Écrire SPEC.md (coupe jars + not_owns + règles actuelles)
- [x] Préciser / geler AC + scénarios e2e + état initial dans CH.md
- [x] Journal + rapport de livraison
- [x] Status `done-agent` via CLI
- [x] `node raster/t.mjs index && node raster/t.mjs check`

## Journal

```
16/08 14:15  posée
17/08 21:08  sprint → 2026-W34
17/08 21:09  status → doing
17/08 21:20  SPEC.md créée · AC gelés · coupe llm-provider → socle
17/08 21:13  status → done-agent · gate none → done-me
17/08 21:30  constat écart PLT-128 : R-1 patché (403 tenant ≠ 404 id inconnu) · R-3 précisé (messages vides ; actions absentes tant qu'aucun tour) · inbox POL-ERREUR-CODE / ARCHIVED-CLOSED / actions non listées via API agent
```

## Rapport de livraison

ce qui a changé — `pact/conversation/SPEC.md` créée ; `CH.md` : coupe jars + AC précisés (scénarios e2e, POL, canvas aucun).
critères prouvés — AC-1, AC-2, AC-4, AC-5 écrits et gelés (revue) ; AC-3 nommé pour PLT-128, pas exécuté ici.
décidé seul — jars `ai-conversation` · `ai-agent-api` · `ai-agent-runtime` entrent ; `llm-provider` → **socle** (déjà consommé par document-extraction) ; clés / prestataire vivant → **ops**.
écarts / dette — socle n'a pas encore la capacité « appeler un modèle » ni `P-CONVERSATION-*` (CH-09 : tenant / erreurs / matrice seulement) ; erreurs actuelles = HTTP + texte, pas un code ; `ARCHIVED`/`CLOSED` sans transition exposée.
