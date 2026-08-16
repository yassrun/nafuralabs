# CH-01-EVOL — spawn et worktree

**Type :** `EVOL`
**Cible :** BC `orchestration`
**Qualification :** le BC sait dire ce qui est lançable. Il ne sait pas lancer, ni isoler ce qu'il lancerait.

## Pourquoi

L'app affiche une fenêtre, des sous-lots lançables, et un bouton qui **copie un brief**. Tant qu'il faut coller ce brief à la main, l'autonomie s'arrête à ta présence — le contraire de l'intention du CADRE.

Et lancer sans isoler serait pire que ne pas lancer : deux agents dans le même répertoire de travail s'écrasent quelle que soit la branche, puisqu'il n'y a qu'un checkout. C'est le `git worktree` qui isole, pas la branche.

C'est aussi le seul Change qui **exécute** quelque chose. Le CADRE l'a tranché à RAS-78 : le dépôt suffit à lire, pas à exécuter. Un processus et une clé de modèle sont nécessaires, ils vivent hors du dépôt, et Raster refuse de démarrer plutôt que de les stocker.

## Aujourd'hui

`t.mjs window` donne la fenêtre. `OrchLaunchButton` copie un texte dans le presse-papier. Aucun worktree, aucun processus, aucun état d'exécution — donc pas de vue « ce qui tourne », le dernier constat de la revue resté ouvert.

## Attendu

- Un worktree et une branche par sous-lot, **hors du dépôt**, créés et retirés par commande
- Un processus par lot, lancé depuis l'app, suivi, arrêtable
- Une vue **Ce qui tourne** : qui tient quoi, depuis quand, avec sa sortie
- La commande d'agent vient de la configuration locale — jamais du dépôt

## Critères d'acceptation (gelés)

- **AC-1** Un worktree est créé **hors** de l'arbre du dépôt. Un worktree placé dedans ferait compter chaque task une fois par branche vivante — c'est un échec, pas un détail.
- **AC-2** Sans commande d'agent configurée, le spawn **refuse** et le dit. Il ne devine pas, il ne cherche pas de clé, il n'écrit aucun secret.
- **AC-3** Un lot déjà tenu ne peut pas être lancé une seconde fois.
- **AC-4** L'état d'exécution est **en mémoire**, jamais dans un fichier de task : un processus mort ne laisse pas un `doing` menteur.
- **AC-5** Arrêter un lot arrête son processus et libère le lot.
- **AC-6** Aucun agent ne pousse : le spawn ne fait ni `push`, ni merge automatique vers l'intégration.

## Preuves attendues

`raster/e2e/orchestration/` — worktree hors dépôt, refus sans configuration, double lancement refusé, état libéré à la sortie du processus. Les preuves utilisent une **commande inoffensive**, jamais un vrai agent.
