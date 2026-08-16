# CH-02-EVOL — écriture et readiness

**Type :** `EVOL`
**Cible :** BC `work`
**Qualification :** `work` owns le schéma de la task, le promote, le sprint — mais rien n'écrit. Le seul chemin d'écriture est un agent qui tape du frontmatter à la main.

## Pourquoi

`t.mjs` expose `index`, `check`, `sweep` : trois lectures. Son en-tête annonce pourtant « orchestrator write path ». Créer une task veut donc dire composer un fichier à la main — et un agent qui compose du frontmatter à la main oublie un champ. En pratique : des `sprint:` manquants, des lignes d'inbox à la place de tasks.

À un agent, tu relis. À dix en parallèle, tu ne relis plus. `AGENTS.md` §0.1-9 tranche : le CLI est la seule voie d'écriture. Reste à l'écrire.

Deuxième trou, même racine : rien ne calcule si un bloqueur est encore ouvert. `blocked_by:` est une liste d'ids qu'on affiche en gris, `status: blocked` un enum posé à la main, et les deux ne se parlent pas. Aucune des deux ne répond à « qu'est-ce qui est lançable maintenant » — la question que l'orchestrateur posera à chaque tour.

## Aujourd'hui

`t.mjs` : `index` · `check` · `sweep`. L'allocation d'id depuis `NEXT` est réimplémentée dans `sources/web/server/raster-api.ts` (l.177), qui écrit les fichiers en direct (`fs.writeFileSync` l.297, l.451, l.487). Deux implémentations du chemin d'écriture, aucune partagée.

## Attendu

`t.mjs` gagne les commandes d'écriture, et devient le seul à écrire une task.

- `new` — alloue l'id depuis `NEXT`, pose les enums, crée le dossier, regen
- `promote` — une ligne d'inbox → une task rattachée à un dossier existant
- `sprint` — engage une task sur la semaine ISO
- `status` — change le statut, en refusant ce qui ne se pose pas à la main
- `ready` — les sous-lots lançables maintenant

## Critères d'acceptation (gelés)

- **AC-1** `new` refuse un enum hors liste, un lot inexistant, un couple `type` / `agent_type` incohérent — et n'écrit rien quand il refuse.
- **AC-2** Deux `new` consécutifs ne produisent jamais le même id, `NEXT` étant la borne haute même après un sweep.
- **AC-3** `status` refuse `done-me` : il ne se pose pas, il résulte d'une approbation (`AGENTS.md` §0.1-8). Sur `gate: none`, `done-agent` bascule seul en `done-me`.
- **AC-4** `ready` liste les sous-lots dont aucune task ne dépend d'une task ouverte **hors du sous-lot**, et exclut ceux qui portent un `blocked` externe.
- **AC-5** Toute commande qui écrit régénère INDEX · BACKLOG · SPRINT, sans qu'on ait à enchaîner `index`.
- **AC-6** `check` reste vert sur le dépôt après chaque commande.

## Preuves attendues

`raster/e2e/work/` — un test par commande, sur un dépôt temporaire : id alloué, refus qui n'écrit rien, `done-me` refusé, readiness sur un graphe à deux sous-lots.
