---
id: PLT-48
status: done-agent
context: nafura
type: qa
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [PLT-44]
tags: [platform, documents, doc-extractor]
---

# QA — Bascule vague 1

> Preuves de PLT-44 contre [`LOT.md`](../LOT.md) **AC-1** · **AC-2** · **AC-6**.

## Étapes

- [x] Exécuter les preuves existantes
- [x] Relier chaque AC de la slice à un pass/fail
- [x] Rapport de livraison

## Journal

```
14/08 21:39  orch · QA après constat d'écart PLT-44
14/08 21:40  preuve  :doc-extractor:test --rerun-tasks StatelessExtractionServiceTest + PlanCascadeTest VERT (7+8)
14/08 21:44  preuve  :etudes:test --rerun-tasks GridBordereauPipelineTest 7/7 (186 articles) + orchestrator 7/7 + adapter 2/2 VERT
14/08 21:46  preuve  karma extraction-definition-defaults + lot-chantier-import.handler 4/4 VERT
14/08 21:48  Mode B  5 listes câblées : entitykey fournisseur/client/employe/article/ouvrage visibles
14/08 21:48  e2e     smart-import-platform.spec.ts non jouable (Playwright ne résout pas @playwright/test hors package web)
```

## Rapport de livraison

ce qui a changé      Liste = plan heuristique 0 LLM. Arbre LEARNED (lots/children/postes) sans aplatir. Bordereau reste pile etudes. `entitykey` sur le trigger.
critères prouvés     AC-1 → GridBordereauPipelineTest « 186 articles » + orchestrator + adapter VERT · AC-2 → Mode B 5 triggers entitykey + karma 4/4 · AC-6 → xlsx heuristique 0 LLM · compile sans valeurs de lignes · PLAN_UNRESOLVED sans aplatir · CSV objet encore LLM (`returnsReviewRequiredWhenOneRequiredValueIsMissing`)
décidé seul          Bordereau non basculé sur `ReadingPlan` (classifieur BTP etudes) — AC-1 reste vert ainsi, pas un fail. Playwright e2e cassé par `testDir` hors package — AC-2 prouvé en Mode B à la place. Lots chantier non ouverts (aucun chantier QA) — skip comme l'e2e.
écarts / dette       étalon 703/4 = dette PLT-39 (preuve in-repo = 186 / BDP-2-17) · spec `entitykey` hors include karma Sektor · e2e Playwright non exécutable en l'état
