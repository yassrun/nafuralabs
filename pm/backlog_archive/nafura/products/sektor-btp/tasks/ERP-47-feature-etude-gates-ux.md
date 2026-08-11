---
id: ERP-47
status: done
context: nafura
kind: feature
priority: P0
assignee: either
gate: me
feature: etude-gates-ux
tags: [sektor, etudes, bug, ux]
---

# Feature — UX gates dossier étude (QA DE-0001)

> Parapluie bugs UX du wizard dossier (Documents → Bordereau → Coût → Synthèse) :
> gates opaques, messages bruts, KPI trompeurs, faux positifs extraction.
> Repro de référence : DE-0001 (qa-local), étape Bordereau après extraction BDP.

## Enfants
- ERP-48 — Gate actionnable + focus nœud dans l’arbre
- ERP-49 — i18n clés `etudes.gate.*`
- ERP-50 — KPI Anomalies agrégées / non actionnables
- ERP-51 — Faux positifs `code_duplique` (OCR / listes)
- ERP-52 — Polish header / shell / post-extraction

## Contexte QA (11/08)
Tour Cursor QA Mode B sur DE-0001. État observé : 37 gates bordereau
(36× code dupliqué + 1× lot vide), 182× coût unitaire manquant, 182× prix
absent → KPI Anomalies **401**. Bannière gate sans liste ni jump nœud.

## Journal
```
11/08 11:25  QA Mode B DE-0001 OK · done (agent gate:qa)
11/08 11:06  créé · QA parcours étude DE-0001 · parapluie bugs gates UX
```
