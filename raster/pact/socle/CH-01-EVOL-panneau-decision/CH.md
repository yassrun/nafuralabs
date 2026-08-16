# CH-01-EVOL — panneau de décision

**Type :** `EVOL`
**Cible :** BC `socle`
**Qualification :** l'app est le miroir d'un travail séquentiel qu'on pilote à la main. Le mode autonome demande l'inverse : ne rien piloter, tout arbitrer.

## Pourquoi

Revue du 16/08, huit constats. Trois manques structurants, une même racine — l'app n'a aucune notion d'**exécution** :

- **Le blocage n'existe pas.** `blocked_by` est affiché en gris dans le détail et nulle part ailleurs ; `status: blocked` est un enum posé à la main. Ni l'un ni l'autre n'est calculé, alors que `t.mjs ready` sait maintenant répondre.
- **Le parallélisme est impossible.** Tout le lancement est « copier un brief, coller dans Cursor ». Aucun état « ce sous-lot est tenu », aucune vue « ce qui tourne ».
- **La roadmap n'est nulle part**, et le lot n'est qu'un `<div>` de regroupement alors qu'il est devenu l'unité d'isolation.

Et le rapport de livraison — la seule chose qui dit ce qui a été décidé sans toi — **n'est jamais affiché** : l'app lit le frontmatter et jette le corps du `.md`.

## Aujourd'hui

`App.tsx` 1 407 lignes, `raster-api.ts` 502. Le serveur écrit les fichiers en direct (`fs.writeFileSync` l.297, l.451, l.487) et réimplémente l'allocation d'id (l.177) — deuxième chemin d'écriture, contre `AGENTS.md` §0.1-9. Les briefs pointent vers `nafura-spec` / `nafura-exec` / `nafura-qa`, qui n'existent pas.

## Attendu

L'app devient un tableau de bord d'arbitrage. Wireframe : [`ux/decision-wireframe.canvas.tsx`](../ux/decision-wireframe.canvas.tsx).

- Vue **Toi** en tête de nav : ce qui attend une décision, trié par ancienneté
- Détail : la **question** d'abord, puis le **rapport de livraison**, puis le reste replié
- Plus de sélecteur de statut — des actions : répondre, approuver, renvoyer
- Readiness affichée dans l'arbre : lançable · bloqué par · attend l'externe
- Le serveur ne fait plus qu'appeler `t.mjs`

## Critères d'acceptation (gelés)

- **AC-1** Une task `gate: me` en attente est visible **sans ouvrir le détail** : la vue Toi la porte, avec ce qu'on lui demande.
- **AC-2** Le détail d'une task en attente affiche sa section `## Question` et son `## Rapport de livraison`, lus depuis le `.md`.
- **AC-3** Aucun sélecteur ne propose `done-me`. L'approbation est une action, et elle n'apparaît que sur `done-agent` + `gate: me`.
- **AC-4** L'arbre marque chaque sous-lot lançable ou bloqué, avec la raison, d'après `t.mjs ready`.
- **AC-5** Le serveur n'écrit plus aucun fichier de task lui-même : toute mutation passe par les modules du CLI. Plus une seule allocation d'id dans `raster-api.ts`.
- **AC-6** Aucun brief ne référence un skill inexistant.

## Preuves attendues

`raster/e2e/socle/` — le contrat d'API (readiness, corps de task, refus propagés) sur les modules du CLI. La partie visuelle est prouvée par revue sur le canvas.
