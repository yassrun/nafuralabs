# CH-02-EVOL — Plan et Session

**Type :** `EVOL`
**Cible :** BC `orchestration`
**Qualification :** la conduite sait calculer une fenêtre et une readiness, mais rien ne les nomme, et le lancement ne transmet aucun ordre à l'agent.

**Politiques applicables :** `POL-FICHIER-SSOT` · `POL-VUES-GENEREES` · `POL-ECRITURE-CLI` · `POL-SANS-BASE`

## Pourquoi

Trois décisions du 18/08 (`AGENTS.md` §7) n'ont aucun code : le **graphe** (nœud = sous-lot), l'**amorçage** (un lot non découpé n'est pas un lot fini), la **session** (un orchestrateur prend tout le front).

La conséquence est mesurable. Sur `nafura-platform`, neuf lots sont au-dessus de la borne et `window` rend `lancables: []` pour tous — sans jamais dire que la cause n'est pas « c'est fini » mais « personne n'a coupé ». L'orchestrateur applique l'arrêt normal et rend la main. Aucune session ne démarre.

Et quand bien même il en démarrerait une : `start()` n'écrit sur stdin que `if (brief && …)`, et `/api/run` ne passe jamais de brief. L'agent reçoit un stdin ouvert et vide, donc il attend une entrée qui ne viendra pas.

## Aujourd'hui

`raster/roadmap.mjs` — `window_(project)` rend `{ lot, existe, lancables, bloques }`. `existe` vaut faux quand aucune task n'est trouvée : un lot **clos** et un lot **non découpé** rendent donc la même chose.

`raster/ready.mjs` — `readiness()` calcule le bon verdict au bon grain, sous le nom `ready`. Aucune vue ne le présente comme un ensemble.

`raster/spawn.mjs` — état `Map` clé `<project>//<lot>`, un orchestrateur par lot. `start({ project, lot, souslot, brief })` : `child.stdin` n'est écrit **et fermé** que si `brief` est non vide.

`raster/t.mjs` — `ready` · `window` · `run <projet> <lot> [CH]` · `running` · `stop <projet> <lot>`.

`raster/sources/web/server/raster-api.ts` — `POST /api/run` appelle `startLot({ project, lot, souslot })`, **sans brief**.

## Attendu

`plan` dit dans quel état est chaque lot de la fenêtre. `front` nomme l'ensemble lançable. `session` lance **un** orchestrateur sur ce front, avec un ordre écrit.

## Critères d'acceptation (gelés)

- **AC-1** `window_` classe chaque lot de la fenêtre dans un état fermé et unique : `clos` | `non-decoupe` | `bloque` | `lancable`. `non-decoupe` = le lot n'a aucun sous-lot ouvert **et** n'a jamais eu de task ; `clos` = il en a eu, toutes closes. Les deux cessent d'être indiscernables.
- **AC-2** `node raster/t.mjs plan <projet>` rend ces quatre états, en texte et en `--json`. `window` reste accepté comme alias.
- **AC-3** `node raster/t.mjs front <projet>` rend les sous-lots lançables de la fenêtre. `ready` reste accepté comme alias. Rien n'est stocké : deux appels successifs sans mutation rendent le même résultat.
- **AC-4** `start()` **refuse** de lancer sans brief non vide, et ferme toujours `stdin` après l'avoir écrit. Un agent lancé ne peut pas se retrouver en attente d'une entrée qui ne vient pas.
- **AC-5** Le brief est composé par Raster, pas par l'UI : il porte le projet, la fenêtre, le front, et le renvoi au skill `orchestration`. Un seul générateur — l'UI n'en écrit aucun.
- **AC-6** `node raster/t.mjs session start <projet>` lance **un** orchestrateur sur le front. `session` rend son état, `session stop` l'arrête. L'état reste **en mémoire** : un processus mort ne laisse aucun `doing` menteur.
- **AC-7** Deux sessions ne tournent pas sur le même projet. L'exclusion porte sur le **sous-lot** (un agent, un worktree), plus sur le lot.

## Preuves attendues

`raster/e2e/orchestration/` — `computeWindow` pur sur des tasks fabriquées : un lot sans task, un lot tout `done-me`, un lot bloqué par une arête sortante, un lot lançable → quatre états distincts. Refus de `start()` sans brief. `stdin` fermé après écriture. Alias `window`/`ready` toujours acceptés.

## Hors périmètre

Les volets à l'écran → `socle/CH-04-EVOL-volets-plan-session` · l'agent qui **coupe** un lot non découpé (l'amorçage produit ici la **détection**, pas le découpage) · `session merge` : on a décidé où atterrit le travail, pas qui exécute le merge — signalé inbox.
