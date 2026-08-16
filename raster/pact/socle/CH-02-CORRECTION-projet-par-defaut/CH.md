# CH-02-CORRECTION — projet par défaut

**Type :** `CORRECTION`
**Cible :** BC `socle`

**Qualification :** l'app choisit `raster` comme projet par défaut, en dur. Depuis que le backlog Raster est vide, elle s'ouvre sur du vide alors qu'un autre projet porte tout le travail.

## Pourquoi

Un outil qui affiche « aucune task » alors qu'il en a 39 est un outil qu'on croit cassé. C'est arrivé le 2026-08-16, juste après le balayage : `nafura-platform 39 · raster 0 · sektor 0`, onglet actif `raster`.

Le défaut n'est pas le balayage — c'est d'avoir codé en dur le nom d'un projet dans le chrome. Le socle ne doit privilégier aucun projet : il n'en connaît pas la liste à l'avance.

## Aujourd'hui

`App.tsx` — `useState("raster")` à l'initialisation, plus deux `projects.includes("raster") ? "raster" : …` dans `setViewSafe` et dans le défaut de l'inbox.

La vue d'accueil est **Toi**, vide quand rien n'attend : les deux se cumulent et l'écran ne montre rien du tout.

## Attendu

Le projet par défaut est **celui qui porte du travail**, calculé au chargement. Aucun nom de projet en dur dans le socle.

Quand rien n'attend, l'état vide de **Toi** dit où regarder au lieu de s'arrêter là.

## Critères d'acceptation (gelés)

- **AC-1** Aucune occurrence littérale d'un nom de projet dans `sources/web/src/`.
- **AC-2** Au chargement, le projet sélectionné a au moins une task tant qu'un projet en a une.
- **AC-3** Tous les projets vides : l'app choisit le premier et n'affiche pas d'erreur.
- **AC-4** L'état vide de `Toi` renvoie vers le backlog et dit combien de tasks existent ailleurs.

## Preuves attendues

`raster/e2e/socle/` — le choix du défaut sur des listes construites (un projet peuplé parmi des vides, tous vides, aucun projet). Vérification navigateur pour AC-4.

## Hors périmètre

Mémoriser le dernier projet consulté · changer la vue d'accueil
