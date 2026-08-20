# Plan et Session

> Ce Change rend vrai : un lot non découpé se voit, le front a un nom, et une session part avec un ordre écrit.

## Verdict

Le lancement est la seule chose qui manque pour que quoi que ce soit d'autre soit **testable**. Tant qu'aucun agent ne tourne, aucun statut ne bouge, donc il n'y a pas de progrès à afficher — et « ça avance sans toi » ne se distingue pas de « ça ne fait rien ».

Mais on ne peut pas lancer dans le vide : `ready` rendait `0 ouvert` sur tout le dépôt. La détection d'un lot **non découpé** vient donc avant le lancement, sinon l'orchestrateur s'arrête toujours au même endroit sans savoir pourquoi.

## Constat

- `window_` ne distingue pas « clos » de « non découpé » : les deux rendent `lancables: []`
- `/api/run` appelle `startLot()` sans brief, et `start()` ne ferme `stdin` que s'il y a un brief — l'agent attend une entrée qui ne vient jamais
- l'état de `spawn.mjs` est clé par lot, alors que l'exclusion réelle porte sur le worktree, donc sur le sous-lot
- `ready` et `window` calculent juste ; ce sont leurs **noms** qui ne correspondent à rien de visible

## Approche technique

`roadmap.mjs` d'abord — c'est de la classification pure, testable sans dépôt, et tout le reste s'appuie dessus pour savoir quoi lancer.

Puis le brief : un générateur unique dans le moteur, pas dans l'UI. `orchLaunchBrief` vit aujourd'hui dans `sources/web/src/api.ts` ; un brief écrit côté client ne peut pas servir à la ligne de commande, et deux générateurs divergent.

Puis `spawn.mjs` : re-clé par sous-lot, `start()` qui **refuse** sans brief. Le refus est ce qui transforme un blocage silencieux en erreur lisible.

`t.mjs` en dernier — il n'est qu'une façade : `plan`, `front`, `session start|stop`, les anciens noms gardés en alias pour ne pas casser le skill et les agents pendant la bascule.

## Tasks

| # | Task | blocked_by | // OK |
|---|------|------------|-------|
| 1 | RAS-107 SPEC + geler AC (`gate: me`) | — | non |
| 2 | RAS-108 `plan` : quatre états de lot | 1 | non |
| 3 | RAS-109 `session start` + brief sur stdin | 2 | non |
| 4 | RAS-110 QA — une session lance, les statuts bougent | 3 | non |

Rien de parallélisable : chaque étage repose sur le précédent. `socle/CH-04` attend RAS-107 et part en parallèle dès qu'il est rendu — c'est la seule arête sortante du sous-lot.

## Couverture

Couvre `AC-1` → `AC-7` de [`CH.md`](../../../../pact/orchestration/CH-02-EVOL-plan-et-session/CH.md).
Non couvert : l'agent qui **coupe** un lot non découpé. Ce CH produit la détection ; le découpage lui-même demande un `spec` lancé avec un périmètre d'écriture, et rien ne prouve encore qu'il tienne sans surveillance.

## Décisions ouvertes

`session merge` — on a décidé que le travail atterrit sur `session/<projet>-<date>`, pas qui exécute le merge : le CLI, comme pour l'écriture des tasks, ou l'agent en appelant `git`. Hors périmètre ici.
