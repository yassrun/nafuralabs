---
id: RAS-113
status: done
context: nafura
type: tech
agent_type: exec
priority: P1
assignee: agent
---

# Modes local et agents + vague parallele par sous-lot

> Raster propose un mode local ou agents cloud et confie au harness le front exécutable du sous-lot.

## Étapes

- [x] Simplifier le canon en `Spec → Code → Done`.
- [x] Ajouter les modes `local` et `agents`.
- [x] Calculer une vague Code parallèle lorsque les dépendances le permettent.
- [x] Relancer automatiquement la vague suivante après progrès.
- [x] Adapter API, UI, documentation et tests.

## Journal

```
03/09 16:18  posée
03/09 16:20  status → doing
03/09 16:33  status → done
```

## Rapport de livraison

- Anciennes phases QA, gates et statuts de validation retirés du moteur et des Tasks actives.
- `RASTER_LOCAL_CMD` et `RASTER_AGENTS_CMD` sélectionnent le runner ; `RASTER_AGENT_CMD` reste l’alias local.
- Runner `@cursor/sdk` intégré ; les commandes d’environnement servent d’override.
- Mode local : une Task Code par vague. Mode agents : Tasks Code indépendantes annoncées en parallèle.
- Le runner cloud rend `RASTER_RESULT`; Raster borne les IDs puis relance le front suivant.
- Validation exécutée : 81 tests Node, build TypeScript/Vite, garde de configuration du runner et `t.mjs check`.
