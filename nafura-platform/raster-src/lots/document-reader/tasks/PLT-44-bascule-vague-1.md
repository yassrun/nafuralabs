---
id: PLT-44
status: done-agent
context: nafura
type: feature
priority: P1
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [PLT-43]
tags: [platform, documents, doc-extractor]
---

# Bascule vague 1 — liste puis arbre

> Forme par forme : `liste` (5 écrans câblés) puis `arbre` (lots de chantier + bordereau). LLM en repli.
> Couvre **AC-1** · **AC-2** · **AC-6** de [`LOT.md`](../LOT.md). Hors lot : facture / offre / pointage (vagues 2–3).

## Étapes

- [x] Bascule `liste` : clients, fournisseurs, employés, articles, ouvrages — lignes créées, LLM seulement si le validateur refuse le plan
- [x] Bascule `arbre` : lots de chantier + bordereau — étalon 703 articles vert
- [x] Vérifier qu’aucun trigger `smart-import` déjà câblé ne régresse

## Journal

```
14/08 19:52  spec · mesure par forme, pas par écran · écrans nouveaux = autre lot
14/08 19:55  orch · sprint 2026-W33
14/08 21:33  orch · PLT-43 done-agent (QA PLT-47) → PLT-44 doing
14/08 21:34  tsk1  liste = déjà GridProbe+Plan ; preuve xlsx clients FR 0 LLM · entitykey pour e2e
14/08 21:34  tsk2  arbre LEARNED générique (lots/children/postes) — pas DpgfNoeud
14/08 21:34  décision  bordereau reste pile etudes (classifieur BTP) pour garder AC-1 ; platform n'interprète pas le bordereau
14/08 21:36  preuve  listClientSpreadsheetUsesHeuristicPlanWithoutCallingLlm VERT
14/08 21:36  preuve  learnedHierarchyNestsLeavesUnderGroupsWithoutFlattening VERT
14/08 21:36  preuve  GridBordereauPipelineTest + orchestrator + adapter VERT
14/08 21:36  tsk3  host attr entitykey = definition.key (e2e smart-import-platform)
14/08 21:38  spec · constat d'écart PLT-44 : LOT.md AC-1/2/6 inchangés. Liste = plan heuristique. Arbre LEARNED générique. Bordereau non basculé sur ReadingPlan (classifieur BTP reste etudes). Pas de retour exec.
14/08 21:50  qa · PLT-48 pass → done-agent
```

## Rapport de livraison

ce qui a changé      voir PLT-48
critères prouvés     voir PLT-48
décidé seul          voir PLT-48
écarts / dette       voir PLT-48

