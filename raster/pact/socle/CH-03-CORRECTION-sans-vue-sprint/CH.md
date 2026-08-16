# CH-03-CORRECTION — sans vue Sprint

**Type :** `CORRECTION`
**Cible :** BC `socle`
**Qualification :** le chrome porte une vue Sprint et un bouton « → Sprint » alors que le champ disparaît côté `work`.

## Pourquoi

Une vue qui affiche un champ mort apprend une notion périmée à celui qui l'utilise. Pire : le bouton « → Sprint » est une **action**, donc une invitation à faire un geste sans effet.

La nav a déjà changé de centre de gravité — `Toi` et `En cours` en tête, parce que l'unité de pilotage est la borne. `Sprint` y traîne comme un reste.

## Aujourd'hui

Nav : `Toi` · `En cours` · `Inbox` · `Backlog` · `Sprint` · `Done agent`. Bouton « → Sprint » dans le Backlog et dans le détail. `api.commitSprint`, route `/api/tasks/:id/commit-sprint`, champ `sprint` dans le DTO.

## Attendu

La nav perd `Sprint`. Le bouton et la route disparaissent. Le détail ne parle plus d'engagement hebdomadaire.

## Critères d'acceptation (gelés)

- **AC-1** Plus de vue `Sprint` dans la nav, ni de `ViewId` correspondant.
- **AC-2** Plus de bouton « → Sprint », ni dans l'arbre, ni dans le détail.
- **AC-3** Plus de route `commit-sprint` côté serveur, ni de `commitSprint` côté client.
- **AC-4** Le DTO de task ne porte plus `sprint`.
- **AC-5** L'app charge sans erreur console et le Backlog reste utilisable.

## Preuves attendues

`raster/e2e/socle/` — test d'absence sur `src/` et sur le serveur. Vérification navigateur pour AC-5.

## Hors périmètre

Le champ et la commande → `work/CH-04-CORRECTION-sans-sprint` · repenser la nav
