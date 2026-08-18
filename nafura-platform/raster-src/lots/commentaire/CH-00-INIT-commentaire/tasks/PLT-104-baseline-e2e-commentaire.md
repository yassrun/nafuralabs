---
id: PLT-104
status: done-me
context: nafura
type: tech
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [PLT-103]
tags: [platform, commentaire]
sprint: 2026-W34
---

# Baseline e2e commentaire

> Photographier le jar `collaboration/comment` sans le corriger. Six scénarios `commentaire-*`.

## Étapes

- [x] Photographier CommentServiceImpl (add / list / reply / update / delete)
- [x] JUnit `CommentBaselineTest` — vu-rouge puis inversion
- [x] Wrappers `e2e/commentaire/` + scan frontière produit
- [x] `node --test nafura-platform/e2e/commentaire/*.test.mjs` vert

## Journal

```
16/08 14:15  posée
17/08 21:09  sprint → 2026-W34
17/08 21:17  status → doing
17/08 21:20  tsk1  lu CH/SPEC, API comment, pattern e2e documents
17/08 21:25  tsk2  JUnit CommentBaselineTest asserts inversés
17/08 21:32  vu-rouge poster-et-lire : list empty after post → AssertionError L78
17/08 21:32  vu-rouge deux-tenants : B sees A's thread → AssertionError L93
17/08 21:32  vu-rouge auteur-seul : Bob update → ResponseStatusException 403 L104
17/08 21:32  vu-rouge retirer : row still listed → AssertionError L117
17/08 21:32  vu-rouge repondre : reply parentId null → AssertionFailedError L128
17/08 21:32  vu-rouge frontiere-produit : hits(FACTURE).length > 0 → ERR_ASSERTION
17/08 21:35  tsk3  asserts inversés (comportement actuel)
17/08 21:38  tsk4  node --test e2e/commentaire/*.test.mjs → 6 pass
17/08 21:22  status → done-agent · gate none → done-me
```

## Rapport de livraison

- **ce qui a changé** — `e2e/commentaire/` (6 tests + `_gradle.mjs`) et `CommentBaselineTest` dans le module `comment` actuel. Aucun changement du jar.
- **critères prouvés** — AC-3 → `node --test nafura-platform/e2e/commentaire/*.test.mjs` vert (6/6). AC-1/2/4/5 = spec, pas à l'exec.
- **décidé seul** — store mockito in-memory (pattern documents), pas Playwright. `entité` = `"record"` + UUID. `CommentServiceImplTest` non réutilisé (`dpgf_noeud` + pas les 6 scénarios). R-2 casse photographiée dans `auteurSeul`. Erreurs actuelles : `CrudNotFoundException` / HTTP 403, pas de code métier.
- **écarts / dette** — `CommentServiceImplTest` garde `dpgf_noeud` (hors scan main). `POL-ERREUR-CODE` non tenu en codes aujourd'hui (photographié). Widget : pas d'e2e UI (preuves CH = API/compile).
