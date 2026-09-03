# Harness Raster — Spec → Code → Done

Ce document décrit l’exécution d’une sous-session. Le moteur et les enums vivent dans [`AGENTS.md`](AGENTS.md).

## Frontière humaine

L’humain intervient uniquement pour :

1. discuter et capturer dans l’Inbox ;
2. promouvoir la demande ;
3. envoyer un sous-lot de Ready vers Session.

Une fois lancée, la sous-session est autonome. Il n’existe ni gate, ni attente humaine, ni phase QA dédiée.

## Un sous-lot = une sous-session

```text
Session Raster
└── sous-session (un sous-lot)
    ├── phase Spec
    ├── phase Code
    └── Done
```

Raster calcule le front, démarre le harness Cursor et suit son état consolidé. Le harness choisit les workers internes et met à jour chaque Task via :

```bash
node raster/t.mjs status <id> doing
node raster/t.mjs status <id> done
```

Un échec extérieur explicite utilise `blocked`. Un échec technique relançable reste `doing` et la boucle de Session peut reprendre le harness.

## Ordonnancement

Le front suit ces règles :

1. tant qu’une Task Spec est ouverte, Code ne démarre pas ;
2. après Spec, une Task Code est exécutable lorsque ses `blocked_by` sont `done` ;
3. plusieurs Tasks Code sans dépendance ouverte forment une même vague ;
4. le sous-lot est terminé lorsque toutes ses Tasks sont `done`.

## Modes

### Local

Une seule Task Code à la fois dans le worktree du sous-lot. Ce mode évite les écritures concurrentes locales.

Le runner `@cursor/sdk` intégré s’active avec `CURSOR_API_KEY`. `RASTER_LOCAL_CMD` peut le remplacer.

### Agents

Le brief annonce toutes les Tasks Code indépendantes du front comme parallélisables. Le runner Cursor Cloud peut les confier à plusieurs agents et rend un résultat consolidé.

Le runner intégré exige aussi `RASTER_CLOUD_REPO` et accepte `RASTER_CLOUD_REF`. Il crée une PR par défaut. `RASTER_AGENTS_CMD` peut le remplacer.

Les deux runners lisent le brief sur stdin. `CURSOR_API_KEY` reste dans l’environnement.

Le runner agents répercute le résultat cloud vers le contrôleur local avec une ligne stdout :

```text
RASTER_RESULT {"done":["ID-1","ID-2"],"blocked":[]}
```

Raster n’accepte que les IDs présents dans la vague confiée. Ce protocole évite qu’un agent cloud modifie arbitrairement le graphe local.

## Boucle de Session

La boucle est mécanique :

```text
recalculer Ready et les Tasks
→ lancer les sous-sessions autorisées
→ suivre les runs Cursor
→ à la fin, relire les statuts
→ relancer si une nouvelle vague est exécutable
→ sortir lorsque toutes les Tasks sont done
```

Raster ne demande pas à une IA de décider de l’ordonnancement. Le graphe et les statuts suffisent.

## Validation technique

Code est responsable des tests et contrôles nécessaires à sa propre livraison. Ils restent des commandes ou scénarios techniques dans la Task et le rapport, mais ne créent plus de Task, worker ou phase QA.
