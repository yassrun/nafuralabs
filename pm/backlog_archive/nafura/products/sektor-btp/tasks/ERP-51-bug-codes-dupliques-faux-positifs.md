---
id: ERP-51
status: done
context: nafura
kind: task
priority: P1
assignee: agent
gate: qa
parent: ERP-47
feature: etude-gates-ux
sprint: 2026-W33
tags: [sektor, etudes, bug, extraction]
---

# Bug — Gate `code_duplique` sur bruit OCR (a), 1, a…)

> Sur DE-0001, 36/37 problèmes bordereau sont des « doublons » de codes triviaux
> (`a)`, `1`, `a`, …) issus de marqueurs de liste / extraction BDP — pas de vrais
> codes article métier. Bloque « Continuer vers le coût » de façon disproportionnée.

## Repro
1. Extraction auto BDP-2-17.pdf sur DE-0001
2. `GET /api/v1/etudes/dossiers/{id}/gates` · étape 2
3. Observer groupes `codeArticle` triviaux répétés

## Attendu / obtenu
- **Attendu** : gate sur vrais codes métier ; bruit d’extraction filtré ou normalisé à l’import
- **Obtenu** : chaque occurrence de `a)` / `1` flaggée → 36 points bloquants

## Critères d'acceptation
- [x] Décision tranchée (doc courte dans le ticket ou commentaire ADR) : filtre gate **ou** nettoyage extraction
- [x] Sur DE-0001 (ou fixture BDP équivalent) : plus de blocage massif sur marqueurs de liste
- [x] Vrais doublons métier (ex. deux `1-1-1`) restent bloquants
- [x] Test unitaire gate et/ou extraction couvrant le cas

## Journal
```
11/08 11:25  QA Mode B DE-0001 OK · done (agent gate:qa)
11/08 11:06  capturé QA DE-0001 · 36× code_duplique triviaux
```
