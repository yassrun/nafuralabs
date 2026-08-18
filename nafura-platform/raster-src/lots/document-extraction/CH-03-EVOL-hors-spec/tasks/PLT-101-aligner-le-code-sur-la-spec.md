---

id: PLT-101
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [PLT-100]
tags: [platform, extraction]
---

# Aligner le code sur la SPEC

> 2 lignes max.

## Étapes

- [x] tsk1 — Cartographier le surface exposé (builder compose / workflow décider)
- [x] tsk2 — Écrire `extraction-builder-hors-contrat` et `extraction-workflow-hors-contrat` ; preuve rouge-avant
- [x] tsk3 — Retirer l'exposé backend (builder, versioning, propose-schema, WorkflowTransition)
- [x] tsk4 — Retirer l'exposé front (routes builder, clients compose/décider, CTA Valider/Créer un type)
- [x] tsk5 — Relancer les 2 e2e (vert) + suite `lecture-*` (reste verte)
- [x] tsk6 — Rapport de livraison ; status `review`

## Journal

```
16/08 14:15  posée
16/08 14:23  sprint → 2026-W33
16/08 14:28  status → doing
16/08 14:35  tsk1  surface : DocTypeBuilderEngine + DocTypeVersioningService +
             propose-schema ; WorkflowTransitionService + /api/extractions/validate +
             DocumentWorkflowService.validate/reject ; routes /doc-types builder.
             GET catalog / extract + doutes R-5 restent (lecture, pas compose/décider).
16/08 14:42  tsk2  e2e écrits. Rouge-avant (node --test) : 2 fail —
             builder still on disk (6 fichiers) ; decision workflow still on disk (3 fichiers).
16/08 14:55  tsk3–4  retiré l'exposé compose/décider (back + front). Pas de drop Liquibase
             (changelog vide ; colonnes persist lecture conservées).
16/08 15:05  tsk5  hors-contrat verts. lecture-* : 5/5 verts (JUnit relancé, pas le cache XML).
16/08 14:34  status → review
16/08 14:45  constat spec : SPEC inchangée. AC-3 tenable (plus d'exposé compose / décider).
             GET /api/doc-types + lookup schéma : aligné (reçoit, ne compose pas).
             Validation champs / doutes R-5 : aligné. Outcome REJECTED pipeline : aligné
             (échec d'extraction = échouée, pas un refus utilisateur).
             Colonnes JPA workflow_status / builder_state + i18n validate/workflow : dette
             (inbox déjà). Pas de drop Liquibase : même dette. AC-4 tenable (lecture-* en place).
             Pas de retour exec. PLT-101 reste review. QA peut partir (PLT-102).
16/08 14:41  QA PLT-102 : pass. AC-1..4 prouvés. Rouge-avant consigné.
16/08 14:40  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé      Plus rien d'exposé qui compose un type (builder, versioning, propose-schema, routes /doc-types, CTA créer) ni qui décide un résultat (WorkflowTransition, /validate, Valider/Refuser). Lecture + doutes R-5 inchangés.
critères prouvés     AC-3 → `extraction-builder-hors-contrat` + `extraction-workflow-hors-contrat` (rouge avant / vert après). AC-4 → suite `lecture-*` 5/5 verte.
décidé seul          GET `/api/doc-types` + lookup schéma pour extraire : conservés (reçoit le schéma, ne le compose pas). Validation de champs / doutes : conservée. Colonnes JPA `workflow_status` / `builderState` : laissées (persist lecture, plus d'API qui décide ou compose). Outcome `REJECTED` du pipeline stateless = échec d'extraction, pas un refus utilisateur. Pas de drop de table.
écarts / dette       Colonnes workflow/builderState encore en base — ligne inbox. Libellés i18n « validate/workflow » encore présents (plus d'action décider).
