# CH-03-CORRECTION — sans vue Sprint

**Type :** `CORRECTION`
**Cible :** BC `socle`
**Qualification :** le chrome porte une vue Sprint et un bouton « → Sprint » alors que le champ disparaît côté `work`.

**Politiques applicables :** `POL-FICHIER-SSOT` · `POL-VUES-GENEREES` · `POL-ECRITURE-CLI`

## Pourquoi

Une vue qui affiche un champ mort apprend une notion périmée à celui qui l'utilise. Pire : le bouton « → Sprint » est une **action**, donc une invitation à faire un geste sans effet.

La nav a déjà changé de centre de gravité — `Toi` et `En cours` en tête, parce que l'unité de pilotage est la borne. `Sprint` y traîne comme un reste.

## Aujourd'hui

Nav dans `raster/sources/web/src/App.tsx` : `Toi` · `En cours` · `Inbox` · `Backlog` · `Sprint` · `Done agent`. `ViewId` inclut `"sprint"` dans `raster/sources/web/src/api.ts`. Bouton « → Sprint » dans `BacklogRow` et dans `Detail`. Stub local `setSprint` + route `POST /api/tasks/:id/commit-sprint` dans `raster/sources/web/server/raster-api.ts` (`CH-04` a retiré `setSprint` du CLI). Champ `sprint` sur `TaskDto` / `Task`. `/api/meta` sert encore `sprint: isoWeekInfo().id`.

## Attendu

La nav perd `Sprint`. Le bouton et la route disparaissent. Le détail ne parle plus d'engagement hebdomadaire.

## Critères d'acceptation (gelés)

- **AC-1** Plus de vue `Sprint` dans la nav, ni de `ViewId` correspondant. `raster/sources/web/src/api.ts` : `ViewId` sans `"sprint"`. `raster/sources/web/src/App.tsx` : plus d'entrée `["sprint", "Sprint", …]` dans la nav ; plus de panneau `view === "sprint"` ; plus de `isSprintRow`. Le chrome n'affiche plus la semaine ISO (`orchestrateur · {sprint}`).
- **AC-2** Plus de bouton « → Sprint », ni dans l'arbre, ni dans le détail. `raster/sources/web/src/App.tsx` : plus de libellé `→ Sprint` (`BacklogRow`, `Detail`) ; plus de `onCommit` branché sur `api.commitSprint` ; le Backlog ne dit plus `Commit = sprint:` ; plus de pastille `task.sprint`.
- **AC-3** Plus de route `commit-sprint` côté serveur, ni de `commitSprint` côté client. `raster/sources/web/server/raster-api.ts` : plus de branche `commit-sprint`, plus de stub `setSprint`, PATCH `/api/tasks/:id` n'accepte plus `sprint`. `raster/sources/web/src/api.ts` : plus de `api.commitSprint` ; `patchTask` n'accepte plus `sprint`.
- **AC-4** Le DTO de task ne porte plus `sprint`. `TaskDto` dans `raster/sources/web/server/raster-api.ts` et `Task` dans `raster/sources/web/src/api.ts` : plus de champ `sprint`. `loadTasks` ne lit plus `fm.sprint`. `GET /api/meta` ne renvoie plus `sprint`.
- **AC-5** L'app charge sans erreur console et le Backlog reste utilisable (arbre lot → sous-lot → task, sans bouton Sprint).

## Preuves attendues

`raster/e2e/socle/` — test d'absence sur `raster/sources/web/src/App.tsx`, `raster/sources/web/src/api.ts` et `raster/sources/web/server/raster-api.ts`. Échoue si `commit-sprint`, `commitSprint`, `ViewId` `"sprint"` ou le libellé `→ Sprint` réapparaissent. État initial = dépôt après RAS-103 (moteur sans sprint). Le test existant `api-delegue.test.mjs` exige encore que `setSprint` soit importé : l'exec **met à jour** cette assertion. Vérification navigateur pour AC-5.

## Hors périmètre

Le champ et la commande → `work/CH-04-CORRECTION-sans-sprint` · repenser la nav · CADRE (owns / vocabulaire Sprint) — signalé inbox, pas un gate de ce CH
