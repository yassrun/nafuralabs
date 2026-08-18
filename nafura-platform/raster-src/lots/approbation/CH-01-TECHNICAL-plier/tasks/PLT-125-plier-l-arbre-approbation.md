---
id: PLT-125
status: done-me
context: nafura
type: tech
agent_type: exec
priority: P2
assignee: agent
gate: none
blocked_by: [PLT-124]
tags: [platform, approbation]
---

# Plier l arbre approbation

> 2 lignes max.

## Étapes

- [x] tsk1 — écrire `approbation-plier-arbre` (chemins) ; le voir rouge
- [x] tsk2 — bouger backend `features/collaboration/workflow` → `approbation` ; include Gradle `:platform:approbation`
- [x] tsk3 — bouger web widgets + écrans chaînes sous `app/approbation/` ; repoint imports
- [x] tsk4 — repoint `project()` / `_gradle.mjs` / `block.descriptor` → `:platform:approbation`
- [x] tsk5 — `node --test nafura-platform/e2e/approbation/*.test.mjs` vert (plier + 6 baseline)
- [x] tsk6 — rapport de livraison + `done-agent`

## Journal

```
16/08 14:15  posée
18/08 01:24  sprint → 2026-W34
18/08 01:31  status → doing
18/08 01:35  tsk1 — test de chemins écrit ; rouge : `false !== true` sur `backend/approbation/build.gradle` (arbre cible absent)
18/08 01:40  tsk2 — git mv backend → `sources/backend/approbation/` ; settings `:platform:approbation`
18/08 01:42  tsk3 — web widgets → `app/approbation/` ; chaînes → `app/approbation/workflows/` ; anciens dossiers web supprimés
18/08 01:44  tsk4 — project() webhook/notification/ai-agent-runtime + block.descriptor + _gradle.mjs + lifecycle + sektor includeBuild
18/08 01:46  tsk5 — plier-arbre vert ; suite 7/7 après invalidation du cache XML + Gradle `:platform:approbation:test`
18/08 01:41  status → done-agent · gate none → done-me
```

## Rapport de livraison

- **ce qui a changé** — backend `features/collaboration/workflow` → `sources/backend/approbation/` (include `:platform:approbation`). Web widgets sous `app/approbation/` ; écrans chaînes sous `app/approbation/workflows/`. Anciens dossiers web absents. e2e lancent `:platform:approbation:test`.
- **critères prouvés** — AC-1,2,3,5 → `approbation-plier-arbre` (rouge puis vert). AC-4 → suite `approbation-*` 6/6 verte. Commande : `node --test nafura-platform/e2e/approbation/*.test.mjs` → 7 pass / 0 fail.
- **décidé seul** — écrans chaînes en sous-dossier `app/approbation/workflows/` (même geste qu'impression/templates), widgets à la racine. `administration.routes.ts` lazy-load vers le nouveau chemin (AC-2 interdit un shim dans l'ancien dossier). Include Gradle hors BC : webhook, notification, ai-agent-runtime, `ops/lifecycle`, `sektor/.../settings.gradle.kts`. FQCN et dossier `ma/nafura/workflow/` inchangés. `features/approvals/` et le shell non avalés.
- **écarts / dette** — packages Java et routes HTTP non renommés (interdit). Inbox inchangée.
