# Spawn et worktree

> Le dernier maillon : Raster cesse de copier un brief et lance pour de vrai.

## Verdict

Tout le reste est en place — fenêtre, borne, readiness, skill, agents, panneau de décision. Il manque la seule chose qui rend l'autonomie réelle : quelqu'un qui appuie sur le bouton à ta place.

## Constat

- `OrchLaunchButton` copie un texte dans le presse-papier ; l'autonomie s'arrête donc à ta présence
- Aucun worktree : deux agents lancés en parallèle écriraient dans le même répertoire
- Aucun état d'exécution, donc pas de vue « ce qui tourne » — dernier constat de la revue resté ouvert

## Approche technique

`worktree.mjs` d'abord : sans isolation, lancer serait pire que ne pas lancer. Puis `spawn.mjs`, qui ne connaît pas git — il délègue l'isolation et se contente de tenir un processus par lot. Puis l'UI, qui n'est qu'un rendu de cet état.

Deux règles de sûreté portées par le code, pas par la discipline : le défaut est **fermé** (pas de `RASTER_AGENT_CMD`, pas de lancement), et `spawn.mjs` n'invoque **jamais** git — donc il ne peut pas pousser.

## Tasks

| # | Task | blocked_by | // OK |
|---|------|------------|-------|
| 1 | RAS-95 worktree par sous-lot | — | non |
| 2 | RAS-96 spawn d'un orchestrateur (`gate: me`) | 1 | non |
| 3 | RAS-97 vue Ce qui tourne | 2 | non |
| 4 | RAS-98 consolider `orchestration/SPEC.md` | 2, 3 | non |
| 5 | RAS-99 QA | 4 | non |

Rien de parallélisable : chaque étage repose sur le précédent.

## Couverture

Couvre `AC-1` → `AC-6` de [`CH.md`](../../../../pact/orchestration/CH-01-EVOL-spawn-worktree/CH.md).
Non couvert : le merge sous-lot → lot → intégration. Il est décrit dans `AGENTS.md` §7 mais reste **manuel** — c'est un geste qui touche l'intégration, et rien ne prouve encore qu'un agent puisse le faire sans surveillance.

## Décisions ouvertes

Aucune — le CH est fermé.
