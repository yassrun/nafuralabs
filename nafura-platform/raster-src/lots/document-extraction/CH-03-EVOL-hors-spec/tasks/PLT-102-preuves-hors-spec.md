---
id: PLT-102
status: done-me
context: nafura
type: qa
agent_type: qa
priority: P2
assignee: agent
gate: none
blocked_by: [PLT-101]
tags: [platform, extraction]
sprint: 2026-W33
---

# Preuves — hors spec

> 2 lignes max.

## Étapes

- [x] Revue SPEC AC-1 / AC-2
- [x] Vérifier rouge-avant consigné (PLT-101)
- [x] Exécuter `node --test` e2e ; forcer Gradle si cache XML
- [x] Relier chaque AC à un pass/fail exécuté
- [x] Rapport de livraison

## Journal

```
16/08 14:15  posée
16/08 14:23  sprint → 2026-W33
16/08 14:38  status → doing
16/08 14:41  revue SPEC AC-1/AC-2 : not_owns builder → le produit ;
             workflow décider → contexte Approbation (non spécifié).
             Rouge-avant PLT-101 consigné (14:42 tsk2 : 2 fail, builder 6 fichiers
             / workflow 3 fichiers).
16/08 14:41  1er node --test : 7/7 pass — XML JUnit daté 13:33Z (pas ce Change).
             Cache écarté. Gradle --rerun-tasks : BUILD SUCCESSFUL 19s,
             6 JUnit, 0 fail (timestamp 13:40:09Z).
16/08 14:41  2e node --test : 7/7 pass (fail 0). Verdict pass.
16/08 14:40  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      Preuves CH-03 exécutées. Aucun code produit, aucun e2e, aucune SPEC touchés.
critères prouvés     AC-1 → revue `pact/document-extraction/SPEC.md` § Limites `not_owns` : « Composer, cataloguer ou versionner un type de document (builder…) ». AC-2 → même tableau : builder → **le produit** ; décider (brouillon / validé / refusé) → **contexte Approbation** (non spécifié). AC-3 → `node --test nafura-platform/e2e/document-extraction/*.test.mjs` : `extraction-builder-hors-contrat` ok, `extraction-workflow-hors-contrat` ok. AC-4 → même commande : 5 `lecture-*` ok ; Gradle forcé `:platform:document-extraction:test --rerun-tasks` BUILD SUCCESSFUL, 6 JUnit, failures=0.
décidé seul          XML JUnit 13:33Z rejeté comme preuve de ce Change. Gradle relancé avec `--rerun-tasks` avant le 2e `node --test`. Dette JPA/i18n non bloquante (consigne : ne pas fail si AC-3/AC-4 passent).
écarts / dette       Colonnes JPA `workflow_status` / `builder_state` encore en base + libellés i18n validate/workflow — inbox déjà (JPA) ; i18n ajoutée. Pas de trou d'AC.
