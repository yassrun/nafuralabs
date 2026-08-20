# CH-04-EVOL — les volets Plan et Session

**Type :** `EVOL`
**Cible :** BC `socle`
**Qualification :** l'app montre un arbre de rangement et une sortie de processus. Elle ne montre ni ce qui est prévu, ni ce qui part.

**Politiques applicables :** `POL-FICHIER-SSOT` · `POL-VUES-GENEREES`

## Pourquoi

L'objectif tient en une phrase : *un geste ouvre une session, elle avance sans toi, tu la regardes avancer.* Le troisième tiers n'existe pas. Sans progrès visible, « ça avance sans toi » ne se distingue pas de « ça ne fait rien ».

`Backlog` affiche `projet → lot → sous-lot → task` — une **contenance**, présentée comme une file. Une contenance ne dit rien sur l'ordre. `En cours` affiche `r.sortie`, le tampon brut du processus : on y lit ce que l'agent écrit, jamais où il en est.

Décision du 18/08 : deux volets. **Plan** au grain du lot, **Session** au grain du sous-lot — parce que c'est le sous-lot qui se lance, un agent et un worktree chacun.

## Aujourd'hui

`raster/sources/web/src/api.ts` — `ViewId` = `toi` | `encours` | `inbox` | `backlog` | `done-agent`.

`raster/sources/web/src/App.tsx` — nav `Toi` · `En cours` · `Inbox` · `Backlog` · `Done agent`. `Backlog` groupe par `lot // souslot` et pose un badge « ▸ lançable » via `ReadyMark`. `EnCoursView` rend `running` + `recent` + un `<pre>` de sortie. `OrchLaunchButton` copie `orchLaunchBrief(...)` dans le presse-papier quand `spawnPret` est faux — et il n'est pas câblé à `spawnPret` dans `Rows`, donc il copie même quand le serveur saurait lancer.

L'arbre ne se rafraîchit que par le bouton « Synchro » ; le sondage à 2 s ne recharge que `running`.

## Attendu

`Plan` remplace `Backlog` : les lots de la fenêtre, chacun dans son état, la borne visible, l'arbre en dépliant. `Session` remplace `En cours` : le front, ce qui tourne, et l'avancement par task.

## Critères d'acceptation (gelés)

- **AC-1** Nav = `Toi` · `Session` · `Plan` · `Inbox` · `Done agent`. `ViewId` suit. Plus de `backlog` ni de `encours`.
- **AC-2** `Plan` liste les lots de la fenêtre avec leur état (`clos` | `non-decoupe` | `bloque` | `lancable`), et marque la **borne** — ce qui est en dessous est montré comme fermé, pas caché.
- **AC-3** Un lot `non-decoupe` le dit à l'écran, et se distingue d'un lot clos. C'est le seul endroit où l'app te réclame un découpage.
- **AC-4** `Session` montre le **front** : un sous-lot par ligne, son nombre de tasks restantes, et pour un sous-lot bloqué la **raison** (`attend RAS-n`), pas seulement une croix.
- **AC-5** Pendant qu'une session tourne, `Session` montre l'avancement par task — id, type, statut — et pas seulement la sortie du processus. Le rafraîchissement est automatique, sans « Synchro ».
- **AC-6** **Un seul bouton lance.** Il lance une session sur le front, jamais un agent de sous-lot. Sans `RASTER_AGENT_CMD` il est désactivé et dit pourquoi ; il ne copie plus rien dans le presse-papier.
- **AC-7** L'app charge sans erreur console, et `Plan` reste utilisable sur un projet sans `ROADMAP.md` (fenêtre vide, dit comme tel).

## Preuves attendues

`raster/e2e/socle/` — test d'absence sur `App.tsx` / `api.ts` : plus de `ViewId` `"backlog"` ni `"encours"`, plus de `navigator.clipboard` dans le chemin de lancement. Vérification navigateur pour AC-2 → AC-5 sur un dépôt portant au moins un lot lançable et un lot bloqué.

## Hors périmètre

Le calcul des états et le lancement → `orchestration/CH-02-EVOL-plan-et-session` · l'inbox et la capture, inchangées · le détail de task, inchangé
